// The headline facts, worked out once from the data files.
// The Overview page, the FAQ and llms.txt all read from here, so the weekly
// data refresh updates every place at the same time.
import { feeForPayment, sensitivityRange, type Scenario } from "@/lib/model";
import results from "@/public/data/scenario_results.json";
import inputs from "@/public/data/scenario_inputs.json";
import policy from "@/public/data/policy.json";
import bands from "@/public/data/p2m_bands.json";
import meta from "@/public/data/meta.json";
import { dateText } from "@/lib/seo";

// ₹21587.4 -> "₹21,587 crore"
export const crore = (v: number) => "₹" + Math.round(v).toLocaleString("en-IN") + " crore";
// 25000 -> "₹25,000"
export const inr = (v: number, d = 0) => "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });

// starting numbers from NPCI's August 2026 data (same as the Overview page)
const above2000 = bands.find((b) => b.band === "above_2000")!;
export const BASE_CR = above2000.band_value_cr;
export const P2M_CR = (above2000.band_value_cr * 100) / above2000.share_of_p2m_value_pct;

export const BASE_RESULT = results[0];
export const RANGE = sensitivityRange(inputs[0] as Scenario, BASE_CR, P2M_CR);

// one rule's value from policy.json, e.g. rule("mdr_cap") -> "300"
export function rule(key: string): string {
  return policy.find((p) => p.parameter === key)!.value;
}

export const UPDATED = dateText(meta.data_updated);

// the worked example used in the FAQ: a ₹25,000 payment at a normal shop
export const EXAMPLE_AMOUNT = 25000;
export const EXAMPLE_FEE = feeForPayment(EXAMPLE_AMOUNT, "standard");
