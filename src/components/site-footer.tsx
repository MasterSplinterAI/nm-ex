export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--ink)] text-[var(--paper)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-10">
        <div>
          <p className="font-display text-3xl tracking-tight">NM-EX</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70">
            Nigerian Metals Exchange — a public reference board for solid mineral
            spot values in USD and NGN.
          </p>
        </div>
        <div className="text-sm text-white/60">
          <p>nm-ex.com</p>
          <p className="mt-1">Ministry of Solid Minerals Development</p>
        </div>
      </div>
    </footer>
  );
}
