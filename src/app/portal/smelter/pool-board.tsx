import { formatKg, formatNgn, formatNgnPrecise, formatPct, formatUsd, formatWelcomeStamp } from "@/lib/format";
import { lotEconomics } from "@/lib/dmo/lot-view";
import type { PoolEntry } from "@/lib/dmo/queries";
import type { DmoPolicy } from "@/lib/dmo/types";

export function PoolBoard({
  pool,
  policy,
  lmeUsd,
  fxRate,
  nowIso,
}: {
  pool: PoolEntry[];
  policy: DmoPolicy;
  lmeUsd: number;
  fxRate: number;
  nowIso: string;
}) {
  const rows = pool.map((entry) => {
    const e = lotEconomics(entry.lot, policy, lmeUsd, fxRate);
    return { entry, e };
  });
  const volume = rows.reduce((n, r) => n + r.e.kg, 0);
  const listing = rows.reduce((n, r) => n + r.e.listing, 0);
  const royalty = rows.reduce((n, r) => n + r.e.royalty, 0);
  const vat = rows.reduce((n, r) => n + r.e.vat, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-tight sm:text-3xl">National Pool — tin (Sn) concentrate</h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Verified lots from accredited sheds and aggregators. Assay is locked before a lot appears here.
          </p>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">{formatWelcomeStamp(nowIso)} WAT</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <Stat label="LME tin" value={formatUsd(lmeUsd)} />
          <Stat label="USD → NGN" value={`₦${fxRate.toLocaleString("en-NG")}`} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Available lots" value={rows.length} />
        <StatCard label="Total volume" value={formatKg(volume)} />
        <StatCard label="Total listing value" value={formatNgn(listing)} />
      </div>

      <section className="portal-card overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--ink-muted)]">The National Pool is empty. Lots appear when NM-EX locks an assay and opens the domestic window.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                <tr>
                  <th className="px-5 pb-2 pt-3 font-semibold">Lot no.</th>
                  <th className="pb-2 pt-3 font-semibold">Supplier</th>
                  <th className="pb-2 pt-3 text-right font-semibold">Final weight</th>
                  <th className="pb-2 pt-3 text-right font-semibold">Final grade</th>
                  <th className="pb-2 pt-3 text-right font-semibold">Listing price</th>
                  <th className="pb-2 pt-3 text-right font-semibold">Royalty {policy.royaltyPct}%</th>
                  <th className="pb-2 pt-3 text-right font-semibold">VAT {policy.vatPct}%</th>
                  <th className="pb-2 pt-3 font-semibold">Status</th>
                  <th className="px-5 pb-2 pt-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {rows.map(({ entry, e }) => (
                  <tr key={entry.offer.id}>
                    <td className="px-5 py-3 tabular-nums font-semibold">{entry.lot.id}</td>
                    <td className="py-3">{entry.supplier.legalName}</td>
                    <td className="py-3 text-right tabular-nums">{formatKg(e.kg)}</td>
                    <td className="py-3 text-right tabular-nums">{formatPct(e.grade, 4)}</td>
                    <td className="py-3 text-right tabular-nums">{formatNgn(e.listing)}</td>
                    <td className="py-3 text-right tabular-nums">{formatNgn(e.royalty)}</td>
                    <td className="py-3 text-right tabular-nums">{formatNgn(e.vat)}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1b4d38]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1b4d38]" />
                        Available
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <a
                          href={`/portal/smelter?tab=pool&lot=${encodeURIComponent(entry.lot.id)}`}
                          className="inline-flex h-8 items-center rounded-md bg-[#1b4d38] px-3 text-xs font-semibold text-white hover:bg-[#163d2c]"
                        >
                          Bid
                        </a>
                        <a
                          href={`/portal/smelter?tab=pool&lot=${encodeURIComponent(entry.lot.id)}`}
                          className="inline-flex h-8 items-center text-sm font-semibold text-[#1f4b6b] hover:underline"
                        >
                          View
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--line)] text-sm font-semibold">
                  <td className="px-5 py-3" colSpan={2}>
                    Totals
                  </td>
                  <td className="py-3 text-right tabular-nums">{formatKg(volume)}</td>
                  <td />
                  <td className="py-3 text-right tabular-nums">{formatNgnPrecise(listing)}</td>
                  <td className="py-3 text-right tabular-nums">{formatNgnPrecise(royalty)}</td>
                  <td className="py-3 text-right tabular-nums">{formatNgnPrecise(vat)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-[var(--ink-muted)]">
        Listing price = contained tin × LME × FX × {policy.coefToSmelter} smelter coefficient. Royalty is {policy.royaltyPct}% of the full metal reference and transfers to you at ₦0 on
        acceptance. View a row to accept at the live board.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">{label}</p>
      <p className="tabular-nums font-semibold">{value}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="portal-card p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">{label}</p>
      <p className="font-display mt-1 text-2xl tabular-nums">{value}</p>
    </div>
  );
}
