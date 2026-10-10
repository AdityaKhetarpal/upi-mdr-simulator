import json
from pathlib import Path
import duckdb
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent  
RAW = ROOT / "data" / "raw"  # input CSVs
OUT = ROOT / "web" / "public" / "data"  
DB = ROOT / "data" / "fintech.duckdb"  

FY_END = "2027-03-31"  # end of financial year 2026-27


# acquire
def load_monthly() -> pd.DataFrame:
    data = pd.read_csv(RAW / "upi_monthly_npci_reported.csv")  # one row per month
    data["month"] = pd.to_datetime(data["month"] + "-01")  # change 2025-09 -> 2025-09-01
    data["volume_mn"] = data["volume_bn"] * 1000  # converts billion to million
    data["value_cr"] = data["value_lakh_cr"] * 100000  # lakh crore -> crore
    data["avg_ticket_inr"] = (data["value_cr"] * 1e7) / (data["volume_mn"] * 1e6)  # rupees per payment
    return data


# clean and check
def check_monthly(data: pd.DataFrame) -> pd.DataFrame:
    assert data[["volume_bn", "value_lakh_cr"]].notna().all().all(), "missing monthly numbers"
    assert not data["month"].duplicated().any(), "duplicate months"
    months = pd.date_range(data["month"].min(), data["month"].max(), freq="MS")
    assert set(months) == set(data["month"]), "gap in the monthly series"

    data = data.sort_values("month").reset_index(drop=True)
    data["volume_mom_pct"] = data["volume_mn"].pct_change() * 100  # % change in volume
    data["value_mom_pct"] = data["value_cr"].pct_change() * 100  # % change in value
    data["check_me"] = (data["volume_mom_pct"].abs() > 15) | (data["value_mom_pct"].abs() > 15) # a jump above 15% is usually a typo or a wrong unit
    if data["check_me"].any():
        print("WARNING - check these months:", data.loc[data["check_me"], "month"].dt.strftime("%Y-%m").tolist())
    return data


def load_policy() -> pd.DataFrame:
    data = pd.read_csv(RAW / "mdr_policy_parameters.csv", dtype=str)  
    data["value_num"] = pd.to_numeric(data["value"], errors="coerce")  
    data["value_date"] = pd.to_datetime(data["value"], errors="coerce", format="%Y-%m-%d")  
    assert (data["value_num"].notna() ^ data["value_date"].notna()).all(), "a rule has no usable value"
    assert set(data["status"]) <= {"confirmed", "reported", "unverified"}, "unknown status label"
    data["status_note"] = data["status_note"].fillna("")
    return data


def load_bands() -> pd.DataFrame:
    data = pd.read_csv(RAW / "p2m_ticket_bands_npci_reported.csv")
    data["month"] = pd.to_datetime(data["month"] + "-01")
    assert data["share_of_p2m_value_pct"].sum() == 100, "ticket bands must add to 100%"
    data["band_value_cr"] = data["p2m_value_lakh_cr"] * 100000 * data["share_of_p2m_value_pct"] / 100
    return data


# store in DuckDB and run SQL
def to_duckdb(monthly: pd.DataFrame, policy: pd.DataFrame, bands: pd.DataFrame) -> duckdb.DuckDBPyConnection:
    con = duckdb.connect(str(DB))
    con.execute("CREATE OR REPLACE TABLE upi_monthly_clean AS SELECT * FROM monthly")
    con.execute("CREATE OR REPLACE TABLE mdr_policy_clean AS SELECT * FROM policy")
    con.execute("CREATE OR REPLACE TABLE p2m_bands AS SELECT * FROM bands")
    return con

# scenario engine 
def standard_fee_cr(value_cr, rate_pct):
    return value_cr * rate_pct / 100  # 0.4% of the value


def flat_fee_cr(value_cr, avg_ticket_inr, fee_inr):
    count = value_cr * 1e7 / avg_ticket_inr  
    return count * fee_inr / 1e7  


