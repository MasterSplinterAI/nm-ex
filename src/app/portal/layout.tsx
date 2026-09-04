import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { demoNowIso } from "@/lib/dmo/clock";
import { getSession } from "@/lib/dmo/session";
import { readState } from "@/lib/dmo/store";
import { PortalNav } from "./portal-nav";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const state = await readState();
  const participant = state.participants.find((p) => p.id === session.participantId);
  if (!participant || participant.status !== "approved") redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--paper)] text-[var(--ink)]">
      <PortalNav participant={participant} demoNowIso={demoNowIso(state)} clockOffsetMs={state.clockOffsetMs} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      <footer className="border-t border-[var(--line)] px-4 py-4 text-center text-xs text-[var(--ink-muted)]">
        NM-EX participant portal · demonstration environment · the live NM-EX record is authoritative
      </footer>
    </div>
  );
}
