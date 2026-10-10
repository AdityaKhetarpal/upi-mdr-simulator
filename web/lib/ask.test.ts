// Tests for "Ask the data" that need no AI call: input checks and the data the AI receives
import { describe, expect, it } from "vitest";
import { buildContext, SYSTEM_PROMPT, validateQuestion, MAX_QUESTION_CHARS } from "./ask";

describe("question checks", () => {
  it("rejects empty and too-short questions", () => {
    expect(validateQuestion("").ok).toBe(false);
    expect(validateQuestion("hi").ok).toBe(false);
    expect(validateQuestion(42).ok).toBe(false);
  });
  it("rejects questions that are too long", () => {
    expect(validateQuestion("a".repeat(MAX_QUESTION_CHARS + 1)).ok).toBe(false);
  });
  it("accepts a normal question and trims spaces", () => {
    const r = validateQuestion("  What is the fee rate?  ");
    expect(r.ok && r.question).toBe("What is the fee rate?");
  });
});

describe("data given to the AI", () => {
  const ctx = buildContext();
  it("contains every source block the AI is told to cite", () => {
    for (const tag of ["[RULES]", "[SCENARIOS]", "[BANDS]", "[MONTHLY]", "[STATUS]"]) expect(ctx).toContain(tag);
  });
  it("contains the key confirmed rules and the base result", () => {
    expect(ctx).toContain("mdr_rate_standard: 0.4");
    expect(ctx).toContain("mdr_cap: 300");
    expect(ctx).toContain("₹1,799 crore a month");
  });
  it("carries status labels so the AI can flag uncertainty", () => {
    expect(ctx).toContain("status: unverified");
    expect(ctx).toContain("status: reported");
  });
  it("stays small enough to be cheap (under ~4,000 tokens)", () => {
    expect(ctx.length).toBeLessThan(16000); // roughly 4 characters per token
  });
  it("tells the AI to use only this data and refuse advice", () => {
    expect(SYSTEM_PROMPT).toContain("ONLY the data");
    expect(SYSTEM_PROMPT).toContain("not investment");
  });
});

import { findAmount, quickAnswer } from "./quick-answer";

describe("instant answers without AI", () => {
  it("reads amounts written in different ways", () => {
    expect(findAmount("a ₹50,000 payment")).toBe(50000);
    expect(findAmount("1.5 lakh sale")).toBe(150000);
    expect(findAmount("pay 2500 at a shop")).toBe(2500);
  });
  it("works out the fee on a payment", () => {
    expect(quickAnswer("How much would a shop pay on a ₹50,000 UPI payment?")).toContain("₹200.00");
    expect(quickAnswer("fee on ₹1,500?")).toContain("No fee");
    expect(quickAnswer("petrol pump payment of ₹10,000")).toContain("₹5.00");
  });
  it("answers each example question", () => {
    expect(quickAnswer("What happens to this year's total if the start moves to January?")).toContain("₹5,323 crore");
    expect(quickAnswer("Which numbers here are confirmed and which are assumptions?")).toContain("Unverified");
    expect(quickAnswer("Who receives the fee, and how is it split?")).toContain("40%");
  });
  it("says so when it can't answer without AI", () => {
    expect(quickAnswer("What will the weather be tomorrow?")).toBeNull();
  });
});