def capped_fee_cr(value_cr, avg_ticket_inr, rate_pct, cap_inr):
    count = value_cr * 1e7 / avg_ticket_inr
    fee_per_txn = min(avg_ticket_inr * rate_pct / 100, cap_inr)  # 0.4% but at most ₹300
    return count * fee_per_txn / 1e7


def months_active(start_date, fy_end=FY_END):
    days = (pd.Timestamp(fy_end) - pd.Timestamp(start_date)).days + 1
    return max(days, 0) / (365 / 12)


def run_scenario(s, base_cr, p2m_cr):
    shares = s["exempt_share_pct"] + s["flat_sector_share_pct"] + s["capped_share_pct"]
    if shares > 100:
        raise ValueError("exempt + flat + capped shares cannot be more than 100%")
    base_after_shift = base_cr * (1 - s["shift_away_pct"] / 100)
    flat_cr = base_after_shift * s["flat_sector_share_pct"] / 100
    capped_cr = base_after_shift * s["capped_share_pct"] / 100
    standard_cr = base_after_shift * (100 - shares) / 100
    pool_month = (
        standard_fee_cr(standard_cr, s["rate_pct"])
        + flat_fee_cr(flat_cr, s["flat_sector_avg_ticket_inr"], s["flat_fee_inr"])
        + capped_fee_cr(capped_cr, s["capped_avg_ticket_inr"], s["rate_pct"], s["cap_inr"])
    )
    months = months_active(s["start_date"])
    return {
        "scenario": s["name"],
        "pool_month_cr": pool_month,
        "pool_year_cr": pool_month * 12,
        "months_in_fy27": months,
        "pool_fy27_cr": pool_month * months,
        "gst_month_cr": pool_month * s["gst_pct"] / 100,
        "merchant_cost_month_cr": pool_month * (1 + s["gst_pct"] / 100),
        "effective_rate_on_p2m_pct": pool_month / p2m_cr * 100,
        "issuer_month_cr": pool_month * s["split_issuer_pct"] / 100,
        "acquirer_month_cr": pool_month * s["split_acquirer_pct"] / 100,
        "app_month_cr": pool_month * s["split_app_pct"] / 100,
        "payer_psp_month_cr": pool_month * s["split_payer_psp_pct"] / 100,
    }


def build_scenarios(policy: pd.DataFrame) -> list[dict]:
    rule = lambda name: float(policy.loc[policy["parameter"] == name, "value_num"].iloc[0])  # noqa: E731
    base = {
        "name": "Base: starts 15 Oct 2026",
        "rate_pct": rule("mdr_rate_standard"),  # confirmed
        "cap_inr": rule("mdr_cap"),  # confirmed
        "flat_fee_inr": rule("flat_fee_sectors"),  # confirmed
        "gst_pct": rule("gst_on_mdr"),  # unverified
        "start_date": "2026-10-15",
        "exempt_share_pct": 10,  # ASSUMPTION
        "flat_sector_share_pct": 10,  # ASSUMPTION
        "flat_sector_avg_ticket_inr": 5000,  # ASSUMPTION
        "capped_share_pct": 15,  # ASSUMPTION
        "capped_avg_ticket_inr": 150000,  # ASSUMPTION
        "shift_away_pct": 0,  # ASSUMPTION
        "split_issuer_pct": rule("split_issuer"),
        "split_acquirer_pct": rule("split_acquirer"),
        "split_app_pct": rule("split_app"),
        "split_payer_psp_pct": rule("split_payer_psp"),
    }
    base = {k: (int(v) if isinstance(v, float) and v.is_integer() else v) for k, v in base.items()}
    return [
        base,
        {**base, "name": "Deferred: starts 1 Jan 2027", "start_date": "2027-01-01"},
        {**base, "name": "Deferred + ₹40 lakh turnover exemption", "start_date": "2027-01-01", "exempt_share_pct": 25},
        {**base, "name": "More big-ticket payments hit the cap", "capped_share_pct": 30},
        {**base, "name": "Merchants push 20% of big payments off UPI", "shift_away_pct": 20},
    ]


