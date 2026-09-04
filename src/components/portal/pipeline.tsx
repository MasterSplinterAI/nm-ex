import { formatKg, formatMt } from "@/lib/format";
import type { PipelineStage } from "@/lib/dmo/reports";

export function Pipeline({ stages, compact = false }: { stages: PipelineStage[]; compact?: boolean }) {
  const max = Math.max(...stages.map((s) => s.containedKg), 1);
  return (
    <ol className={compact ? "grid gap-2 sm:grid-cols-2 lg:grid-cols-5" : "grid gap-2 sm:grid-cols-2 lg:grid-cols-5"}>
      {stages.map((s) => (
        <li key={s.id} className="border border-[var(--line)] bg-white/70 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">{s.label}</p>
          <p className="font-display mt-1 text-xl tabular-nums text-[var(--ink)]">{formatMt(s.containedKg)}</p>
          <p className="text-xs text-[var(--ink-muted)]">
            {formatKg(s.containedKg)} Sn
            {s.lots > 0 && (
              <>
                {" "}
                · {s.lots} lot{s.lots === 1 ? "" : "s"} · {formatKg(s.kg)}
              </>
            )}
            {s.lots === 0 && s.kg > 0 && <> · {formatKg(s.kg)}</>}
            {s.lots === 0 && s.kg === 0 && <> · none</>}
          </p>
          <div className="mt-2 h-1.5 bg-[var(--ink)]/10">
            <div className="h-1.5 bg-[var(--forest)]" style={{ width: `${Math.max(4, (s.containedKg / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
