import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { NigeriaFlag } from "@/components/nigeria-flag";

/** Header + framed content for public pages outside the marketing hero. */
export function PublicShell({
  title,
  lede,
  children,
  wide = false,
}: {
  title: string;
  lede?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--paper)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-white/70 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-10">
          <a href="/" className="font-display text-lg tracking-tight text-[var(--ink)]">
            NM-EX
          </a>
          <nav className="flex items-center gap-4 text-sm text-[var(--ink-muted)]">
            <a href="/exchange" className="hover:text-[var(--ink)]">
              Exchange
            </a>
            <a href="/#spot" className="hidden hover:text-[var(--ink)] sm:inline">
              Spot board
            </a>
            <a href="/verify" className="hover:text-[var(--ink)]">
              Verify
            </a>
            <a href="/register" className="hidden hover:text-[var(--ink)] sm:inline">
              Register
            </a>
            <a href="/login" className="font-semibold text-[var(--ink)]">
              Login
            </a>
            <NigeriaFlag className="h-4 w-6 shrink-0 shadow-sm" />
          </nav>
        </div>
      </header>
      <main className={`mx-auto w-full flex-1 px-4 py-10 sm:px-10 ${wide ? "max-w-6xl" : "max-w-4xl"}`}>
        <h1 className="font-display text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">{title}</h1>
        {lede && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">{lede}</p>}
        <div className="mt-8">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
