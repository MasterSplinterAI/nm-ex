import { formatDate, formatKg, formatNgn, formatPct } from "@/lib/format";
import { lotEconomics, originLine } from "@/lib/dmo/lot-view";
import { lotsFor, offerForLot, participantById } from "@/lib/dmo/queries";
import type { DemoState, Participant } from "@/lib/dmo/types";

export function SupplierPoolListings({
  state,
  me,
  lmeUsd,
  fxRate,
}: {
  state: DemoState;
  me: Participant;
  lmeUsd: number;
  fxRate: number;
}) {
  const rows = lotsFor(state, me.id)
    .map((lot) => ({ lot, offer: offerForLot(state, lot.id) }))
    .filter((row) => row.offer != null)
    .sort((a, b) => (b.offer?.opensAt ?? "").localeCompare(a.offer?.opensAt ?? ""));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl tracking-tight sm:text-3xl">National Pool — your listings</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Lots from this shed that NM-EX has verified and posted. Open a listing to see price, royalty and whether a smelter has accepted.
        </p>
      </div>

      <section className="portal-card overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--ink-muted)]">
            Nothing posted yet. Lots appear here after the officer locks the assay and opens the domestic window.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                <tr>
                  <th className="px-5 pb-2 pt-3 font-semibold">Lot no.</th>
                  <th className="pb-2 pt-3 font-semibold">Origin</th>
                  <th className="pb-2 pt-3 text-right font-semibold">Final weight</th>
                  <th className="pb-2 pt-3 text-right font-semibold">Final grade</th>
                  <th className="pb-2 pt-3 text-right font-semibold">Listing price</th>
                  <th className="pb-2 pt-3 font-semibold">Listed</th>
                  <th className="pb-2 pt-3 font-semibold">Status</th>
                  <th className="px-5 pb-2 pt-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {rows.map(({ lot, offer }) => {
                  const e = lotEconomics(lot, state.policy, lmeUsd, fxRate);
                  const buyer = offer?.acceptanceId
                    ? participantById(state, state.acceptances.find((a) => a.id === offer.acceptanceId)?.acceptorId ?? "")
                    : null;
                  const sold = offer?.status === "accepted";
                  return (
                    <tr key={lot.id}>
                      <td className="px-5 py-3 tabular-nums font-semibold">{lot.id}</td>
                      <td className="py-3">{originLine(me)}</td>
                      <td className="py-3 text-right tabular-nums">{formatKg(e.kg)}</td>
                      <td className="py-3 text-right tabular-nums">{formatPct(e.grade, 4)}</td>
                      <td className="py-3 text-right tabular-nums">{formatNgn(e.listing)}</td>
                      <td className="py-3 tabular-nums text-[var(--ink-muted)]">{offer ? formatDate(offer.opensAt) : "—"}</td>
                      <td className="py-3">
                        <span className={`text-xs font-semibold ${sold ? "text-[#1b4d38]" : "text-[#1f4b6b]"}`}>
                          {sold ? `Sold${buyer ? ` — ${buyer.legalName}` : ""}` : "Available"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <a
                          href={`/portal/supplier?tab=listing&lot=${encodeURIComponent(lot.id)}`}
                          className="text-sm font-semibold text-[#1f4b6b] hover:underline"
                        >
                          View listing →
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
