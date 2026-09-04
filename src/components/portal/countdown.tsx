"use client";

import { useEffect, useState } from "react";

function describe(ms: number): string {
  if (ms <= 0) return "Closed";
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${minutes}m`;
}

/**
 * Counts down to `untilIso` using the server's demo clock (`nowIso`) as the
 * reference, so an advanced demo clock is respected on every screen.
 */
export function Countdown({
  untilIso,
  nowIso,
  label,
  className = "",
}: {
  untilIso: string;
  nowIso: string;
  label?: string;
  className?: string;
}) {
  const serverOffset = new Date(nowIso).getTime() - Date.now();
  const [remaining, setRemaining] = useState(() => new Date(untilIso).getTime() - (Date.now() + serverOffset));

  useEffect(() => {
    const tick = () => setRemaining(new Date(untilIso).getTime() - (Date.now() + serverOffset));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
    // serverOffset is derived from props that only change with a re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [untilIso, nowIso]);

  const closed = remaining <= 0;
  return (
    <span className={`inline-flex items-baseline gap-1.5 tabular-nums ${className}`}>
      {label && <span className="text-[var(--ink-muted)]">{label}</span>}
      <span className={closed ? "text-[#9b2c2c] font-semibold" : "font-semibold text-[var(--ink)]"}>
        {describe(remaining)}
      </span>
    </span>
  );
}
