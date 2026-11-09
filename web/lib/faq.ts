// The Overview page's FAQ: real questions people search about the UPI MDR,
// each answered in two or three sentences using only this project's data.
import { crore, inr, rule, BASE_RESULT, RANGE, UPDATED, EXAMPLE_AMOUNT, EXAMPLE_FEE } from "@/lib/facts";
import { dateText } from "@/lib/seo";
import type { FaqItem } from "@/components/Faq";

export function upiFaq(): FaqItem[] {
  const rate = rule("mdr_rate_standard");
  const cap = Number(rule("mdr_cap"));
  const free = Number(rule("threshold_amount"));
  const flat = rule("flat_fee_sectors");
  const p2pm = Number(rule("p2pm_receipt_limit"));
  const fund = rule("small_merchant_fund");

  return [
    {
      q: "What is the UPI Merchant Discount Rate (MDR)?",
      a: `It is a fee the shop (merchant) pays on a UPI payment. Under NPCI's rules, payments above ${inr(free)} are charged ${rate}% of the payment, capped at ${inr(cap)} per payment, and payments up to ${inr(free)} stay free. Railways, telecom, insurance, fuel, farm inputs and utilities pay a flat ${inr(Number(flat))} instead.`,
    },
    {
      q: "When does the UPI MDR start?",
      a: `It was due on ${dateText(rule("start_date_original"))}. On 13 October 2026 NPCI deferred it to "immediately post Diwali", and as of ${UPDATED} no start date had been notified. The rates themselves have not changed.`,
    },
    {
      q: `How much MDR does a shop pay on a ${inr(EXAMPLE_AMOUNT)} UPI payment?`,
      a: `${inr(EXAMPLE_FEE.fee_inr)} (${rate}% of ${inr(EXAMPLE_AMOUNT)}), plus ${inr(EXAMPLE_FEE.gst_inr)} if 18% GST applies, so ${inr(EXAMPLE_FEE.total_inr)} in total. The 18% GST is reported but not yet confirmed. Above ${inr(cap / (Number(rate) / 100))} the fee stops growing at ${inr(cap)}.`,
    },
    {
      q: "Do customers pay the UPI MDR?",
      a: "No. The fee is charged to the merchant, and paying by UPI stays free for customers.",
    },
    {
      q: "Which merchants don't pay the UPI MDR?",
      a: `Every payment up to ${inr(free)} is free for everyone. Small merchants on person-to-merchant (P2PM) accounts stay free until they receive ${inr(p2pm)} or more a month for three months. A turnover exemption for businesses under ₹40 lakh a year was reported but not adopted.`,
    },
    {
      q: "How much money will the UPI MDR raise in a year?",
      a: `This site estimates about ${crore(BASE_RESULT.pool_year_cr)} a year in its base case, likely between ${crore(RANGE.low)} and ${crore(RANGE.high)}, using NPCI's August 2026 merchant data. That is about ${BASE_RESULT.effective_rate_on_p2m_pct.toFixed(2)}% of all merchant UPI value. It is this site's estimate, not an NPCI figure.`,
    },
    {
      q: "Who gets the UPI MDR money?",
      a: `Media reports of NPCI's circular say the customer's bank gets 40%, the merchant's bank 30%, the UPI app 20% and the app's bank 10%. That split is reported, not confirmed. ${fund}% of every player's share goes into a fund for small merchants, which is confirmed.`,
    },
    {
      q: "Is GST charged on top of the UPI MDR?",
      a: "Reports say 18% GST applies on top of the fee, but this has not been confirmed by the government yet, so this site labels it unverified and shows the fee with and without it.",
    },
  ];
}
