import type { ReactNode } from "react";

export function PageHeader({ kicker, title, lede, actions }: { kicker: string; title: string; lede?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--forest)]">{kicker}</p>
        <h1 className="font-display mt-1 text-2xl tracking-tight text-[var(--ink)] sm:text-3xl">{title}</h1>
        {lede && <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">{lede}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
