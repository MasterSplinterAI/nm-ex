import type { ReactNode } from "react";
import { NavIcon } from "@/components/portal/nav-icons";

/**
 * Titled card with the tinted header strip used across the portal. The icon is
 * the same glyph set as the sidebar, so a card and its nav item read as one thing.
 */
export function Card({
  title,
  icon,
  action,
  children,
  className = "",
}: {
  title: string;
  icon?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`portal-card flex flex-col overflow-hidden ${className}`}>
      <div className="card-head">
        <div className="flex min-w-0 items-center gap-2">
          {icon && (
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#1b4d38]/10 text-[#1b4d38]">
              <NavIcon id={icon} />
            </span>
          )}
          <h2 className="card-title truncate">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Label / value pair with a hairline between rows. */
export function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="data-row">
      <dt className="data-label">{label}</dt>
      <dd className="data-value">{value}</dd>
    </div>
  );
}

export type NoteTone = "info" | "warn" | "ok";

/** Tinted callout band, as used for VAT, royalty and confirmation copy. */
export function Note({ tone = "info", title, children }: { tone?: NoteTone; title?: string; children: ReactNode }) {
  return (
    <p className={`note note-${tone}`}>
      {title && <strong className="font-semibold">{title} </strong>}
      {children}
    </p>
  );
}

/**
 * A figure that is either fixed by NM-EX or still moving. The reference screens
 * use this to separate what a supplier can rely on from what is still indicative.
 */
export function LockBadge({ locked, lockedText = "Locked", pendingText = "Pending verification" }: {
  locked: boolean;
  lockedText?: string;
  pendingText?: string;
}) {
  return (
    <span className={`lock-badge ${locked ? "lock-badge--on" : "lock-badge--off"}`}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d={locked ? "M7 11V8a5 5 0 0 1 10 0v3" : "M7 11V8a5 5 0 0 1 9.6-2"}
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor" />
      </svg>
      {locked ? lockedText : pendingText}
    </span>
  );
}
