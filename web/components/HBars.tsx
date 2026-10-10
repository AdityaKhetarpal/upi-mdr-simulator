// Horizontal bars with the value written at the tip of each bar

export type BarRow = {
  label: string;
  value: number; // sets the bar length
  display: string; // the formatted value shown at the tip
  sub?: string; // optional small second line under the label
};

export default function HBars({ rows, color, max }: { rows: BarRow[]; color: string; max?: number }) {
  const top = max ?? Math.max(...rows.map((r) => r.value)); // longest bar = 100%
  return (
    <div className="hbars" role="list">
      {rows.map((r) => (
        <div className="hbar" role="listitem" key={r.label} tabIndex={0}>
          <span className="hbar-label">
            {r.label}
            {r.sub && <span className="hbar-sub">{r.sub}</span>}
          </span>
          <span className="hbar-track">
            <span className="hbar-bar" style={{ width: `${(r.value / top) * 85}%`, background: color }} />
            <span className="hbar-value">{r.display}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
