import { KpiTile, StatusTile } from "@/components/portal/kpi-tile";
import { LotStatusPill } from "@/components/portal/status-pill";
import { WelcomeBanner } from "@/components/portal/welcome-banner";
import { formatKg, formatNgn, formatNgnCompact, formatPct } from "@/lib/format";
import { smelterVisibility } from "@/lib/dmo/reports";
import type { DemoState, Participant } from "@/lib/dmo/types";

export function SmelterHome({ state, me, nowIso }: { state: DemoState; me: Participant; nowIso: string }) {
  const v = smelterVisibility(state, me.id);
  const actionNeeded = v.pendingPayment > 0 || v.poolLots > 0;

  return (
    <div className="space-y-5">
      <WelcomeBanner name={me.legalName} nowIso={nowIso} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile href="/portal/smelter?tab=pool" icon="pool" label="National Pool" value={v.poolLots} hint="Verified concentrate offered before export." />
        <KpiTile href="/portal/smelter?tab=acceptances" icon="money" label="Awaiting payment" value={v.pendingPayment} hint={v.pendingCollection ? `${v.pendingCollection} paid, collection pending.` : "Pay within five days of acceptance."} />
        <KpiTile href="/portal/smelter?tab=inventory" icon="plant" label="Collected inventory" value={formatKg(v.inventoryKg)} hint={`${formatKg(v.inventoryContainedKg)} contained tin.`} />
        <StatusTile
          href={v.pendingPayment ? "/portal/smelter?tab=acceptances" : "/portal/smelter?tab=pool"}
          label="Plant action"
          ok={!actionNeeded}
          okText="No settlement waiting — plant is current"
          waitText={v.pendingPayment ? `${v.pendingPayment} lot${v.pendingPayment === 1 ? "" : "s"} waiting for payment` : `${v.poolLots} lot${v.poolLots === 1 ? "" : "s"} open in the National Pool`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <section className="portal-card overflow-hidden">
          <div className="flex items-end justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
            <div>
              <h2 className="font-display text-lg">Concentrate lots — chain of custody</h2>
              <p className="text-xs text-[var(--ink-muted)]">Every child lot you accepted, from DMO-A through the furnace</p>
            </div>
            <a href="/portal/smelter?tab=inventory" className="text-sm font-semibold text-[var(--forest)] hover:underline">
              Open inventory
            </a>
          </div>
          {v.childLots.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[var(--ink-muted)]">No accepted lots yet. Open the National Pool to take the first one.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  <tr>
                    <th className="px-5 pb-2 pt-3 font-semibold">Child lot</th>
                    <th className="pb-2 pt-3 text-right font-semibold">Weight</th>
                    <th className="pb-2 pt-3 text-right font-semibold">Grade</th>
                    <th className="pb-2 pt-3 text-right font-semibold">Contained Sn</th>
                    <th className="pb-2 pt-3 font-semibold">Parent</th>
                    <th className="px-5 pb-2 pt-3 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {v.childLots.map((l) => (
                    <tr key={l.id}>
                      <td className="px-5 py-2.5 tabular-nums">{l.id}</td>
                      <td className="py-2.5 text-right tabular-nums">{formatKg(l.kg)}</td>
                      <td className="py-2.5 text-right tabular-nums">{formatPct(l.gradePct, 2)}</td>
                      <td className="py-2.5 text-right tabular-nums">{formatKg(l.kg * (l.gradePct / 100))}</td>
                      <td className="py-2.5 tabular-nums text-[var(--ink-muted)]">{l.parentLotId ?? "—"}</td>
                      <td className="px-5 py-2.5 text-right">
                        <LotStatusPill status={l.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="portal-card flex flex-col p-5">
          <h2 className="font-display text-lg">Plant position</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--ink-muted)]">Parent lots</dt>
              <dd className="tabular-nums font-semibold">{v.parentLots}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--ink-muted)]">Unsmelted Sn</dt>
              <dd className="tabular-nums font-semibold">{formatKg(v.unsmeltedContainedKg)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--ink-muted)]">Refined output</dt>
              <dd className="tabular-nums font-semibold">{formatKg(v.refinedKg)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--ink-muted)]">Royalty you hold</dt>
              <dd className="tabular-nums font-semibold">{formatNgnCompact(v.royaltyHeldNgn)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-[var(--ink-muted)]">
            {formatNgn(v.royaltyHeldNgn)} transferred at ₦0 on each DMO-A. Domestic purchase is reference × {state.policy.coefToSmelter}.
          </p>
          <a
            href="/portal/smelter?tab=pool"
            className="mt-auto inline-flex h-11 items-center justify-center rounded-lg bg-[#1b4d38] px-4 text-sm font-semibold text-white hover:bg-[#163d2c]"
          >
            Open the National Pool →
          </a>
        </section>
      </div>
    </div>
  );
}
