import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { logoutDesk } from "./actions";
import { TraceDesk } from "@/components/trace-desk";
import { isDeskAuthed } from "@/lib/desk-auth";
import { readSpotBoard, readTinPolicy } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DeskPage() {
  if (!(await isDeskAuthed())) redirect("/desk/login");

  const [board, policy] = await Promise.all([
    readSpotBoard(),
    readTinPolicy(),
  ]);
  const tin = board.minerals.find((mineral) => mineral.slug === "tin");
  const lmeUsd = tin?.lastUsd;
  if (lmeUsd == null) {
    return (
      <DeskShell>
        <p className="text-sm text-[var(--ink-muted)]">No tin last on the board.</p>
      </DeskShell>
    );
  }

  return (
    <DeskShell>
      <TraceDesk
        prices={{
          lmeUsd,
          fxRate: board.fx.rate,
          benchmarkPct: policy.benchmarkPct,
          royaltyPct: policy.royaltyPct,
          assayPct: policy.defaultAssayPct,
        }}
      />
    </DeskShell>
  );
}

function DeskShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-[var(--paper)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-white/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-10">
          <a
            href="/"
            className="font-display text-lg tracking-tight text-[var(--ink)]"
          >
            NM-EX Trace
          </a>
          <div className="flex items-center gap-4 text-sm text-[var(--ink-muted)]">
            <a href="/" className="hover:text-[var(--ink)]">
              Board
            </a>
            <form action={logoutDesk}>
              <button type="submit" className="hover:text-[var(--ink)]">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-10 sm:py-8">{children}</main>
    </div>
  );
}
