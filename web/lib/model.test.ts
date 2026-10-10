// Tests: the website's engine must give the same answers as Python (notebook 4_model)
import { describe, expect, it } from "vitest";
import { cappedFeeCr, feeForPayment, flatFeeCr, runScenario, standardFeeCr, type Scenario } from "./model";
import inputs from "../public/data/scenario_inputs.json";
import pythonResults from "../public/data/scenario_results.json";
import bands from "../public/data/p2m_bands.json";

// The same starting numbers Python used
const above2000 = bands.find((b) => b.band === "above_2000")!;
const BASE_CR = above2000.band_value_cr; // 599,650 crore
const P2M_CR = (above2000.band_value_cr * 100) / above2000.share_of_p2m_value_pct; // 895,000 crore

describe("fee functions", () => {
  it("standard fee is 0.4% of value", () => {
    expect(standardFeeCr(100, 0.4)).toBeCloseTo(0.4);
  });
  it("flat ₹5 on ₹5,000 tickets is 0.1%", () => {
    expect(flatFeeCr(100, 5000, 5)).toBeCloseTo(0.1);
  });
  it("the ₹300 cap bites on big tickets and not on small ones", () => {
    expect(cappedFeeCr(100, 150000, 0.4, 300)).toBeCloseTo(0.2);
    expect(cappedFeeCr(100, 50000, 0.4, 300)).toBeCloseTo(0.4);
  });
});

describe("matches Python for all 5 scenarios", () => {
  (inputs as Scenario[]).forEach((s, i) => {
    it(s.name, () => {
      const ts = runScenario(s, BASE_CR, P2M_CR);
      const py = pythonResults[i];
      expect(ts.pool_month_cr).toBeCloseTo(py.pool_month_cr, 2);
      expect(ts.pool_fy27_cr).toBeCloseTo(py.pool_fy27_cr, 2);
      expect(ts.effective_rate_on_p2m_pct).toBeCloseTo(py.effective_rate_on_p2m_pct, 3);
      expect(ts.issuer_month_cr).toBeCloseTo(py.issuer_month_cr, 2);
    });
  });
});

describe("safety checks", () => {
  it("rejects shares that add to more than 100%", () => {
    const bad = { ...(inputs[0] as Scenario), exempt_share_pct: 90 };
    expect(() => runScenario(bad, BASE_CR, P2M_CR)).toThrow();
  });
});

describe("fee on a single payment", () => {
  it("is free up to ₹2,000", () => {
    expect(feeForPayment(2000, "standard").fee_inr).toBe(0);
  });
  it("is 0.4% above ₹2,000", () => {
    expect(feeForPayment(10000, "standard").fee_inr).toBeCloseTo(40);
  });
  it("is capped at ₹300 from ₹75,000", () => {
    expect(feeForPayment(75000, "standard").fee_inr).toBeCloseTo(300);
    expect(feeForPayment(500000, "standard").fee_inr).toBe(300);
  });
  it("is a flat ₹5 in the flat-fee sectors", () => {
    expect(feeForPayment(20000, "flat").fee_inr).toBe(5);
  });
  it("adds 18% GST on top", () => {
    expect(feeForPayment(10000, "standard").total_inr).toBeCloseTo(47.2);
  });
});
