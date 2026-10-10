// The MDR scenario engine — the same maths as notebook 4_model, written in TypeScript
// so the website can recalculate instantly when someone moves a slider.

// Every input a scenario needs (same names as the Python BASE dictionary)
export type Scenario = {
  name: string;
  rate_pct: number; // MDR rate, e.g. 0.4
  cap_inr: number; // max fee per payment, e.g. 300
  flat_fee_inr: number; // flat fee in fuel/telecom/insurance/railways, e.g. 5
  gst_pct: number; // GST on the MDR, e.g. 18
  start_date: string; // "2026-10-15"
  exempt_share_pct: number; // % of >₹2,000 value from exempt merchants
  flat_sector_share_pct: number; // % of >₹2,000 value in flat-fee sectors
  flat_sector_avg_ticket_inr: number; // average payment in those sectors
  capped_share_pct: number; // % of >₹2,000 value in payments of ₹75,000+
  capped_avg_ticket_inr: number; // average capped payment
  shift_away_pct: number; // % of big payments moved off UPI
  split_issuer_pct: number;
  split_acquirer_pct: number;
  split_app_pct: number;
  split_payer_psp_pct: number;
};

// Everything the engine returns (same names as the Python result)
export type Result = {
  scenario: string;
  pool_month_cr: number;
  pool_year_cr: number;
  months_in_fy27: number;
  pool_fy27_cr: number;
  gst_month_cr: number;
  merchant_cost_month_cr: number;
  effective_rate_on_p2m_pct: number;
  issuer_month_cr: number;
  acquirer_month_cr: number;
  app_month_cr: number;
  payer_psp_month_cr: number;
};

const CRORE = 1e7; // 1 crore = 10,000,000 rupees

// 0.4% of the value
export function standardFeeCr(valueCr: number, ratePct: number): number {
  return (valueCr * ratePct) / 100;
}

// ₹5 per payment: count the payments first, then multiply
export function flatFeeCr(valueCr: number, avgTicketInr: number, feeInr: number): number {
  const count = (valueCr * CRORE) / avgTicketInr; // how many payments
  return (count * feeInr) / CRORE; // back into crore
}

// 0.4% per payment, but never more than the cap
export function cappedFeeCr(valueCr: number, avgTicketInr: number, ratePct: number, capInr: number): number {
  const count = (valueCr * CRORE) / avgTicketInr;
  const feePerTxn = Math.min((avgTicketInr * ratePct) / 100, capInr);
  return (count * feePerTxn) / CRORE;
}

// Months the MDR is active between the start date and 31 March 2027
export function monthsActive(startDate: string, fyEnd = "2027-03-31"): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = (Date.parse(fyEnd) - Date.parse(startDate)) / msPerDay + 1;
  return Math.max(days, 0) / (365 / 12);
}

// The engine: same steps as run_scenario() in Python
export function runScenario(s: Scenario, baseCr: number, p2mCr: number): Result {
  const shares = s.exempt_share_pct + s.flat_sector_share_pct + s.capped_share_pct;
  if (shares > 100) {
    throw new Error("exempt + flat + capped shares cannot be more than 100%");
  }

  const baseAfterShift = baseCr * (1 - s.shift_away_pct / 100); // value still on UPI
  const flatCr = (baseAfterShift * s.flat_sector_share_pct) / 100;
  const cappedCr = (baseAfterShift * s.capped_share_pct) / 100;
  const standardCr = (baseAfterShift * (100 - shares)) / 100; // exempt part pays nothing

  const poolMonth =
    standardFeeCr(standardCr, s.rate_pct) +
    flatFeeCr(flatCr, s.flat_sector_avg_ticket_inr, s.flat_fee_inr) +
    cappedFeeCr(cappedCr, s.capped_avg_ticket_inr, s.rate_pct, s.cap_inr);

  const months = monthsActive(s.start_date);
  return {
    scenario: s.name,
    pool_month_cr: poolMonth,
    pool_year_cr: poolMonth * 12,
    months_in_fy27: months,
    pool_fy27_cr: poolMonth * months,
    gst_month_cr: (poolMonth * s.gst_pct) / 100,
    merchant_cost_month_cr: poolMonth * (1 + s.gst_pct / 100),
    effective_rate_on_p2m_pct: (poolMonth / p2mCr) * 100,
    issuer_month_cr: (poolMonth * s.split_issuer_pct) / 100,
    acquirer_month_cr: (poolMonth * s.split_acquirer_pct) / 100,
    app_month_cr: (poolMonth * s.split_app_pct) / 100,
    payer_psp_month_cr: (poolMonth * s.split_payer_psp_pct) / 100,
  };
}

// ---- Fee on one single payment (for the "try a payment" calculator) ----

export type MerchantKind = "standard" | "flat";

export type PaymentFee = {
  fee_inr: number; // MDR the merchant pays on this payment
  gst_inr: number; // GST on top of the MDR
  total_inr: number; // fee + GST
  effective_pct: number; // total as a % of the payment
  reason: string; // which rule applied, in plain words
};

// The confirmed NPCI rules: free up to ₹2,000; above that 0.4% capped at ₹300,
// or a flat ₹5 for railways, telecom, insurance and fuel. GST (18%, unverified) on top.
export function feeForPayment(
  amountInr: number,
  kind: MerchantKind,
  ratePct = 0.4,
  thresholdInr = 2000,
  capInr = 300,
  flatInr = 5,
  gstPct = 18,
): PaymentFee {
  let fee = 0;
  let reason = `Free: payments up to ₹${thresholdInr.toLocaleString("en-IN")} pay no fee`;
  if (amountInr > thresholdInr) {
    if (kind === "flat") {
      fee = flatInr;
      reason = `Flat ₹${flatInr} for railways, telecom, insurance and fuel`;
    } else if ((amountInr * ratePct) / 100 >= capInr) {
      fee = capInr;
      reason = `${ratePct}% would be more than ₹${capInr}, so the cap applies`;
    } else {
      fee = (amountInr * ratePct) / 100;
      reason = `${ratePct}% of the payment`;
    }
  }
  const gst = (fee * gstPct) / 100;
  const total = fee + gst;
  return {
    fee_inr: fee,
    gst_inr: gst,
    total_inr: total,
    effective_pct: amountInr > 0 ? (total / amountInr) * 100 : 0,
    reason,
  };
}

// ---- Sensitivity range (same grid as notebook 4_model) ----
// Every mix of 0-30% exempt and 5-30% hitting the cap; returns the lowest and highest yearly pool.
export function sensitivityRange(base: Scenario, baseCr: number, p2mCr: number): { low: number; high: number } {
  const years = [0, 10, 20, 30].flatMap((exempt) =>
    [5, 15, 30].map((capped) => runScenario({ ...base, exempt_share_pct: exempt, capped_share_pct: capped }, baseCr, p2mCr).pool_year_cr),
  );
  return { low: Math.min(...years), high: Math.max(...years) };
}
