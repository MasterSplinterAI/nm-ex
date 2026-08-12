import { NigeriaFlag } from "./nigeria-flag";

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
        <a
          href="/"
          className="font-display text-base tracking-tight text-[var(--ink)] sm:text-lg"
        >
          NM-EX
        </a>
        <div className="flex items-center gap-4 sm:gap-5">
          <nav className="hidden items-center gap-5 text-sm text-[var(--ink-muted)] sm:flex">
            <a href="#spot" className="transition hover:text-[var(--ink)]">
              Spot
            </a>
            <span className="text-[var(--ink)]/35">|</span>
            <span>Lagos · WAT</span>
          </nav>
          <div className="flex items-center gap-2.5 border border-[var(--ink)]/15 bg-[var(--paper)]/70 px-2.5 py-1.5 backdrop-blur-sm">
            <NigeriaFlag className="h-5 w-[30px] shrink-0 shadow-sm" />
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink)] sm:inline">
              Nigeria
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
