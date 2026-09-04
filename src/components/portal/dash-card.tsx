import type { ReactNode } from "react";

export function DashCard({
  href,
  kicker,
  title,
  value,
  hint,
  tone = "ink",
  children,
}: {
  href: string;
  kicker: string;
  title: string;
  value?: ReactNode;
  hint?: string;
  tone?: "ink" | "warn" | "ok" | "info";
  children?: ReactNode;
}) {
  const valueColor =
    tone === "warn"
      ? "text-[var(--copper)]"
      : tone === "ok"
        ? "text-[var(--forest)]"
        : tone === "info"
          ? "text-[#1f4b6b]"
          : "text-[var(--ink)]";
  return (
    <a
      href={href}
      className="group flex flex-col border border-[var(--line)] bg-white/80 p-4 transition hover:border-[var(--forest)] hover:bg-white"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">{kicker}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <h3 className="font-display text-lg leading-tight text-[var(--ink)] group-hover:text-[var(--forest)]">{title}</h3>
        {value != null && <p className={`font-display text-3xl tabular-nums leading-none ${valueColor}`}>{value}</p>}
      </div>
      {hint && <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{hint}</p>}
      {children}
      <p className="mt-3 text-xs font-semibold text-[var(--forest)]">Open →</p>
    </a>
  );
}
