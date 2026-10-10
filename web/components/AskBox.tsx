"use client"; // typing, sending and showing the answer happen in the browser

import { useState } from "react";

const MAX = 300;
const SUGGESTIONS = [
  "How much would a shop pay on a ₹50,000 UPI payment?",
  "What happens to this year's total if the start moves to January?",
  "Which numbers here are confirmed and which are assumptions?",
  "Who receives the fee, and how is it split?",
];

type Turn = { question: string; answer?: string; error?: string };

export default function AskBox() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]); // questions asked so far, newest first
  const [busy, setBusy] = useState(false);

  async function ask(q: string) {
    const text = q.trim();
    if (!text || busy) return;
    setBusy(true);
    setQuestion("");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      setTurns((t) => [{ question: text, answer: data.answer, error: data.error }, ...t]);
    } catch {
      setTurns((t) => [{ question: text, error: "Couldn't reach the site. Check your connection and try again." }, ...t]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ask">
      <form
        className="panel ask-form"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <label className="field-label" htmlFor="q">Your question</label>
        <textarea
          id="q"
          rows={3}
          maxLength={MAX}
          value={question}
          placeholder="For example: how much does a ₹10,000 payment cost the merchant?"
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault(); // Enter sends, Shift+Enter makes a new line
              ask(question);
            }
          }}
        />
        <div className="ask-row">
          <span className="muted">{question.length}/{MAX}</span>
          <button type="submit" className="btn btn-primary" disabled={busy || question.trim().length < 5}>
            {busy ? "Answering…" : "Ask"}
          </button>
        </div>
        <div className="presets" aria-label="Example questions">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="preset" onClick={() => ask(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </div>
      </form>

      <div aria-live="polite">
        {turns.map((t, i) => (
          <article className="panel answer" key={turns.length - i}>
            <p className="answer-q">{t.question}</p>
            {t.answer && <p className="answer-a">{t.answer}</p>}
            {t.error && <p className="warning">{t.error}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
