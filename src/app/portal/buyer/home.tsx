import { KpiTile, StatusTile } from "@/components/portal/kpi-tile";
import { WelcomeBanner } from "@/components/portal/welcome-banner";
import { formatKg, formatPct } from "@/lib/format";
import { acceptancesFor, participantName, poolFor } from "@/lib/dmo/queries";
import type { DemoState, Participant } from "@/lib/dmo/types";

export function BuyerHome({ state, me, nowIso }: { state: DemoState; me: Participant; nowIso: string }) {
  const pool = poolFor(state, "buyers");
  const purchases = acceptancesFor(state, me.id);
  const latest = purchases.slice(0, 7);

  return (
    <div className="space-y-5">
      <WelcomeBanner name={me.legalName} nowIso={nowIso} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile href="/portal/buyer?tab=pool" icon="pool" label="Refined tin offered" value={pool.length} hint={`${state.policy.offerPeriodDays}-day domestic window.`} />
        <KpiTile href="/portal/buyer?tab=purchases" icon="list" label="Lots you have bought" value={purchases.length} hint="Each purchase issues a DMO-A." />
        <KpiTile icon="weight" label="Open offer lots" value={pool.length} hint="Buy at the live board price." />
        <StatusTile
          href="/portal/buyer?tab=pool"
          label="Domestic offer"
          ok={pool.length === 0}
          okText="No refined lots waiting — window is clear"
          waitText={`${pool.length} refined lot${pool.length === 1 ? "" : "s"} offered to domestic industry`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <section className="portal-card overflow-hidden">
          <div className="flex items-end justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
            <div>
              <h2 className="font-display text-lg">Recent purchases</h2>
              <p className="text-xs text-[var(--ink-muted)]">Domestic acceptances naming this buyer</p>
            </div>
            <a href="/portal/buyer?tab=purchases" className="text-sm font-semibold text-[var(--forest)] hover:underline">
              All purchases
            </a>
          </div>
          {latest.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[var(--ink-muted)]">No purchases yet. Open the refined pool to take a lot.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  <tr>
                    <th className="px-5 pb-2 pt-3 font-semibold">Lot</th>
                    <th className="pb-2 pt-3 font-semibold">Supplier</th>
                    <th className="pb-2 pt-3 text-right font-semibold">Weight</th>
                    <th className="px-5 pb-2 pt-3 text-right font-semibold">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {latest.map((a) => {
                    const lot = state.lots.find((l) => l.id === a.lotId);
                    return (
                      <tr key={a.id}>
                        <td className="px-5 py-2.5 tabular-nums">{a.lotId}</td>
                        <td className="py-2.5">{lot ? participantName(state, lot.ownerId) : "—"}</td>
                        <td className="py-2.5 text-right tabular-nums">{lot ? formatKg(lot.verifiedKg ?? lot.declaredKg) : "—"}</td>
                        <td className="px-5 py-2.5 text-right tabular-nums">
                          {lot ? formatPct(lot.verifiedGradePct ?? lot.declaredGradePct, 2) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="portal-card flex flex-col p-5">
          <h2 className="font-display text-lg">What you can do</h2>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Refined Nigerian tin is offered to domestic industry for {state.policy.offerPeriodDays} days before any export clearance can
            issue. A DMO-A records the sale.
          </p>
          {pool[0] && (
            <p className="mt-4 text-sm">
              Next lot on the clock: <span className="tabular-nums font-semibold">{pool[0].lot.id}</span>
            </p>
          )}
          <a
            href="/portal/buyer?tab=pool"
            className="mt-auto inline-flex h-11 items-center justify-center rounded-lg bg-[#1b4d38] px-4 text-sm font-semibold text-white hover:bg-[#163d2c]"
          >
            View refined tin offered →
          </a>
        </section>
      </div>
    </div>
  );
}
