import { ActionButton, ActionForm } from "@/components/portal/action-button";
import { Countdown } from "@/components/portal/countdown";
import { Empty } from "@/components/portal/empty";
import { Money } from "@/components/portal/money";
import { Panel } from "@/components/portal/panel";
import { formatDateTime, formatKg, formatPct } from "@/lib/format";
import { commodityLabel } from "@/lib/dmo/labels";
import { openOffers } from "@/lib/dmo/queries";
import { referenceValueNgn } from "@/lib/dmo/valuation";
import type { DemoState } from "@/lib/dmo/types";
import type { SpotBoard } from "@/lib/types";
import { forceExpireAction } from "../actions";

export function OffersTab({ state, board, nowIso }: { state: DemoState; board: SpotBoard; nowIso: string }) {
  const offers = openOffers(state);
  const lme = board.minerals.find((m) => m.slug === "tin")?.lastUsd ?? 0;
  const closed = state.offers.filter((o) => o.status !== "open").sort((a, b) => b.closesAt.localeCompare(a.closesAt)).slice(0, 10);

  return (
    <div className="space-y-6">
      <Panel kicker="National Pool" title="Open domestic offers">
        {offers.length === 0 ? (
          <Empty>No offers open. Verify a lot in Inspections to open one.</Empty>
        ) : (
          <div className="space-y-4">
            {offers.map(({ offer, lot, supplier }) => {
              const ref = referenceValueNgn(lot.verifiedKg! / 1000, lot.verifiedGradePct!, lme, board.fx.rate);
              const coef = lot.kind === "concentrate" ? state.policy.coefToSmelter : 1;
              return (
                <article key={offer.id} className="grid gap-4 border border-[var(--line)] bg-white/70 p-5 lg:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                      {commodityLabel(lot.kind)} · offered to qualified {offer.audience === "smelters" ? "smelters" : "domestic buyers"}
                    </p>
                    <h3 className="font-display mt-1 text-xl tabular-nums">{lot.id}</h3>
                    <p className="text-sm text-[var(--ink-muted)]">
                      {supplier.legalName} · {formatKg(lot.verifiedKg)} verified {formatPct(lot.verifiedGradePct!, 2)} Sn · opened {formatDateTime(offer.opensAt)}
                    </p>
                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Indicative reference (live)</p>
                        <Money ngn={ref} size="sm" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Indicative purchase × {coef}</p>
                        <Money ngn={ref * coef} size="sm" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Royalty if exported ({state.policy.royaltyPct}%)</p>
                        <Money ngn={ref * (state.policy.royaltyPct / 100)} size="sm" tone="red" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <Countdown untilIso={offer.closesAt} nowIso={nowIso} label="Closes in" className="text-sm" />
                    <ActionForm
                      action={forceExpireAction}
                      hidden={{ offerId: offer.id }}
                      confirm="Close this offer now with no acceptance? An export clearance certificate will be issued at the current board price."
                    >
                      <ActionButton tone="danger" small>Close with no acceptance → issue clearance</ActionButton>
                    </ActionForm>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel kicker="History" title="Recently closed offers">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            <tr>
              <th className="pb-2 font-semibold">Lot</th>
              <th className="pb-2 font-semibold">Audience</th>
              <th className="pb-2 font-semibold">Outcome</th>
              <th className="pb-2 font-semibold">Certificate</th>
              <th className="pb-2 text-right font-semibold">Closed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {closed.map((o) => (
              <tr key={o.id}>
                <td className="py-2 tabular-nums">{o.lotId}</td>
                <td className="py-2 text-[var(--ink-muted)]">{o.audience}</td>
                <td className="py-2">{o.status === "accepted" ? "Accepted domestically" : o.status === "expired" ? "No domestic acceptance" : o.status}</td>
                <td className="py-2 tabular-nums">{o.certNo ? <a href={`/certificates/${o.certNo}`} className="underline-offset-4 hover:underline">{o.certNo}</a> : "—"}</td>
                <td className="py-2 text-right tabular-nums text-[var(--ink-muted)]">{formatDateTime(o.closesAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
