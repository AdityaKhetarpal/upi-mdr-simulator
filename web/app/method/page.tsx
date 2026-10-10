// Method: how the numbers are made, what is assumed, where every figure comes from
import inputs from "@/public/data/scenario_inputs.json";
import policy from "@/public/data/policy.json";
import trend from "@/public/data/monthly_trend.json";

export const metadata = { title: "Method · UPI MDR Impact Simulator" };

// the steps really are a sequence, so they are numbered
const STEPS = [
  { name: "Collect", text: "Monthly UPI totals and the fee rules go into three CSV files, each row with its source and date." },
  { name: "Check", text: "The pipeline stops if a month is missing or repeated, a share doesn't add to 100%, or a rule has no usable value." },
  { name: "Store and query", text: "Clean tables go into DuckDB, and SQL turns them into the figures each page needs." },
  { name: "Model", text: "A scenario engine applies the 0.4% rate, the ₹300 cap and the flat ₹5 fee, then tests its own maths." },
  { name: "Publish", text: "Small JSON files feed this website. The website's calculator is tested to match the Python engine exactly." },
];

const BASE = inputs[0];
const ASSUMPTIONS: [string, string, string][] = [
  ["Share of above-₹2,000 value from exempt merchants", `${BASE.exempt_share_pct}%`, "Not published. Small merchants (P2PM) and any turnover exemption stay free."],
  ["Share of above-₹2,000 value in payments of ₹75,000+", `${BASE.capped_share_pct}%`, "Not published. These payments pay the ₹300 cap instead of 0.4%."],
  ["Average capped payment", `₹${BASE.capped_avg_ticket_inr.toLocaleString("en-IN")}`, "Sets how many payments pay ₹300."],
  ["Share in flat ₹5 sectors", `${BASE.flat_sector_share_pct}%`, "Fuel, telecom, insurance and railways."],
  ["Average payment in flat ₹5 sectors", `₹${BASE.flat_sector_avg_ticket_inr.toLocaleString("en-IN")}`, "Sets how many ₹5 fees are charged."],
  ["Ticket-size split held constant", "August 2026", "Only one month of NPCI's split is public, so every month uses it."],
];

export default function MethodPage() {
  // every distinct source, with a link where we have one
  const monthlySources = Array.from(new Map(trend.map((t) => [t.source_url, t.source_name])).entries());
  const ruleSources = Array.from(new Set(policy.map((p) => `${p.source} (${p.as_of})`)));

  return (
    <>
      <h1>Method</h1>
      <p className="lead">
        How every number on this site is made, what is assumed, and where the figures come from.
        The project runs as an automated pipeline, so updating one CSV row updates the whole site.
      </p>

      <section className="section">
        <div className="section-head"><h2>The pipeline</h2></div>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.name} className="step">
              <h3>{s.name}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="grid-2" style={{ marginTop: 20 }}>
          <div className="panel">
            <h3>Automation</h3>
            <p className="note" style={{ fontSize: "0.95rem" }}>
              One command, <code>python pipeline/build_data.py</code>, reproduces the five analysis notebooks.
              GitHub Actions runs it on every change, then runs the tests and builds the site. If any check
              fails, the change is flagged before it reaches the live site. Every Monday the pipeline runs again
              and opens a pull request if the numbers moved, so a person approves new data before it goes live.
            </p>
          </div>
          <div className="panel">
            <h3>Generative AI</h3>
            <p className="note" style={{ fontSize: "0.95rem" }}>
              Ask the data sends a question to Claude Haiku together with this site&apos;s data and nothing else. The
              model must answer only from that data, name the block it used, flag reported or unverified figures,
              and decline advice. Questions are checked for length and limited per visitor, and the API key stays on
              the server. A ten-question evaluation set checks facts, citations and refusals.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Assumptions</h2>
          <p>NPCI has not published these. Change them in the Scenario lab to see how much they matter.</p>
        </div>
        <div className="panel table-wrap" style={{ padding: 8 }}>
          <table className="wide">
            <thead><tr><th>Assumption</th><th>Base value</th><th>Why it matters</th></tr></thead>
            <tbody>
              {ASSUMPTIONS.map(([a, v, why]) => (
                <tr key={a}><td>{a}</td><td style={{ whiteSpace: "nowrap" }}>{v}</td><td className="muted">{why}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section grid-2">
        <div className="panel">
          <h3>Monthly UPI figures</h3>
          <ul className="sources">
            {monthlySources.map(([url, name]) => (
              <li key={url}><a href={url} target="_blank" rel="noreferrer">{name}</a></li>
            ))}
          </ul>
          <p className="note">News reports citing NPCI. NPCI&apos;s own statistics page needs a browser to load, so each month is still to be checked against it.</p>
        </div>
        <div className="panel">
          <h3>Fee rules</h3>
          <ul className="sources">
            {ruleSources.map((s) => <li key={s}>{s}</li>)}
          </ul>
          <p className="note">Each rule carries a status on the Overview page: confirmed, reported or unverified.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Limitations</h2></div>
        <ul className="limits">
          <li>One month of ticket-size data drives every estimate, so seasonal changes in big payments are missed.</li>
          <li>Exempt shares, cap shares and average tickets are assumptions; the yearly pool is shown as a range for that reason.</li>
          <li>The revenue split and 18% GST come from reports, not official notices.</li>
          <li>The model doesn&apos;t predict how merchants and customers change behaviour beyond the &quot;moved off UPI&quot; slider.</li>
        </ul>
      </section>
    </>
  );
}