def self_test(scenarios, base_cr, p2m_cr):
    # the same checks as notebook 04 - stop the pipeline if the maths is wrong
    base = scenarios[0]
    assert run_scenario({**base, "rate_pct": 0, "flat_fee_inr": 0}, base_cr, p2m_cr)["pool_month_cr"] == 0
    r = run_scenario(base, base_cr, p2m_cr)
    players = r["issuer_month_cr"] + r["acquirer_month_cr"] + r["app_month_cr"] + r["payer_psp_month_cr"]
    assert abs(players - r["pool_month_cr"]) < 1e-6, "player split does not add up to the pool"
    assert run_scenario(scenarios[1], base_cr, p2m_cr)["pool_fy27_cr"] < r["pool_fy27_cr"], "later start should raise less"


# export JSON for the website
def save_json(data: pd.DataFrame, name: str):
    path = OUT / f"{name}.json"
    data.to_json(path, orient="records", indent=2, force_ascii=False)
    print(f"  {name}.json - {len(data)} rows, {path.stat().st_size:,} bytes")


def export(con, scenarios, results, start_date_status, data_updated):
    OUT.mkdir(parents=True, exist_ok=True)

    data = con.execute("""
        SELECT strftime(month, '%Y-%m') AS month, volume_mn, value_cr,
               ROUND(avg_ticket_inr, 0) AS avg_ticket_inr,
               ROUND(volume_mom_pct, 1) AS volume_mom_pct,
               ROUND(value_mom_pct, 1)  AS value_mom_pct,
               source_name, source_url
        FROM upi_monthly_clean ORDER BY month
    """).df()
    save_json(data, "monthly_trend")

    data = con.execute("""
        SELECT parameter, value, unit, status, status_note,
               REPLACE(source, 'fintech skill baseline', 'earlier reports') AS source, as_of
        FROM mdr_policy_clean ORDER BY parameter
    """).df()
    save_json(data, "policy")

    data = con.execute("""
        SELECT strftime(month, '%Y-%m') AS month, band, share_of_p2m_value_pct,
               ROUND(band_value_cr, 0) AS band_value_cr, source, status
        FROM p2m_bands
    """).df()
    save_json(data, "p2m_bands")

    save_json(pd.DataFrame(scenarios), "scenario_inputs")
    save_json(pd.DataFrame(results).round(4), "scenario_results")

    meta = {
        "project": "UPI MDR Impact Simulator",
        "data_updated": data_updated,  
        "start_date_status": start_date_status,
        "disclaimer": "Analysis and education only. Not investment, legal or business advice.",
    }
    (OUT / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print("  meta.json")


def main():
    print("1. Loading and checking raw data")
    monthly = check_monthly(load_monthly())
    policy = load_policy()
    bands = load_bands()

    print("2. Writing DuckDB tables")
    con = to_duckdb(monthly, policy, bands)

    print("3. Running the scenario engine")
    above = bands.loc[bands["band"] == "above_2000"].iloc[0]
    base_cr = float(above["band_value_cr"])  # P2M value above ₹2,000 per month
    p2m_cr = float(above["p2m_value_lakh_cr"]) * 100000  # all P2M value per month
    scenarios = build_scenarios(policy)
    self_test(scenarios, base_cr, p2m_cr)
    results = [run_scenario(s, base_cr, p2m_cr) for s in scenarios]
    print(f"  base: ₹{results[0]['pool_month_cr']:,.0f} cr a month, ₹{results[0]['pool_fy27_cr']:,.0f} cr in FY 2026-27")

    alt = policy.loc[policy["parameter"] == "start_date_alternative"].iloc[0]
    status = f"15 Oct 2026 scheduled; delay to 1 Jan 2027 {alt['status']} ({alt['status_note']})"

    print("4. Exporting JSON for the website")
    newest = max(policy["as_of"].max(), "2026-10-09")  # date the monthly series was collected
    export(con, scenarios, results, status, newest)
    con.close()
    print("Done.")


if __name__ == "__main__":
    main()
