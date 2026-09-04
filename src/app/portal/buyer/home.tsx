import { DashCard } from "@/components/portal/dash-card";
import { acceptancesFor, poolFor } from "@/lib/dmo/queries";
import type { DemoState, Participant } from "@/lib/dmo/types";

export function BuyerHome({ state, me }: { state: DemoState; me: Participant }) {
  const pool = poolFor(state, "buyers");
  const purchases = acceptancesFor(state, me.id);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--forest)]">Domestic end user</p>
        <h1 className="font-display mt-1 text-2xl tracking-tight sm:text-3xl">{me.legalName}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">
          Registration {me.regNo}. Refined Nigerian tin is offered to domestic industry for {state.policy.offerPeriodDays} days before
          any export clearance can issue.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <DashCard href="/portal/buyer?tab=pool" kicker="Market" title="Refined tin offered" value={pool.length} hint="Buy at the live board price. A DMO-A records the domestic sale." tone={pool.length ? "ok" : "ink"} />
        <DashCard href="/portal/buyer?tab=purchases" kicker="Purchases" title="Lots you have bought" value={purchases.length} hint="Each purchase issues a certificate you can print and verify." />
      </div>
    </div>
  );
}
