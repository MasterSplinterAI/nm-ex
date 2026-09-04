const GREENS = ["#163d2c", "#1b4d38", "#2d7a4f", "#4a9a6a", "#7ec08a", "#a8d4b4", "#cde6d4"];

export function GradeTrend({ points }: { points: { label: string; value: number }[] }) {
  if (points.length === 0) return <p className="text-sm text-[var(--ink-muted)]">No purchases to plot yet.</p>;
  const w = 360;
  const h = 160;
  const pad = { l: 32, r: 8, t: 12, b: 28 };
  const values = points.map((p) => p.value);
  const min = Math.min(50, ...values) - 4;
  const max = Math.max(80, ...values) + 4;
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const x = (i: number) => pad.l + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => pad.t + ((max - v) / (max - min)) * innerH;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full" role="img" aria-label="Grade trend">
      {[min, (min + max) / 2, max].map((tick) => (
        <g key={tick}>
          <line x1={pad.l} x2={w - pad.r} y1={y(tick)} y2={y(tick)} stroke="#e4ebe6" />
          <text x={pad.l - 6} y={y(tick) + 3} textAnchor="end" className="fill-[var(--ink-muted)]" fontSize="9">
            {Math.round(tick)}
          </text>
        </g>
      ))}
      <path d={d} fill="none" stroke="#1b4d38" strokeWidth="2.2" />
      {points.map((p, i) => (
        <g key={p.label}>
          <circle cx={x(i)} cy={y(p.value)} r="3.5" fill="#1b4d38" />
          <text x={x(i)} y={h - 8} textAnchor="middle" className="fill-[var(--ink-muted)]" fontSize="9">
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function WeightDonut({ slices, totalKg }: { slices: { label: string; kg: number }[]; totalKg: number }) {
  if (totalKg <= 0) return <p className="text-sm text-[var(--ink-muted)]">No weight to show yet.</p>;
  const r = 48;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0" role="img" aria-label="Weight contribution">
        <g transform="translate(70 70) rotate(-90)">
          {slices.map((s, i) => {
            const len = (s.kg / totalKg) * c;
            const dash = `${len} ${c - len}`;
            const node = (
              <circle
                key={s.label}
                r={r}
                fill="none"
                stroke={GREENS[i % GREENS.length]}
                strokeWidth="16"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return node;
          })}
        </g>
        <text x="70" y="68" textAnchor="middle" className="fill-[var(--ink)]" fontSize="13" fontWeight="700">
          {Math.round(totalKg).toLocaleString("en-NG")}
        </text>
        <text x="70" y="84" textAnchor="middle" className="fill-[var(--ink-muted)]" fontSize="10">
          kg total
        </text>
      </svg>
      <ul className="min-w-0 space-y-1.5 text-xs">
        {slices.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: GREENS[i % GREENS.length] }} />
            <span className="truncate text-[var(--ink-muted)]">{s.label}</span>
            <span className="ml-auto tabular-nums text-[var(--ink)]">
              {Math.round(s.kg)} kg · {((s.kg / totalKg) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
