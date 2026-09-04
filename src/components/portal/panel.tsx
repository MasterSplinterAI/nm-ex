import type { ReactNode } from "react";

type Props = {
  kicker?: string;
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
};

export function Panel({ kicker, title, actions, children, className = "", id }: Props) {
  return (
    <section
      id={id}
      className={`portal-card px-4 py-4 sm:px-6 sm:py-5 ${className}`}
    >
      {(kicker || title || actions) && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {kicker && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--forest)]">
                {kicker}
              </p>
            )}
            {title && (
              <h2 className="font-display mt-1 text-lg tracking-tight text-[var(--ink)] sm:text-xl">
                {title}
              </h2>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
      {children}
    </p>
  );
}
