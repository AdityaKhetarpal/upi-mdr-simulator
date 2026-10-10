// POST /api/ask  -> answers a question using ONLY the project's data.
// Runs on the server, so the API key never reaches the visitor's browser.

import Anthropic from "@anthropic-ai/sdk";
import { buildContext, SYSTEM_PROMPT, validateQuestion } from "@/lib/ask";
import { quickAnswer } from "@/lib/quick-answer";

export const maxDuration = 30; // seconds; the answer is short, so this is plenty

const MODEL = process.env.ASK_MODEL ?? "claude-haiku-5-5"; // cheapest, fastest model; change in env if needed
const LIMIT = 8; // questions per visitor...
const WINDOW_MS = 10 * 60 * 1000; // ...per 10 minutes

// Simple per-visitor limit. It lives in server memory, so it resets when the server restarts:
// good enough to stop casual abuse; the monthly spend cap at the AI provider is the hard stop.
const hits = new Map<string, number[]>();
function allowed(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) return false;
  hits.set(ip, [...recent, now]);
  return true;
}

// Reply worked out from the data alone (no AI)
function fromData(question: string) {
  const answer = quickAnswer(question);
  if (answer) return Response.json({ answer, via: "data" });
  return Response.json({
    answer:
      "I can answer this one only with the AI switched on. Without it, I can work out the fee on any payment amount, the effect of a January start, who receives the fee, the yearly total, and which numbers are confirmed. Try one of the example questions.",
    via: "data",
  });
}

export async function POST(request: Request) {
  // 1. Check the question
  const body = await request.json().catch(() => ({}));
  const check = validateQuestion(body?.question);
  if (!check.ok) return Response.json({ error: check.error }, { status: 400 });

  // 2. No AI key set: answer from the data instead
  if (!process.env.ANTHROPIC_API_KEY) return fromData(check.question);

  // 3. Rate limit AI calls by visitor IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowed(ip)) return fromData(check.question);

  // 4. Ask the model, giving it only our data
  try {
    const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `<data>\n${buildContext()}\n</data>\n\nQuestion: ${check.question}` }],
    });

    const answer = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    // token use goes to the server log, so cost can be tracked
    console.log(`[ask] model=${MODEL} in=${message.usage.input_tokens} out=${message.usage.output_tokens}`);

    return Response.json({ answer, via: "ai", model: MODEL });
  } catch (err) {
    console.error("[ask] AI failed, answering from data:", err);
    return fromData(check.question); // the visitor still gets an answer
  }
}
