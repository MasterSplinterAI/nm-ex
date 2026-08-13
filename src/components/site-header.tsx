import { NigeriaFlag } from "./nigeria-flag";

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-10 sm:py-4">
        <a
          href="/"
          className="font-display text-base tracking-tight text-[var(--ink)] sm:text-lg"
        >
          NM-EX
        </a>
        <div className="flex items-center gap-3 sm:gap-5">
          <nav className="flex items-center gap-3 text-xs text-[var(--ink-muted)] sm:gap-5 sm:text-sm">
            <a href="#spot" className="transition hover:text-[var(--ink)]">
              Spot
            </a>
            <a href="#tin" className="transition hover:text-[var(--ink)]">
              Tin
            </a>
            <span className="hidden text-[var(--ink)]/35 sm:inline">|</span>
            <span className="hidden sm:inline">Lagos · WAT</span>
          </nav>
          <div className="flex items-center gap-2 border border-[var(--ink)]/15 bg-[var(--paper)]/70 px-2 py-1 backdrop-blur-sm sm:gap-2.5 sm:px-2.5 sm:py-1.5">
            <NigeriaFlag className="h-4 w-6 shrink-0 shadow-sm sm:h-5 sm:w-[30px]" />
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink)] sm:inline">
              Nigeria
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
