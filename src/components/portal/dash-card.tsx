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
      className="portal-card group flex min-w-0 flex-col p-4 transition hover:border-[var(--forest)]"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">{kicker}</p>
      <h3 className="font-display mt-2 text-lg leading-tight text-[var(--ink)] group-hover:text-[var(--forest)]">{title}</h3>
      {value != null && (
        <p className={`font-display mt-2 break-words text-2xl tabular-nums leading-tight sm:text-3xl ${valueColor}`}>{value}</p>
      )}
      {hint && <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{hint}</p>}
      {children}
      <p className="mt-3 text-xs font-semibold text-[var(--forest)]">Open →</p>
    </a>
  );
}
