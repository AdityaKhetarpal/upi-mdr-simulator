"use client"; // hover shows the exact month

import { useRef, useState } from "react";

type Row = { month: string; value_cr: number; volume_mn: number };

const W = 640, H = 260;
const L = 44, R = 64, T = 18, B = 34;
const YMAX = 32; // ₹ lakh crore

// "2026-08" -> "Aug 2026"
function monthName(m: string, short = false): string {
  const d = new Date(m + "-01T00:00:00");
  return d.toLocaleDateString("en-IN", short ? { month: "short" } : { month: "short", year: "numeric" });
}

export default function TrendChart({ rows }: { rows: Row[] }) {
  const [hi, setHi] = useState<number | null>(null); // index of the hovered month
  const svgRef = useRef<SVGSVGElement>(null);

  const n = rows.length;
  const xOf = (i: number) => L + (i / (n - 1)) * (W - L - R);
  const yOf = (lakhCr: number) => H - B - (lakhCr / YMAX) * (H - T - B);
  const val = (r: Row) => r.value_cr / 100000; // crore -> lakh crore

  const line = rows.map((r, i) => `${xOf(i).toFixed(1)},${yOf(val(r)).toFixed(1)}`).join(" L");
  const area = `M${xOf(0)},${yOf(0)} L${line} L${xOf(n - 1)},${yOf(0)} Z`;

  // nearest month to the pointer
  const onMove = (clientX: number) => {
    const box = svgRef.current!.getBoundingClientRect();
    const x = ((clientX - box.left) / box.width) * W;
    const i = Math.round(((x - L) / (W - L - R)) * (n - 1));
    setHi(Math.min(n - 1, Math.max(0, i)));
  };

  const last = rows[n - 1];
  const h = hi !== null ? rows[hi] : null;

  return (
    <div className="chart-wrap">
      <svg
        ref={svgRef}
        className="chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`UPI value per month, from ${monthName(rows[0].month)} to ${monthName(last.month)}`}
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerLeave={() => setHi(null)}
      >
        {[0, 10, 20, 30].map((t) => (
          <g key={t}>
            <line className="grid" x1={L} x2={W - R} y1={yOf(t)} y2={yOf(t)} />
            <text x={L - 8} y={yOf(t) + 4} textAnchor="end">{t}</text>
          </g>
        ))}
        {rows.map((r, i) =>
          i % 2 === 0 ? (
            <text key={r.month} x={xOf(i)} y={H - B + 20} textAnchor="middle">{monthName(r.month, true)}</text>
          ) : null,
        )}

        <path d={area} fill="var(--free)" opacity="0.1" />
        <path d={"M" + line} fill="none" stroke="var(--free)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* end label: the latest month */}
        <circle cx={xOf(n - 1)} cy={yOf(val(last))} r="5" fill="var(--free)" stroke="var(--surface)" strokeWidth="2" />
        <text className="annot" x={xOf(n - 1) + 10} y={yOf(val(last)) + 4}>{val(last).toFixed(1)}</text>

        {hi !== null && h && (
          <>
            <line x1={xOf(hi)} x2={xOf(hi)} y1={T} y2={H - B} stroke="var(--ink-3)" strokeWidth="1" />
            <circle cx={xOf(hi)} cy={yOf(val(h))} r="5" fill="var(--free)" stroke="var(--surface)" strokeWidth="2" />
          </>
        )}
      </svg>
      {hi !== null && h && (
        <div className="tip" style={{ left: `${(xOf(hi) / W) * 100}%`, top: `${(yOf(val(h)) / H) * 100}%` }}>
          <strong>{monthName(h.month)}</strong>
          ₹{val(h).toFixed(2)} lakh crore
          <br />
          {(h.volume_mn / 1000).toFixed(2)} billion payments
        </div>
      )}
    </div>
  );
}
