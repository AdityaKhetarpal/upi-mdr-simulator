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
