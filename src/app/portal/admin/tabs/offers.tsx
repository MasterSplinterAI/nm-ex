import { ActionButton, ActionForm } from "@/components/portal/action-button";
import { Panel } from "@/components/portal/panel";
import { PoolBoard } from "@/components/portal/pool-board";
import { formatDateTime } from "@/lib/format";
import { poolFor, type PoolEntry } from "@/lib/dmo/queries";
import type { DemoState } from "@/lib/dmo/types";
import type { SpotBoard } from "@/lib/types";
import { forceExpireAction } from "../actions";

export function OffersTab({ state, board, nowIso }: { state: DemoState; board: SpotBoard; nowIso: string }) {
  const smelterPool = poolFor(state, "smelters");
  const buyerPool = poolFor(state, "buyers");
  const lme = board.minerals.find((m) => m.slug === "tin")?.lastUsd ?? 0;
  const closed = state.offers
    .filter((o) => o.status !== "open")
    .sort((a, b) => b.closesAt.localeCompare(a.closesAt))
    .slice(0, 12);

  /** Closing an offer with no acceptance is what issues an export clearance. */
  const closeOut = (entry: PoolEntry) => (
    <ActionForm
      action={forceExpireAction}
      hidden={{ offerId: entry.offer.id }}
      confirm={`Close ${entry.lot.id} now with no acceptance? An export clearance will be issued at the current board price.`}
    >
      <ActionButton tone="danger" small>
        Close offer
      </ActionButton>
    </ActionForm>
  );

  return (
    <div className="space-y-8">
      <PoolBoard
        pool={smelterPool}
        policy={state.policy}
        lmeUsd={lme}
        fxRate={board.fx.rate}
        nowIso={nowIso}
        kind="concentrate"
        title="Concentrate offered to qualified smelters"
        lede="This is the board United Smelters and every other qualified processor sees. Refined tin is offered separately to domestic buyers, below."
        lotHref={(id) => `/portal/admin?lot=${encodeURIComponent(id)}`}
        supplierHref={(id) => `/portal/admin?tab=registrations&entity=${encodeURIComponent(id)}`}
        emptyText="No concentrate on offer. Verify a lot in Inspections to open one."
        showCountdown
        headline={false}
        action={closeOut}
      />

      <PoolBoard
        pool={buyerPool}
        policy={state.policy}
        lmeUsd={lme}
        fxRate={board.fx.rate}
        nowIso={nowIso}
        kind="refined"
        title="Refined tin offered to domestic buyers"
        lede="Nigerian-refined metal must be offered at home before it may be exported. These lots do not appear on a smelter's pool."
        lotHref={(id) => `/portal/admin?lot=${encodeURIComponent(id)}`}
        supplierHref={(id) => `/portal/admin?tab=registrations&entity=${encodeURIComponent(id)}`}
        emptyText="No refined tin on offer."
        showCountdown
        headline={false}
        action={closeOut}
      />

      <Panel kicker="History" title="Recently closed offers">
        <div className="overflow-x-auto">
          <table className="data-table w-full text-[13px]">
            <thead className="table-head">
              <tr>
                <th className="py-2">Lot</th>
                <th className="py-2">Audience</th>
                <th className="py-2">Outcome</th>
                <th className="py-2">Certificate</th>
                <th className="py-2 text-right">Closed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule)]">
              {closed.map((o) => (
                <tr key={o.id} className="hover:bg-[#1b4d38]/[0.04]">
                  <td className="py-2 tabular-nums">
                    <a href={`/portal/admin?lot=${encodeURIComponent(o.lotId)}`} className="font-semibold text-[#1f4b6b] hover:underline">
                      {o.lotId}
                    </a>
                  </td>
                  <td className="py-2 text-[var(--ink-muted)]">{o.audience}</td>
                  <td className="py-2">
                    {o.status === "accepted"
                      ? "Accepted domestically"
                      : o.status === "expired"
                        ? "No domestic acceptance"
                        : o.status}
                  </td>
                  <td className="py-2 tabular-nums">
                    {o.certNo ? (
                      <a href={`/certificates/${o.certNo}`} className="text-[#1f4b6b] hover:underline">
                        {o.certNo}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums text-[var(--ink-muted)]">{formatDateTime(o.closesAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
