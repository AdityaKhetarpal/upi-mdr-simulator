"use client"; // runs in the browser, so sliders update the numbers instantly

import { useState } from "react";
import { runScenario, type Scenario } from "@/lib/model";
import HBars from "@/components/HBars";
import inputs from "@/public/data/scenario_inputs.json";
import bands from "@/public/data/p2m_bands.json";

// starting numbers from NPCI's August 2026 data (same as Python)
const above2000 = bands.find((b) => b.band === "above_2000")!;
const BASE_CR = above2000.band_value_cr;
const P2M_CR = (above2000.band_value_cr * 100) / above2000.share_of_p2m_value_pct;

const BASE = inputs[0] as Scenario;
const BASE_RESULT = runScenario(BASE, BASE_CR, P2M_CR);

const crore = (v: number) => "₹" + Math.round(v).toLocaleString("en-IN") + " cr";

// how far the result moved from the base scenario
function Delta({ now, base }: { now: number; base: number }) {
  const diff = now - base;
  if (Math.abs(diff) < 0.5) return <p className="delta delta-up">Same as base</p>;
  const pct = (diff / base) * 100;
  return (
    <p className={`delta ${diff > 0 ? "delta-up" : "delta-down"}`}>
      {diff > 0 ? "+" : "−"}{crore(Math.abs(diff))} ({diff > 0 ? "+" : "−"}{Math.abs(pct).toFixed(0)}%) vs base
    </p>
  );
}

type SliderProps = {
  label: string;
  hint: string;
  status: "confirmed" | "assumption";
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
};

function Slider(p: SliderProps) {
  const id = p.label.replace(/\W+/g, "-").toLowerCase();
  return (
    <div className="control">
      <label className="control-top" htmlFor={id}>
        <span>
          {p.label}
          <span className={`control-tag ${p.status === "confirmed" ? "badge-confirmed" : "badge-reported"}`}>
            {p.status === "confirmed" ? "rule" : "assumption"}
          </span>
        </span>
        <output htmlFor={id}>{p.value}{p.unit}</output>
      </label>
      <input id={id} type="range" min={p.min} max={p.max} step={p.step} value={p.value}
        onChange={(e) => p.onChange(Number(e.target.value))} />
      <p className="hint">{p.hint}</p>
    </div>
  );
}

export default function ScenarioLab() {
  const [s, setS] = useState<Scenario>({ ...BASE, name: "Your scenario" });
  const set = (key: keyof Scenario) => (v: number | string) => setS({ ...s, [key]: v });

  // shares can't add to more than 100%: warn instead of crashing
  const shares = s.exempt_share_pct + s.flat_sector_share_pct + s.capped_share_pct;
  const valid = shares <= 100;
  const r = valid ? runScenario(s, BASE_CR, P2M_CR) : null;

  return (
    <div className="lab">
      {/* phones only: the key numbers stay pinned at the top while you slide */}
      <div className="mobile-summary" aria-hidden="true">
        <div><span>Per year</span><strong>{r ? crore(r.pool_year_cr) : "–"}</strong></div>
        <div><span>FY 2026-27</span><strong>{r ? crore(r.pool_fy27_cr) : "–"}</strong></div>
        <div><span>Merchants pay</span><strong>{r ? `${r.effective_rate_on_p2m_pct.toFixed(2)}%` : "–"}</strong></div>
      </div>

      {/* ---- controls ---- */}
      <section className="panel controls" aria-label="Scenario inputs">
        <div className="control">
          <span className="control-top">Start date</span>
          <div className="segmented" role="group" aria-label="Start date" style={{ marginTop: 8 }}>
            <button type="button" aria-pressed={s.start_date === "2026-10-15"} onClick={() => set("start_date")("2026-10-15")}>15 Oct 2026</button>
            <button type="button" aria-pressed={s.start_date === "2027-01-01"} onClick={() => set("start_date")("2027-01-01")}>1 Jan 2027</button>
          </div>
          <p className="hint">Scheduled date, or the delay NPCI is reported to be weighing.</p>
        </div>

        <Slider label="Fee rate" unit="%" status="confirmed" value={s.rate_pct} min={0} max={1} step={0.05}
          hint="NPCI set 0.4%." onChange={set("rate_pct")} />
        <Slider label="Exempt merchants" unit="%" status="assumption" value={s.exempt_share_pct} min={0} max={60} step={5}
          hint="Share of above-₹2,000 value from small merchants who stay free." onChange={set("exempt_share_pct")} />
        <Slider label="Hits the ₹300 cap" unit="%" status="assumption" value={s.capped_share_pct} min={0} max={50} step={5}
          hint="Share of above-₹2,000 value in payments of ₹75,000 or more." onChange={set("capped_share_pct")} />
        <Slider label="Flat ₹5 sectors" unit="%" status="assumption" value={s.flat_sector_share_pct} min={0} max={30} step={5}
          hint="Fuel, telecom, insurance and railways." onChange={set("flat_sector_share_pct")} />
        <Slider label="Moved off UPI" unit="%" status="assumption" value={s.shift_away_pct} min={0} max={50} step={5}
          hint="Big payments that shops push to cash or split into smaller ones." onChange={set("shift_away_pct")} />

        <button type="button" className="btn" onClick={() => setS({ ...BASE, name: "Your scenario" })}>
          Reset to base scenario
        </button>
      </section>

      {/* ---- results ---- */}
      <section aria-live="polite">
        {!valid && (
          <p className="warning">Exempt, capped and flat shares add up to {shares}%. Lower one of them so the total is 100% or less.</p>
        )}
        {r && (
          <>
            <div className="stats">
              <div className="stat">
                <p className="stat-label">Per year</p>
                <p className="stat-value">{crore(r.pool_year_cr)}</p>
                <Delta now={r.pool_year_cr} base={BASE_RESULT.pool_year_cr} />
              </div>
              <div className="stat">
                <p className="stat-label">In FY 2026-27</p>
                <p className="stat-value">{crore(r.pool_fy27_cr)}</p>
                <p className="stat-note">{r.months_in_fy27.toFixed(1)} months of fees</p>
              </div>
              <div className="stat">
                <p className="stat-label">Merchants really pay</p>
                <p className="stat-value">{r.effective_rate_on_p2m_pct.toFixed(2)}%</p>
                <p className="stat-note">of all UPI merchant takings</p>
              </div>
            </div>

            <div className="panel" style={{ marginTop: 20 }}>
              <h3>Who gets paid each month</h3>
              <p className="note" style={{ marginTop: 4, marginBottom: 12 }}>
                Monthly fee of {crore(r.pool_month_cr)}, plus {crore(r.gst_month_cr)} GST that goes to the government.
              </p>
              <HBars
                color="var(--fee)"
                max={BASE_RESULT.issuer_month_cr * 1.6}
                rows={[
                  { label: "Customer's bank", sub: "Issuing bank, 40%", value: r.issuer_month_cr, display: crore(r.issuer_month_cr) },
                  { label: "Merchant's bank", sub: "Acquiring bank, 30%", value: r.acquirer_month_cr, display: crore(r.acquirer_month_cr) },
                  { label: "Payment app", sub: "20%", value: r.app_month_cr, display: crore(r.app_month_cr) },
                  { label: "Payer's PSP bank", sub: "10%", value: r.payer_psp_month_cr, display: crore(r.payer_psp_month_cr) },
                ]}
              />
              <p className="note">The 40/30/20/10 split and 18% GST are reported but not confirmed. Estimates, not forecasts.</p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
