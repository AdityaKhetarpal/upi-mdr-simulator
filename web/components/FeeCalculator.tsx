"use client"; // interactive: typing, sliding, clicking on the chart

import { useRef, useState } from "react";
import { feeForPayment, type MerchantKind } from "@/lib/model";

// ---------- helpers ----------
const MIN = 100; // smallest payment on the chart, ₹
const MAX = 200000; // largest payment on the chart, ₹

// rupees in Indian style: 125000 -> "₹1,25,000"
function inr(n: number, decimals = 0): string {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// the slider moves on a log scale so ₹500 and ₹50,000 both get room
const sliderToAmount = (v: number) => Math.round(MIN * Math.pow(MAX / MIN, v / 1000));
const amountToSlider = (a: number) => (1000 * Math.log(Math.max(a, MIN) / MIN)) / Math.log(MAX / MIN);

// ---------- chart geometry ----------
const W = 640, H = 300; // drawing size in SVG units (it scales to fit the screen)
const L = 52, R = 18, T = 26, B = 38; // margins for the axes
const YMAX = 330; // top of the fee axis, ₹

const xOf = (amount: number) => L + ((Math.log(amount) - Math.log(MIN)) / (Math.log(MAX) - Math.log(MIN))) * (W - L - R);
const yOf = (fee: number) => H - B - (fee / YMAX) * (H - T - B);
const amountAtX = (x: number) => Math.exp(Math.log(MIN) + ((x - L) / (W - L - R)) * (Math.log(MAX) - Math.log(MIN)));

// the fee curve as an SVG path, sampled along the payment axis
function curvePath(kind: MerchantKind): string {
  const pts: string[] = [];
  for (let i = 0; i <= 240; i++) {
    const a = MIN * Math.pow(MAX / MIN, i / 240);
    pts.push(`${xOf(a).toFixed(1)},${yOf(feeForPayment(a, kind).fee_inr).toFixed(1)}`);
  }
  return "M" + pts.join(" L");
}

const X_TICKS = [100, 500, 2000, 10000, 75000, 200000];
const Y_TICKS = [0, 100, 200, 300];
const PRESETS = [450, 1800, 2500, 25000, 75000, 150000];

export default function FeeCalculator() {
  const [amount, setAmount] = useState(25000); // the payment being tested
  const [kind, setKind] = useState<MerchantKind>("standard");
  const [hover, setHover] = useState<number | null>(null); // payment under the mouse
  const svgRef = useRef<SVGSVGElement>(null);

  const r = feeForPayment(amount, kind); // the answer for the chosen payment
  const free = r.fee_inr === 0;

  // turn a mouse/touch position into a payment amount
  const amountFromPointer = (clientX: number) => {
    const box = svgRef.current!.getBoundingClientRect();
    const x = ((clientX - box.left) / box.width) * W; // screen px -> SVG units
    return Math.min(MAX, Math.max(MIN, amountAtX(x)));
  };

  const hoverFee = hover !== null ? feeForPayment(hover, kind) : null;

  return (
    <section className="calc" aria-label="Fee on a single payment">
      {/* ---- inputs ---- */}
      <div className="calc-inputs">
        <div>
          <label className="field-label" htmlFor="amount">Payment amount</label>
          <div className="amount-box">
            <span>₹</span>
            <input
              id="amount"
              inputMode="numeric"
              value={amount.toLocaleString("en-IN")}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/[^0-9]/g, "")); // keep digits only
                setAmount(Math.min(n, 10000000));
              }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            value={amountToSlider(amount)}
            onChange={(e) => setAmount(sliderToAmount(Number(e.target.value)))}
            aria-label="Payment amount slider"
          />
          <div className="presets">
            {PRESETS.map((p) => (
              <button key={p} type="button" className="preset" onClick={() => setAmount(p)}>
                {inr(p)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="field-label">Merchant type</span>
          <div className="segmented" role="group" aria-label="Merchant type">
            <button type="button" aria-pressed={kind === "standard"} onClick={() => setKind("standard")}>Most shops</button>
            <button type="button" aria-pressed={kind === "flat"} onClick={() => setKind("flat")}>Fuel, telecom, rail</button>
          </div>
        </div>

        <div className="result" aria-live="polite">
          <p className={`result-big ${free ? "is-free" : "is-fee"}`}>{free ? "₹0" : inr(r.total_inr, 2)}</p>
          <p className="result-line">
            {free
              ? `No fee on a ${inr(amount)} payment.`
              : `${inr(r.fee_inr, 2)} fee + ${inr(r.gst_inr, 2)} GST on ${inr(amount)}, which is ${r.effective_pct.toFixed(2)}% of the payment.`}
          </p>
          <p className="result-reason">{r.reason}.</p>
        </div>
      </div>

      {/* ---- the fee curve ---- */}
      <div className="calc-chart">
        <div className="chart-wrap">
          <svg
            ref={svgRef}
            className="chart"
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label="Fee by payment size: zero up to ₹2,000, then 0.4% of the payment, capped at ₹300 from ₹75,000"
            onPointerMove={(e) => setHover(amountFromPointer(e.clientX))}
            onPointerLeave={() => setHover(null)}
            onClick={(e) => setAmount(Math.round(amountFromPointer(e.clientX)))}
            style={{ cursor: "crosshair" }}
          >
            {/* free zone shading up to ₹2,000 */}
            <rect x={L} y={T} width={xOf(2000) - L} height={H - T - B} fill="var(--free)" opacity="0.08" />
            <text className="annot" x={L + 8} y={T + 16}>Free up to ₹2,000</text>

            {/* gridlines and fee axis */}
            {Y_TICKS.map((t) => (
              <g key={t}>
                <line className="grid" x1={L} x2={W - R} y1={yOf(t)} y2={yOf(t)} />
                <text x={L - 8} y={yOf(t) + 4} textAnchor="end">{t === 0 ? "₹0" : `₹${t}`}</text>
              </g>
            ))}
            {/* payment axis */}
            <line className="axis" x1={L} x2={W - R} y1={H - B} y2={H - B} />
            {X_TICKS.map((t) => (
              <text key={t} x={xOf(t)} y={H - B + 20} textAnchor="middle">
                {t >= 100000 ? `₹${t / 100000}L` : t >= 1000 ? `₹${t / 1000}K` : `₹${t}`}
              </text>
            ))}
            <line x1={xOf(2000)} x2={xOf(2000)} y1={T} y2={H - B} stroke="var(--free)" strokeWidth="1.5" />

            {/* cap annotation */}
            {kind === "standard" && (
              <text className="annot" x={xOf(75000)} y={yOf(300) - 12} textAnchor="middle">₹300 cap from ₹75,000</text>
            )}
            {kind === "flat" && (
              <text className="annot" x={xOf(20000)} y={yOf(5) - 12} textAnchor="middle">Flat ₹5 per payment</text>
            )}

            {/* the fee curve */}
            <path d={curvePath(kind)} fill="none" stroke="var(--fee)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

            {/* hover guide */}
            {hover !== null && (
              <line x1={xOf(hover)} x2={xOf(hover)} y1={T} y2={H - B} stroke="var(--ink-3)" strokeWidth="1" />
            )}

            {/* the chosen payment */}
            {amount >= MIN && amount <= MAX && (
              <circle cx={xOf(amount)} cy={yOf(r.fee_inr)} r="7" fill={free ? "var(--free)" : "var(--fee)"} stroke="var(--surface)" strokeWidth="3" />
            )}
          </svg>

          {hover !== null && hoverFee && (
            <div
              className="tip"
              style={{ left: `${(xOf(hover) / W) * 100}%`, top: `${(yOf(hoverFee.fee_inr) / H) * 100}%` }}
            >
              <strong>{inr(Math.round(hover))} payment</strong>
              Fee {inr(hoverFee.fee_inr, 2)}. Click to choose.
            </div>
          )}
        </div>
        <p className="note">Fee in rupees by payment size (log scale). Click the chart to pick a payment. GST of 18% is reported, not yet confirmed.</p>
      </div>
    </section>
  );
}
