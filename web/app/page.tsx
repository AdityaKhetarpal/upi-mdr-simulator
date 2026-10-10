// Overview page: one payment first (the hero), then the national totals, then the rules
import FeeCalculator from "@/components/FeeCalculator";
import TrendChart from "@/components/TrendChart";
import HBars from "@/components/HBars";
import { sensitivityRange, type Scenario } from "@/lib/model";
import results from "@/public/data/scenario_results.json";
import inputs from "@/public/data/scenario_inputs.json";
import policy from "@/public/data/policy.json";
import bands from "@/public/data/p2m_bands.json";
import trend from "@/public/data/monthly_trend.json";

// ₹21587.4 -> "₹21,587 cr"
const crore = (v: number) => "₹" + Math.round(v).toLocaleString("en-IN") + " cr";

// starting numbers from NPCI's August 2026 data
const above2000 = bands.find((b) => b.band === "above_2000")!;
const BASE_CR = above2000.band_value_cr;
const P2M_CR = (above2000.band_value_cr * 100) / above2000.share_of_p2m_value_pct;

// the same sensitivity grid as notebook 4_model: exempt 0-30%, capped 5-30%
const { low: LOW, high: HIGH } = sensitivityRange(inputs[0] as Scenario, BASE_CR, P2M_CR);

// the rules shown in the table: [data key, plain name, how to show the value]
const RULES: [string, string, (v: string) => string][] = [
  ["mdr_rate_standard", "Fee rate", (v) => `${v}% of the payment`],
  ["threshold_amount", "Free up to", (v) => `₹${Number(v).toLocaleString("en-IN")} per payment`],
  ["mdr_cap", "Maximum fee per payment", (v) => `₹${v}, reached at ₹75,000`],
  ["flat_fee_sectors", "Fuel, telecom, insurance, rail", (v) => `Flat ₹${v} per payment above ₹2,000`],
  ["p2pm_receipt_limit", "Small merchants stay free", (v) => `Until they receive ₹${Number(v).toLocaleString("en-IN")}+ a month for 3 months`],
  ["start_date", "Start date", (v) => dateText(v)],
  ["start_date_alternative", "Possible later start", (v) => dateText(v)],
  ["turnover_exemption", "Turnover exemption", () => "Businesses under ₹40 lakh a year"],
  ["gst_on_mdr", "GST on the fee", (v) => `${v}% on top of the fee`],
];

