import type { ReactNode } from "react";

const ICONS = {
  weight: "M8 8h8l2 12H6L8 8zM10 8V6a2 2 0 1 1 4 0v2",
  beaker: "M9 3h6M10 3v5.2L5 20h14L14 8.2V3",
  list: "M8 7h11M8 12h11M8 17h11M5 7h.01M5 12h.01M5 17h.01",
  pool: "M4 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0M4 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0",
  money: "M4 7h16v10H4zM8 12h8M7 9h.01M17 15h.01",
  plant: "M4 8l8-4 8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4",
  cert: "M7 4h10v16H7zM10 9h4M10 13h4",
  queue: "M5 7h14M5 12h14M5 17h9",
  scan: "M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M8 8h8v8H8z",
  check: "M5 12.5 9.2 17 19 7",
} as const;

export type KpiIcon = keyof typeof ICONS;

export function KpiTile({
  icon,
  label,
  value,
  href,
  hint,
}: {
  icon: KpiIcon;
  label: string;
  value: ReactNode;
  href?: string;
  hint?: string;
}) {
  const inner = (
    <>
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1b4d38]/10 text-[#1b4d38]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d={ICONS[icon]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">{label}</p>
        <p className="font-display mt-1 break-words text-2xl tabular-nums leading-tight">{value}</p>
        {hint && <p className="mt-1 text-xs leading-snug text-[var(--ink-muted)]">{hint}</p>}
      </div>
    </>
  );

  const className = "portal-card flex items-start gap-3 p-4";
  if (href) {
    return (
      <a href={href} className={`${className} transition hover:border-[#1b4d38]`}>
        {inner}
      </a>
    );
  }
  return <div className={className}>{inner}</div>;
}

export function StatusTile({
  href,
  label,
  ok,
  okText,
  waitText,
}: {
  href: string;
  label: string;
  ok: boolean;
  okText: string;
  waitText: string;
}) {
  return (
    <a
      href={href}
      className={`portal-card flex min-h-[6.5rem] flex-col justify-center p-4 ${
        ok ? "border-transparent bg-[#1b4d38] text-white" : "bg-white"
      }`}
    >
      <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${ok ? "text-white/70" : "text-[var(--ink-muted)]"}`}>
        {label}
      </p>
      <p className="mt-2 flex items-start gap-2 text-sm font-semibold leading-snug">
        <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ok ? "bg-white/20" : "bg-[var(--paper)]"}`}>
          {ok ? "✓" : "!"}
        </span>
        {ok ? okText : waitText}
      </p>
    </a>
  );
}
