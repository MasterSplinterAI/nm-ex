export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--ink)] text-[var(--paper)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-10">
        <div>
          <p className="font-display text-3xl tracking-tight">NM-EX</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70">
            Nigeria&apos;s benchmark for transparent mineral prices — LME
            reference, NM-EX procurement, and government royalty on one board.
          </p>
        </div>
        <div className="text-sm text-white/60">
          <p>nm-ex.com</p>
          <p className="mt-1">Ministry of Solid Minerals Development</p>
          <p className="mt-3">
            <a href="/desk" className="text-white/45 transition hover:text-white/80">
              Desk
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
