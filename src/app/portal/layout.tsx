import type { ReactNode } from "react";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/shell";
import { demoNowIso } from "@/lib/dmo/clock";
import { navCounts, navFor } from "@/lib/dmo/nav";
import { getSession } from "@/lib/dmo/session";
import { readState } from "@/lib/dmo/store";
import { readSpotBoard } from "@/lib/store";
import { formatDateTime, formatFxRate, formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const [state, spot] = await Promise.all([readState(), readSpotBoard()]);
  const participant = state.participants.find((p) => p.id === session.participantId);
  if (!participant || participant.status !== "approved") redirect("/login");
  const nav = navFor(
    session.role,
    navCounts(state, session.participantId, session.role),
    participant.category,
  );
  const tin = spot.minerals.find((m) => m.slug === "tin");
  const changePct =
    tin?.lastUsd != null && tin.openUsd != null && tin.openUsd !== 0
      ? ((tin.lastUsd - tin.openUsd) / tin.openUsd) * 100
      : null;

  return (
    <Suspense fallback={<div className="min-h-dvh bg-[var(--paper)]" />}>
      <PortalShell
        participant={participant}
        nav={nav}
        demoNowLabel={formatDateTime(demoNowIso(state))}
        clockOffsetMs={state.clockOffsetMs}
        board={{ tin: formatUsd(tin?.lastUsd ?? null), tinChangePct: changePct, fx: formatFxRate(spot.fx.rate) }}
      >
        {children}
      </PortalShell>
    </Suspense>
  );
}
