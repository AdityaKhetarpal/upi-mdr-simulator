// Overview page: one payment first (the hero), then the national totals, then the rules, then the FAQ
import Link from "next/link";
import FeeCalculator from "@/components/FeeCalculator";
import TrendChart from "@/components/TrendChart";
import HBars from "@/components/HBars";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import results from "@/public/data/scenario_results.json";
import policy from "@/public/data/policy.json";
import bands from "@/public/data/p2m_bands.json";
import trend from "@/public/data/monthly_trend.json";
import meta from "@/public/data/meta.json";
import { RANGE, UPDATED } from "@/lib/facts";
import { upiFaq } from "@/lib/faq";
import { SITE_URL, SITE_NAME, REPO_URL, HUB_URL, PERSON_LD } from "@/lib/seo";

// What Google shows for this page. The title leads with the words people search ("UPI MDR calculator").
export const metadata = {
  title: { absolute: "UPI Merchant Discount Rate (MDR) Calculator & Impact Simulator" },
  description:
    "Work out the UPI Merchant Discount Rate (MDR) on any payment: 0.4% above ₹2,000, capped at ₹300. Plus what the fee raises in India and who gets it.",
  alternates: { canonical: "/" },
};

// ₹21587.4 -> "₹21,587 cr"
const crore = (v: number) => "₹" + Math.round(v).toLocaleString("en-IN") + " cr";

// the same sensitivity grid as notebook 4_model: exempt 0-30%, capped 5-30%
const { low: LOW, high: HIGH } = RANGE;

// This page as structured data: a free web app, built on a dataset, by Aditya
const PAGE_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: SITE_URL,
      description:
        "Calculator and scenario model for India's UPI Merchant Discount Rate (MDR): the fee on any payment, the national fee pool and who gets the money.",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Any (web browser)",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      inLanguage: "en-IN",
      dateModified: meta.data_updated,
      author: { "@id": PERSON_LD["@id"] },
      codeRepository: REPO_URL,
      isPartOf: { "@id": `${SITE_URL}/#website` },
    },
    {
      "@type": "Dataset",
      name: "UPI Merchant Discount Rate (MDR) rules and UPI monthly figures",
      description:
        "Monthly UPI volume and value (September 2025 onward), merchant payment value by ticket size, and every UPI MDR rule with its value, source, date and status (confirmed, reported or unverified).",
      url: `${SITE_URL}/method`,
      sameAs: `${REPO_URL}/tree/main/data`,
      creator: { "@id": PERSON_LD["@id"] },
      dateModified: meta.data_updated,
      spatialCoverage: "India",
      keywords: ["UPI", "MDR", "merchant discount rate", "NPCI", "digital payments", "India"],
    },
  ],
};

// the rules shown in the table: [data key, plain name, how to show the value]
const RULES: [string, string, (v: string) => string][] = [
  ["mdr_rate_standard", "Fee rate", (v) => `${v}% of the payment`],
  ["threshold_amount", "Free up to", (v) => `₹${Number(v).toLocaleString("en-IN")} per payment`],
  ["mdr_cap", "Maximum fee per payment", (v) => `₹${v}, reached at ₹75,000`],
  ["flat_fee_sectors", "Rail, telecom, insurance, fuel, farm inputs, utilities", (v) => `Flat ₹${v} per payment above ₹2,000`],
  ["capital_markets_rate", "Mutual funds, stocks, brokers", (v) => `${v}% of the payment, capped at ₹300`],
  ["p2pm_receipt_limit", "Small merchants stay free", (v) => `Until they receive ₹${Number(v).toLocaleString("en-IN")}+ a month for 3 months`],
  ["small_merchant_fund", "Small-merchant fund", (v) => `${v}% of every player's share of the fee`],
  ["start_date_original", "Original start date", (v) => `${dateText(v)} (deferred)`],
  ["start_date", "New start date", (v) => `Not yet notified; "immediately post Diwali" (${dateText(v)} assumed)`],
  ["start_date_alternative", "If delayed again", (v) => dateText(v)],
  ["turnover_exemption", "Turnover exemption (not adopted)", () => "Businesses under ₹40 lakh a year was considered"],
  ["split_issuer", "Who gets the fee", () => "Customer's bank 40%, merchant's bank 30%, app 20%, app's bank 10%"],
  ["incentive_budget_fy27", "Government incentive, FY 2026-27", (v) => `₹${Number(v).toLocaleString("en-IN")} crore budgeted`],
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
        A 0.4% Merchant Discount Rate (MDR), a fee shops pay on each UPI payment, was due on 15 October 2026. On 13 October NPCI deferred it to &ldquo;immediately post Diwali&rdquo;,
        and as of 5 November no start date has been notified. The rates have not changed, customers still pay nothing, and NPCI is
        defending the fee in the Supreme Court, which refused to pause it. Try a payment to see what the shop pays.
      </p>
      <p className="byline">
        By <a href={HUB_URL} rel="author">Aditya Khetarpal</a> · Updated <time dateTime={meta.data_updated}>{UPDATED}</time> ·{" "}
        <Link href="/method">Sources and method</Link>
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
            <p className="stat-label">Average fee on all merchant takings</p>
            <p className="stat-value">{base.effective_rate_on_p2m_pct.toFixed(2)}%</p>
            <p className="stat-note">This site&apos;s estimate, not an NPCI figure. One shop pays 0% to 0.4%, depending on its payment sizes.</p>
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
            Source: NPCI via Business Today, 17 Sep 2026 (rounded figures). September 2026 data showed the same 4% and 67% (NPCI via MediaNama, 5 Oct).
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

      {/* ---------- questions people search, answered from the data above ---------- */}
      <Faq items={upiFaq()} title="UPI MDR: questions people ask" />

      <JsonLd data={PAGE_LD} />
    </>
  );
}
