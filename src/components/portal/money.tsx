import { formatNgnPrecise, formatUsd } from "@/lib/format";

export function Money({
  ngn,
  usd,
  size = "md",
  tone,
}: {
  ngn: number | null;
  usd?: number | null;
  size?: "sm" | "md" | "lg";
  tone?: "red" | "green";
}) {
  const main =
    size === "lg"
      ? "font-display text-2xl tabular-nums sm:text-3xl"
      : size === "sm"
        ? "text-sm tabular-nums font-medium"
        : "text-base tabular-nums font-semibold";
  const color = tone === "red" ? "text-[#9b2c2c]" : tone === "green" ? "text-[var(--forest)]" : "text-[var(--ink)]";
  return (
    <span className="inline-flex flex-col leading-tight">
      <span className={`${main} ${color}`}>{formatNgnPrecise(ngn)}</span>
      {usd !== undefined && (
        <span className="text-xs tabular-nums text-[var(--ink-muted)]">{formatUsd(usd, true)}</span>
      )}
    </span>
  );
}
