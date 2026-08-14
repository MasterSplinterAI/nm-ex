import type { ReactNode } from "react";
import { redirect } from "next/navigation";
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
      {children}
    </div>
  );
}
