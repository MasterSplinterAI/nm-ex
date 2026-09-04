export function NmexMark({
  compact = false,
  light = false,
}: {
  compact?: boolean;
  light?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${light ? "text-white" : "text-[var(--ink)]"}`}>
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden className="shrink-0">
        <rect width="28" height="28" rx="6" fill="#1b4d38" />
        <path d="M7 21V7h3.2l3.8 8.4L17.8 7H21v14h-2.8V12.1L15.1 21h-2.2l-3.1-8.9V21H7z" fill="white" />
      </svg>
      {!compact && <span className="font-display text-lg tracking-tight">NM-EX</span>}
    </span>
  );
}
