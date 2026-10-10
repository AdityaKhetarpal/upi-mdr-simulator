# UPI MDR Impact Simulator

How much India's new UPI merchant fee costs a payment, how much it raises nationally, and who gets paid.

**Live site:** [https://upi-mdr-simulator.vercel.app/

## The problem

From 15 October 2026 (possibly delayed to 1 January 2027), merchants pay a 0.4% merchant discount rate (MDR) on UPI payments above ₹2,000, capped at ₹300, with a flat ₹5 for fuel, telecom, insurance and railways. Customers still pay nothing. Merchants, fintech analysts and policy readers need to know three things: what one payment costs, how big the total fee pool is, and how confident we can be in each number.

## Who it's for

- **Mid-size merchants:** what a ₹25,000 sale now costs them.
- **Fintech and bank analysts:** the size of the fee pool and each player's share.
- **Policy readers:** which rules are confirmed and which are only reported.

## What's on the site

| Page | What it does |
|---|---|
| Overview | Fee calculator for a single payment with a live fee curve; national fee pool with its range; P2M value by payment size; UPI monthly trend; FY 2026-27 scenarios; every rule with its status |
| Scenario lab | Sliders for start date, rate, exempt share, cap share, flat-fee share and payments moved off UPI; totals and player split update instantly |
| Ask the data | Plain-English questions answered by Claude Haiku using only this project's data, with source-block citations |
| Method | The pipeline, every assumption, all sources, limitations |

## Data

| File | Contents | Source | Status |
|---|---|---|---|
| `data/raw/upi_monthly_npci_reported.csv` | UPI volume and value, Sep 2025 to Sep 2026 | NPCI figures via news reports (URL on every row) | Secondary source |
| `data/raw/mdr_policy_parameters.csv` | 16 fee rules with value, source, date and status | NPCI statement and FAQ, news reports | Each row labelled confirmed / reported / unverified |
| `data/raw/p2m_ticket_bands_npci_reported.csv` | P2M value split by payment size, Aug 2026 | NPCI via Business Today, 17 Sep 2026 | Reported, rounded |

Full source log: [`data/SOURCES.md`](data/SOURCES.md). Only aggregated, published figures are used; no personal data.

## Method

```
data/raw/*.csv ──► checks ──► DuckDB + SQL ──► scenario engine ──► web/public/data/*.json ──► Next.js site
                   (pipeline/build_data.py, the same steps as notebooks 01-05)
```

- **Checks** stop the pipeline on missing or repeated months, gaps, shares that don't add to 100%, or unknown status labels.
- **Scenario engine** splits above-₹2,000 P2M value into standard (0.4%), capped (₹300) and flat (₹5) parts, removes exempt merchants and value moved off UPI, then computes the monthly pool, the FY 2026-27 total, GST and each player's share.
- **The website's TypeScript engine** is tested to give the same answers as the Python engine on all five scenarios.

## Automation

- `.github/workflows/ci.yml`: on every push, runs the data pipeline, the 26 website tests and a production build.
- `.github/workflows/refresh-data.yml`: every Monday (or on demand), re-runs the pipeline and opens a pull request if the website data changed, so a person reviews new numbers before they go live.

## Generative AI: Ask the data

- `web/app/api/ask/route.ts` sends the question plus this project's data (about 1,300 tokens) to `claude-haiku-5-5`.
- The system prompt (`web/lib/ask.ts`) limits answers to the supplied data, requires a source block like `[RULES]`, requires flagging reported or unverified figures, and refuses advice.
- **Works without a key:** common questions (fee on any payment amount, January start, revenue split, yearly total, what's confirmed) are answered instantly from the data by `web/lib/quick-answer.ts`. The AI is used only for other questions, and the site falls back to data answers if the AI fails or a visitor hits the rate limit.
- Safeguards: the API key stays on the server, questions are limited to 300 characters, and each visitor gets 8 questions per 10 minutes. Set a monthly spend cap in the Anthropic console.
- **Evaluation:** `web/evals/ask_eval.json` holds 10 questions (7 facts, 1 uncertainty, 2 refusals). Run `npm run eval` with the site running. Latest score: [X]/10 passed, [X]/8 factual answers cited a source.

## Results (base scenario, estimates not forecasts)

- Fee pool: **₹1,799 crore a month**, ₹21,587 crore a year (range ₹13,672 to ₹25,905 crore depending on assumptions).
- FY 2026-27: ₹9,936 crore with a 15 Oct start, ₹5,323 crore if delayed to 1 Jan 2027.
- Merchants pay about **0.20% of all UPI takings**, not 0.4%, because 33% of P2M value is in payments of ₹2,000 or less.

## Limitations

- One month (Aug 2026) of ticket-size data drives every estimate.
- Exempt share, cap share and average tickets are assumptions; the range shows their effect.
- The 40/30/20/10 revenue split and 18% GST are reported, not official.
- Monthly figures come from news reports citing NPCI and still need checking against NPCI's own page.

## Run it yourself

```bash
# 1. rebuild the data (Python 3.12)
pip install -r pipeline/requirements.txt
python pipeline/build_data.py

# 2. run the website (Node 20.9+)
cd web
npm install
npm test
npm run dev        # http://localhost:3000
```

To switch on Ask the data locally, copy `web/.env.example` to `web/.env.local` and add your Anthropic API key.

---

*Analysis and education only. Not investment, legal or business advice.*
