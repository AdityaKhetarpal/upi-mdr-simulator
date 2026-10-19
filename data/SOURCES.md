# Data sources — UPI MDR Impact Simulator

Log of every file in `data/raw/`: where it came from, when, and its status.

## upi_monthly_npci_reported.csv
- What: UPI monthly transaction volume (billion) and value (₹ lakh crore), Sep 2025 – Sep 2026.
- Where: news reports that cite NPCI monthly data. The source URL is on every row.
- Collected: 9 Oct 2026.
- Status: **secondary source**. NPCI's own statistics page loads only in a browser, so these figures were not read from NPCI directly.
- To do: open npci.org.in → What We Do → UPI → Product Statistics, check each month against NPCI's own table, and fix any differences.
- Known differences: March 2026 value is 29.53 (IANS) vs 29.52 (another outlet); we use 29.53. January 2026 volume is rounded to 21.7 in the source.
- Terms: news articles; we use only the numbers, with attribution.

## mdr_policy_parameters.csv
- What: UPI MDR rules (rate, threshold, cap, sector fees, exemptions, revenue split, GST).
- Where: NPCI statement (16 Sep 2026) as reported by ANI; NPCI FAQ as summarised by SCC Online; later news on deferral and exemptions.
- Collected: 9 Oct 2026.
- Status: each row has its own label: confirmed / reported / unverified.
- To do: check against the DFS/NPCI FAQ PDF. Update after the UPI Steering Committee decision of 9 Oct 2026 on the start date.

## Still needed (not yet collected)
- NPCI ecosystem statistics: P2P vs P2M split, by value and volume.
- Ticket-size distribution of P2M payments (share of value above ₹2,000). Without this, the MDR pool can only be shown as a range.
- RBI Payment System Indicators: published as chart pages and PDFs. Monthly PDFs: https://rbi.org.in/Scripts/TrendsPSIUserView.aspx

## p2m_ticket_bands_npci_reported.csv (created in notebook 02)
- What: August 2026 P2M value split by ticket size: ≤₹500 about 16%, ₹501–2,000 about 17%, above ₹2,000 about 67%. Total P2M about ₹8.95 lakh crore (about 30% of UPI value). Above-₹2,000 payments are about 4% of the P2M count.
- Where: NPCI data as reported by Business Today, 17 Sep 2026: https://bazaar.businesstoday.in/trending/story/upi-mdr-implementation-before-launch-data-shows-67-percent-p2m-payment-value-comes-from-transactions-above-2000-rupees-in-august-2026-1451978-2026-09-17
- Collected: 9 Oct 2026.
- Status: **reported** (rounded "about" figures; one month only).
- To do: find NPCI's own table and more months, so the share can move over time.

## How these files are used
`python pipeline/build_data.py` reads the three CSVs in `data/raw/`, checks them, and writes the website data to `web/public/data/`. Edit a CSV row (for example when NPCI confirms the start date), re-run the pipeline, and the whole site updates.

## Start-date check log
- 10 Oct 2026: NPCI decision on deferral to 1 Jan 2027 still not announced (BW Businessworld, Kotak Neo). `start_date_alternative` kept as reported.

### Update, 19 Oct 2026: the deferral
- **13 Oct 2026:** NPCI's UPI and Services Steering Committee deferred the MDR, due 15 Oct, to "immediately post Diwali at a date to be notified separately"; a source said there is no change to the MDR structure. [Business Standard](https://www.business-standard.com/finance/news/upi-mdr-deferred-until-after-diwali-new-date-to-be-notified-npci-126101300556_1.html), [MediaNama](https://www.medianama.com/2026/10/223-npci-delays-upi-mdr-festive-season/), [WION](https://www.wionews.com/india-news/npci-postpones-upi-mdr-charges-rollout-to-post-diwali-second-week-of-november-1791882766290/amp) (second week of November).
- `start_date` is now 9 Nov 2026, the day after Diwali, labelled **reported** because NPCI has not notified the exact date. `start_date_original` (15 Oct) is kept for comparison.
- `start_date_alternative` (1 Jan 2027): merchant bodies had asked for January 2027 (MediaNama); kept as a further-delay scenario.
- Flat ₹5 sectors and the 0.02% capital-markets rate re-checked against [Organiser, 14 Oct 2026](https://organiser.org/2026/10/14/386311/bharat/mdr-on-upi-transactions-till-rs-2000-postponed-govts-digital-payments-push-remains-focused-on-accessibility/).
