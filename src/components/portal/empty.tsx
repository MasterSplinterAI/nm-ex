import type { ReactNode } from "react";

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="border border-dashed border-[var(--line)] px-4 py-6 text-center text-sm text-[var(--ink-muted)]">
      {children}
    </p>
  );
}
