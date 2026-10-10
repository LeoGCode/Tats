export type BarRow = { label: string; sub?: string; a: number; b: number; title: string };

/** Horizontal stacked bars on a 0–100% scale: series 1 = incorrect/blank, series 2 = spelling. */
export function StackedBars({ rows }: { rows: BarRow[] }) {
  return (
    <div>
      <div className="legend">
        <span><i style={{ background: "var(--series-1)" }} />Incorrecta / en blanco</span>
        <span><i style={{ background: "var(--series-2)" }} />Ortografía</span>
      </div>
      <div className="bars">
        {rows.map((r) => (
          <div key={r.label} style={{ display: "contents" }}>
            <div className="lbl" title={r.sub ? `${r.label} — ${r.sub}` : r.label}>
              {r.label} {r.sub && <small>{r.sub}</small>}
            </div>
            <div className="track" title={r.title}>
              {r.a > 0 && <div className="seg s1" style={{ width: `${r.a * 100}%` }} />}
              {r.b > 0 && <div className="seg s2" style={{ width: `${r.b * 100}%` }} />}
              <span className="val">{Math.round((r.a + r.b) * 100)}%</span>
            </div>
          </div>
        ))}
        <div className="axis"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
      </div>
    </div>
  );
}
