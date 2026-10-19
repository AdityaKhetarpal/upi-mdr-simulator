// Instant answers worked out from the project's data, with no AI involved.
// Used when the AI key isn't set (or the AI fails), so "Ask the data" always gives a useful reply.

import { feeForPayment, runScenario, sensitivityRange, type Scenario } from "@/lib/model";
import policy from "@/public/data/policy.json";
import results from "@/public/data/scenario_results.json";
import inputs from "@/public/data/scenario_inputs.json";
import bands from "@/public/data/p2m_bands.json";

const inr = (n: number, d = 0) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
const cr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")} crore`;

const above = bands.find((b) => b.band === "above_2000")!;
const BASE_CR = above.band_value_cr;
const P2M_CR = (above.band_value_cr * 100) / above.share_of_p2m_value_pct;
const BASE = inputs[0] as Scenario;

// "₹50,000", "50000", "1.5 lakh", "2 lakh" -> rupees
export function findAmount(q: string): number | null {
  const lakh = q.match(/(\d+(?:\.\d+)?)\s*(lakh|lac|l)\b/i);
  if (lakh) return Math.round(parseFloat(lakh[1]) * 100000);
  const k = q.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (k) return Math.round(parseFloat(k[1]) * 1000);
  const num = q.match(/₹?\s?(\d{1,3}(?:,\d{2,3})+|\d{3,})/);
  if (num) return Number(num[1].replace(/,/g, ""));
  return null;
}

const has = (q: string, words: string[]) => words.some((w) => q.includes(w));

export function quickAnswer(question: string): string | null {
  const q = question.toLowerCase();

  // 1. A payment amount: work out the fee on it
  const amount = findAmount(question);
  if (amount !== null && amount > 0 && !has(q, ["crore", "lakh crore", "month", "year"])) {
    const flat = has(q, ["fuel", "petrol", "telecom", "insurance", "rail", "train"]);
    const r = feeForPayment(amount, flat ? "flat" : "standard");
    if (r.fee_inr === 0) return `No fee. A ${inr(amount)} payment is at or below ₹2,000, so the merchant pays nothing [RULES].`;
    return `On a ${inr(amount)} payment the merchant pays ${inr(r.fee_inr, 2)} as fee plus ${inr(r.gst_inr, 2)} GST, ${inr(r.total_inr, 2)} in total (${r.effective_pct.toFixed(2)}% of the payment). Rule used: ${r.reason.toLowerCase()} [RULES]. The 18% GST is reported, not yet confirmed.`;
  }

  // 2. Start date / delay
  if (has(q, ["january", "jan ", "delay", "defer", "postpon", "start date", "when does", "when will"])) {
    const now = results[0], later = results[1];
    const original = results.find((r) => r.scenario.startsWith("Original"))!;
    return `The fee was due on 15 Oct 2026, but on 13 Oct NPCI deferred it to "immediately post Diwali", on a date still to be notified; the rates did not change [RULES]. Assuming a 9 Nov start, it raises about ${cr(now.pool_fy27_cr)} in FY 2026-27 (${now.months_in_fy27.toFixed(1)} months), against ${cr(original.pool_fy27_cr)} under the original October plan. If it slips again to 1 Jan 2027, about ${cr(later.pool_fy27_cr)} (${later.months_in_fy27.toFixed(1)} months). The monthly amount is the same, about ${cr(now.pool_month_cr)} [SCENARIOS]. These are estimates.`;
  }

  // 3. Who gets the money
  if (has(q, ["split", "who gets", "who receives", "who earns", "bank", "share of the fee", "app get"])) {
    const r = results[0];
    return `Of about ${cr(r.pool_month_cr)} a month: the customer's bank gets ${cr(r.issuer_month_cr)} (40%), the merchant's bank ${cr(r.acquirer_month_cr)} (30%), the payment app ${cr(r.app_month_cr)} (20%) and the payer's PSP bank ${cr(r.payer_psp_month_cr)} (10%) [SCENARIOS]. This split is reported, not confirmed.`;
  }

  // 4. Confirmed vs assumed
  if (has(q, ["confirm", "assum", "sure", "verified", "reliable", "trust"])) {
    const list = (s: string) => policy.filter((p) => p.status === s).map((p) => p.parameter.replaceAll("_", " ")).join(", ");
    return `Confirmed: ${list("confirmed")}. Reported only: ${list("reported")}. Unverified: ${list("unverified")} [RULES]. On top of these, the shares of exempt, capped and flat-fee value are this project's own assumptions, which you can change in the Scenario lab [SCENARIOS].`;
  }

  // 5. Totals
  if (has(q, ["total", "raise", "collect", "how much money", "pool", "revenue", "per year", "a year", "annual"])) {
    const r = results[0];
    const { low, high } = sensitivityRange(BASE, BASE_CR, P2M_CR);
    return `About ${cr(r.pool_month_cr)} a month, or ${cr(r.pool_year_cr)} a year in the base scenario. Depending on how much value is exempt or capped, a full year could be anywhere from ${cr(low)} to ${cr(high)} [SCENARIOS]. These are estimates from NPCI's August 2026 data, not forecasts.`;
  }

  // 6. The basic rules
  if (has(q, ["rate", "cap", "maximum", "threshold", "free", "how much is the fee", "what is mdr", "mdr"])) {
    return `Merchants pay 0.4% on UPI payments above ₹2,000, capped at ₹300 per payment (reached at ₹75,000). Fuel, telecom, insurance and railway payments above ₹2,000 pay a flat ₹5. Payments up to ₹2,000 and person-to-person transfers stay free, and customers pay nothing [RULES].`;
  }

  // 7. Why merchants pay less than 0.4% overall
  if (has(q, ["effective", "really pay", "actually pay", "average"])) {
    const r = runScenario(BASE, BASE_CR, P2M_CR);
    return `Across all their UPI takings, merchants pay about ${r.effective_rate_on_p2m_pct.toFixed(2)}%, not 0.4%, because ${100 - above.share_of_p2m_value_pct}% of merchant payment value is in payments of ₹2,000 or less, which stay free [BANDS][SCENARIOS].`;
  }

  return null; // not one we can answer without the AI
}
