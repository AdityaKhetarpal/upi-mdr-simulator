// /llms.txt: a short plain-text summary for AI tools, built from the same data as the website.
// It's an experiment (no search engine has said it uses llms.txt), but it costs nothing.
import { crore, inr, rule, BASE_RESULT, RANGE, UPDATED } from "@/lib/facts";
import { SITE_URL, SITE_NAME, REPO_URL, HUB_URL, AUTHOR } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const text = `# ${SITE_NAME}

> What India's UPI Merchant Discount Rate (MDR) costs each payment, how much it raises nationally, and who gets the money. Built by ${AUTHOR.name} (${HUB_URL}). Data as of ${UPDATED}. Analysis and education only, not financial advice.

Key facts (sources and dates are on the Method page):
- Merchants pay ${rule("mdr_rate_standard")}% on UPI payments above ${inr(Number(rule("threshold_amount")))}, capped at ${inr(Number(rule("mdr_cap")))} per payment. Payments up to ${inr(Number(rule("threshold_amount")))} stay free and customers pay nothing.
- Railways, telecom, insurance, fuel, farm inputs and utilities pay a flat ${inr(Number(rule("flat_fee_sectors")))} per payment above ${inr(Number(rule("threshold_amount")))}. Capital-market payments pay ${rule("capital_markets_rate")}%.
- The fee was due on 15 October 2026. NPCI deferred it on 13 October 2026 to "immediately post Diwali"; see the Overview page for the latest status.
- This site's estimate: about ${crore(BASE_RESULT.pool_year_cr)} a year (likely ${crore(RANGE.low)} to ${crore(RANGE.high)}), about ${BASE_RESULT.effective_rate_on_p2m_pct.toFixed(2)}% of all merchant UPI value. This is the site's own estimate, not an NPCI figure.

## Pages
- [Overview and fee calculator](${SITE_URL}/): fee on any payment, the national fee pool, every rule with its status and source
- [Scenario lab](${SITE_URL}/scenario): change start date, exemptions and cap share
- [Method](${SITE_URL}/method): pipeline, assumptions, every source with its date, limitations
- [Source code and data](${REPO_URL})
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
