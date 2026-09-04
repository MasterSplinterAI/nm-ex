import type { ReactNode } from "react";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/shell";
import { demoNowIso } from "@/lib/dmo/clock";
import { navCounts, navFor } from "@/lib/dmo/nav";
import { getSession } from "@/lib/dmo/session";
import { readState } from "@/lib/dmo/store";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const state = await readState();
  const participant = state.participants.find((p) => p.id === session.participantId);
  if (!participant || participant.status !== "approved") redirect("/login");
  const nav = navFor(session.role, navCounts(state, session.participantId, session.role));

  return (
    <Suspense fallback={<div className="min-h-dvh bg-[var(--paper)]" />}>
      <PortalShell participant={participant} nav={nav} demoNowIso={demoNowIso(state)} clockOffsetMs={state.clockOffsetMs}>
        {children}
      </PortalShell>
    </Suspense>
  );
}