// "2026-10-15" -> "15 Oct 2026"
function dateText(v: string): string {
  return new Date(v + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// band colours: the two free bands in blue, the charged band in orange
const BAND_STYLE: Record<string, { color: string; name: string }> = {
  "0-500": { color: "var(--free-light)", name: "Up to ₹500" },
  "501-2000": { color: "var(--free)", name: "₹501 to ₹2,000" },
  above_2000: { color: "var(--fee)", name: "Above ₹2,000" },
};

export default function Home() {
  const base = results[0];
  const pos = (v: number) => ((v - 10000) / (30000 - 10000)) * 100; // ₹10k–30k cr track

  return (
    <>
      {/* ---------- hero: one payment ---------- */}
      <h1>Above ₹2,000, UPI stops being free for merchants.</h1>
      <p className="lead">
        A 0.4% merchant fee starts on 15 October 2026, or 1 January 2027 if NPCI&apos;s reported delay goes ahead.
        Customers still pay nothing. Try a payment to see what the shop pays.
      </p>
      <FeeCalculator />

      {/* ---------- the national total ---------- */}
      <section className="section">
        <div className="section-head">
          <h2>What the fee could raise in a year</h2>
          <p>Estimated from NPCI&apos;s August 2026 merchant data. A range, because NPCI has not said how much is exempt.</p>
        </div>
        <div className="stats">
          <div className="stat">
            <p className="stat-label">Per month</p>
            <p className="stat-value">{crore(base.pool_month_cr)}</p>
            <p className="stat-note">Base scenario</p>
          </div>
          <div className="stat">
            <p className="stat-label">Per year</p>
            <p className="stat-value">{crore(base.pool_year_cr)}</p>
            <p className="stat-note">Likely between {crore(LOW)} and {crore(HIGH)}</p>
          </div>
          <div className="stat">
            <p className="stat-label">What merchants really pay</p>
            <p className="stat-value">{base.effective_rate_on_p2m_pct.toFixed(2)}%</p>
            <p className="stat-note">of all their UPI takings, not 0.4%</p>
          </div>
        </div>

        <div className="panel range" aria-label={`Yearly fee pool range ${crore(LOW)} to ${crore(HIGH)}, base ${crore(base.pool_year_cr)}`}>
          <div className="range-track">
            <div className="range-fill" style={{ left: `${pos(LOW)}%`, width: `${pos(HIGH) - pos(LOW)}%` }} />
            <div className="range-dot" style={{ left: `${pos(base.pool_year_cr)}%` }} />
            <span className="range-tag" style={{ left: `${pos(base.pool_year_cr)}%` }}>Base {crore(base.pool_year_cr)}</span>
          </div>
          <div className="range-ends"><span>₹10,000 cr</span><span>₹30,000 cr a year</span></div>
          <p className="note">
            Shaded: every combination of 0–30% exempt merchants and 5–30% of value hitting the ₹300 cap.
          </p>
        </div>
      </section>

      {/* ---------- why: where the money sits, and how fast UPI is growing ---------- */}
      <section className="section grid-2">
        <div className="panel">
          <h3>Most payments are small, but most money is in big ones</h3>
          <p className="note" style={{ marginTop: 6 }}>Share of merchant (P2M) UPI value by payment size, August 2026</p>
          <div className="share-bar" role="img" aria-label="16% up to ₹500, 17% ₹501 to ₹2,000, 67% above ₹2,000">
            {bands.map((b) => (
              <div key={b.band} style={{ width: `${b.share_of_p2m_value_pct}%`, background: BAND_STYLE[b.band].color }} />
            ))}
          </div>
          <ul className="share-legend">
            {bands.map((b) => (
              <li key={b.band}>
                <strong>{b.share_of_p2m_value_pct}%</strong>
                <i style={{ background: BAND_STYLE[b.band].color }} />
                {BAND_STYLE[b.band].name}
              </li>
            ))}
          </ul>
          <p className="note">
            Payments above ₹2,000 are only about 4% of merchant payments by count, but 67% of the money.
            Source: NPCI via Business Today, 17 Sep 2026 (rounded figures).
          </p>
        </div>

        <div className="panel">
          <h3>UPI value per month, ₹ lakh crore</h3>
          <p className="note" style={{ marginTop: 6, marginBottom: 8 }}>Hover for the exact month</p>
          <TrendChart rows={trend} />
          <p className="note">Source: NPCI monthly figures as reported by news outlets (links in the data file).</p>
        </div>
      </section>

      {/* ---------- scenarios ---------- */}
      <section className="section">
        <div className="section-head">
          <h2>Money raised in this financial year</h2>
          <p>FY 2026-27 ends 31 March 2027, so a later start leaves fewer months of fees.</p>
        </div>
        <div className="panel">
          <HBars
            color="var(--fee)"
            rows={results.map((r) => ({
              label: r.scenario,
              value: r.pool_fy27_cr,
              display: crore(r.pool_fy27_cr),
              sub: `${r.months_in_fy27.toFixed(1)} months of fees`,
            }))}
          />
        </div>
      </section>

      {/* ---------- the rules ---------- */}
      <section className="section">
        <div className="section-head">
          <h2>The rules, and how sure we are</h2>
          <p>Confirmed means NPCI or the government said it. Reported means news reports only.</p>
        </div>
        <div className="panel table-wrap" style={{ padding: 8 }}>
          <table className="wide">
            <thead>
              <tr><th>Rule</th><th>Value</th><th>Status</th><th>Source</th></tr>
            </thead>
            <tbody>
              {RULES.map(([key, name, show]) => {
                const p = policy.find((x) => x.parameter === key)!;
                return (
                  <tr key={key}>
                    <td>{name}</td>
                    <td>{show(p.value)}</td>
                    <td>
                      <span className={`badge badge-${p.status}`}>{p.status}</span>
                      {p.status_note && <div className="muted">{p.status_note}</div>}
                    </td>
                    <td className="muted">{p.source}, {p.as_of}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
