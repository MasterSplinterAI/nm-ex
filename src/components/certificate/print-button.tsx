"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center border border-[var(--ink)]/30 bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:border-[var(--ink)] print:hidden"
    >
      Print / save as PDF
    </button>
  );
}
