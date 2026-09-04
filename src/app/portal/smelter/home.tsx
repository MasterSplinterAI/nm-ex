import { DashCard } from "@/components/portal/dash-card";
import { Panel } from "@/components/portal/panel";
import { LotStatusPill } from "@/components/portal/status-pill";
import { formatKg, formatNgn, formatNgnCompact, formatPct } from "@/lib/format";
import { smelterVisibility } from "@/lib/dmo/reports";
import type { DemoState, Participant } from "@/lib/dmo/types";

export function SmelterHome({ state, me }: { state: DemoState; me: Participant }) {
  const v = smelterVisibility(state, me.id);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--forest)]">Qualified domestic smelter</p>
        <h1 className="font-display mt-1 text-2xl tracking-tight sm:text-3xl">{me.legalName}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">
          Registration {me.regNo}. First right of acceptance on every verified concentrate lot in Nigeria. This page is the plant
          position — pool, settlement, inventory, furnace and royalty — in one view.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashCard href="/portal/smelter?tab=pool" kicker="Market" title="Lots in the National Pool" value={v.poolLots} hint="Verified concentrate offered to you before it can be exported." tone={v.poolLots ? "ok" : "ink"} />
        <DashCard href="/portal/smelter?tab=acceptances" kicker="Settlement" title="Awaiting payment" value={v.pendingPayment} hint={v.pendingCollection ? `${v.pendingCollection} paid, collection pending.` : "Pay within five days of acceptance."} tone={v.pendingPayment ? "warn" : "ink"} />
        <DashCard href="/portal/smelter?tab=inventory" kicker="Plant" title="Collected inventory" value={formatKg(v.inventoryKg)} hint={`${formatKg(v.inventoryContainedKg)} contained tin ready to aggregate.`} />
        <DashCard href="/portal/smelter?tab=certificates" kicker="Fiscal" title="Royalty you hold" value={formatNgnCompact(v.royaltyHeldNgn)} hint={`${formatNgn(v.royaltyHeldNgn)} transferred at ₦0 on each DMO-A. Reconciled on refined export or domestic sale.`} tone="warn" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <DashCard href="/portal/smelter?tab=inventory" kicker="Plant" title="Parent lots" value={v.parentLots} hint={`${formatKg(v.unsmeltedContainedKg)} Sn not yet smelted.`} />
        <DashCard href="/portal/smelter?tab=refined" kicker="Plant" title="Refined output" value={formatKg(v.refinedKg)} hint={v.recoveryWeighted != null ? `Weighted recovery ${formatPct(v.recoveryWeighted, 1)} across campaigns.` : "Register a campaign after you aggregate."} />
        <DashCard href="/portal/smelter?tab=pool" kicker="Market" title="Accept at board price" hint={`Domestic purchase is government reference × ${state.policy.coefToSmelter}. Price locks when you accept.`} />
      </div>

      <Panel kicker="Feed to metal" title="Your concentrate lots — chain of custody">
        <p className="mb-4 text-sm text-[var(--ink-muted)]">
          Every child lot you accepted, from DMO-A through collection, parent lot and furnace. Nothing is overwritten; each step is an
          audit event.
        </p>
        {v.childLots.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">No accepted lots yet. Open the National Pool to take the first one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                <tr>
                  <th className="pb-2 font-semibold">Child lot</th>
                  <th className="pb-2 text-right font-semibold">Weight</th>
                  <th className="pb-2 text-right font-semibold">Grade</th>
                  <th className="pb-2 text-right font-semibold">Contained Sn</th>
                  <th className="pb-2 font-semibold">Parent lot</th>
                  <th className="pb-2 font-semibold">DMO-A</th>
                  <th className="pb-2 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {v.childLots.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2 tabular-nums">{l.id}</td>
                    <td className="py-2 text-right tabular-nums">{formatKg(l.kg)}</td>
                    <td className="py-2 text-right tabular-nums">{formatPct(l.gradePct, 2)}</td>
                    <td className="py-2 text-right tabular-nums">{formatKg(l.kg * (l.gradePct / 100))}</td>
                    <td className="py-2 tabular-nums text-[var(--ink-muted)]">{l.parentLotId ?? "—"}</td>
                    <td className="py-2 tabular-nums">
                      {l.certNo ? (
                        <a href={`/certificates/${l.certNo}`} className="underline-offset-4 hover:underline">
                          {l.certNo}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <LotStatusPill status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
