// Runs the "Ask the data" evaluation set against a running site and prints a score.
// Usage: start the site (npm run dev), then in a second terminal:  npm run eval
import { readFileSync, writeFileSync } from "node:fs";

const BASE = process.env.EVAL_URL ?? "http://localhost:3000";
const cases = JSON.parse(readFileSync(new URL("../evals/ask_eval.json", import.meta.url), "utf8"));

const rows = [];
for (const c of cases) {
  const started = Date.now();
  const res = await fetch(`${BASE}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: c.question }),
  });
  const data = await res.json();
  const answer = (data.answer ?? data.error ?? "").toLowerCase();
  const pass = res.ok && c.must_include.every((s) => answer.includes(s.toLowerCase()));
  const cited = /\[(rules|scenarios|bands|monthly|status)\]/i.test(data.answer ?? "");
  rows.push({ id: c.id, kind: c.kind, pass, cited, ms: Date.now() - started, answer: data.answer ?? data.error });
  console.log(`${pass ? "PASS" : "FAIL"}  ${c.id.padEnd(13)} ${String(Date.now() - started).padStart(5)} ms  cited=${cited}`);
  await new Promise((r) => setTimeout(r, Number(process.env.EVAL_PAUSE_MS ?? 1500))); // stay under the site's rate limit
}

const passed = rows.filter((r) => r.pass).length;
const cited = rows.filter((r) => r.kind !== "refusal" && r.cited).length;
const factual = rows.filter((r) => r.kind !== "refusal").length;
console.log(`\nScore: ${passed}/${rows.length} passed, ${cited}/${factual} factual answers cited a source block.`);
writeFileSync(new URL("../evals/last_run.json", import.meta.url), JSON.stringify(rows, null, 2));
console.log("Full answers saved to evals/last_run.json");
