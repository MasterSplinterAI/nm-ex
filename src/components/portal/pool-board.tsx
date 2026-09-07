import type { ReactNode } from "react";
import { Countdown } from "@/components/portal/countdown";
import { formatKg, formatNgn, formatNgnPrecise, formatPct, formatUsd } from "@/lib/format";
import { lotEconomics, poolFormulas } from "@/lib/dmo/lot-view";
import type { PoolEntry } from "@/lib/dmo/queries";
import type { DmoPolicy, LotKind } from "@/lib/dmo/types";

/**
 * One board for every view of the National Pool. A market participant sees the
 * lots they may act on; the registry sees the same rows with a clock and the
 * power to close an offer. Tabular because a pool with fifty lots in it is the
 * point of the thing.
 */
export function PoolBoard({
  pool,
  policy,
  lmeUsd,
  fxRate,
  nowIso,
  kind,
  title,
  lede,
  lotHref,
  supplierHref,
  action,
  showCountdown = false,
  emptyText,
  headline = true,
}: {
  pool: PoolEntry[];
  policy: DmoPolicy;
  lmeUsd: number;
  fxRate: number;
  nowIso: string;
  kind: LotKind;
  title: string;
  lede: string;
  lotHref: (lotId: string) => string;
  supplierHref?: (supplierId: string) => string;
  /** Renders the trailing cell — Bid/View for a market, close-out for the registry. */
  action: (entry: PoolEntry) => ReactNode;
  showCountdown?: boolean;
  emptyText: string;
  /** Off for a secondary board stacked under another on the same page. */
  headline?: boolean;
}) {
  const rows = pool.map((entry) => ({ entry, e: lotEconomics(entry.lot, policy, lmeUsd, fxRate) }));
  const volume = rows.reduce((n, r) => n + r.e.kg, 0);
  const contained = rows.reduce((n, r) => n + r.e.containedKg, 0);
  const listing = rows.reduce((n, r) => n + r.e.listing, 0);
  const royalty = rows.reduce((n, r) => n + r.e.royalty, 0);
  const vat = rows.reduce((n, r) => n + r.e.vat, 0);
  const formulas = poolFormulas(policy, lmeUsd, fxRate, kind);
  const assay = kind === "concentrate" ? "Grade" : "Purity";
  const metal = kind === "concentrate" ? "Contained Sn" : "Fine Sn";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {headline ? (
            <h1 className="font-display text-2xl sm:text-[1.75rem]">{title}</h1>
          ) : (
            <h2 className="font-display text-xl">{title}</h2>
          )}
          <p className="mt-1 max-w-3xl text-sm text-[var(--ink-muted)]">{lede}</p>
        </div>
        {headline && (
          <div className="flex flex-wrap gap-3">
            <Stat label="LME tin (USD/t)" value={formatUsd(lmeUsd)} />
            <Stat label="FX (₦/$)" value={`₦${fxRate.toLocaleString("en-NG")}`} />
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Lots on offer" value={String(rows.length)} />
        <StatCard label="Gross weight" value={formatKg(volume)} sub={`${(volume / 1000).toFixed(3)} tonnes of material`} />
        <StatCard label={kind === "concentrate" ? "Contained tin" : "Fine tin"} value={formatKg(contained)} sub={`${(contained / 1000).toFixed(3)} tonnes of Sn`} />
        <StatCard label="Total listing value" value={formatNgn(listing)} />
      </div>

      <section className="portal-card overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-sm text-[var(--ink-muted)]">{emptyText}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-[13px]">
              <thead>
                <tr className="bg-[#1b4d38] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-white">
                  <th className="whitespace-nowrap py-2.5">Lot no.</th>
                  <th className="py-2.5">Supplier</th>
                  <th className="py-2.5 text-right">Gross weight (kg)</th>
                  <th className="py-2.5 text-right">{assay} (Sn %)</th>
                  <th className="py-2.5 text-right">{metal} (kg)</th>
                  <th className="py-2.5 text-right">Listing price (₦)</th>
                  <th className="py-2.5 text-right">Royalty {policy.royaltyPct}% (₦)</th>
                  <th className="py-2.5 text-right">VAT {policy.vatPct}% (₦)</th>
                  {showCountdown && <th className="whitespace-nowrap py-2.5">Closes in</th>}
                  {/* Pinned so the action stays reachable however wide the board grows. */}
                  <th className="sticky right-0 z-10 bg-[#1b4d38] py-2.5 pl-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]">
                {rows.map(({ entry, e }) => (
                  <tr key={entry.offer.id} className="group hover:bg-[#1b4d38]/[0.04]">
                    <td className="whitespace-nowrap py-2.5 font-semibold">
                      <a href={lotHref(entry.lot.id)} className="text-[#1f4b6b] hover:underline">
                        {entry.lot.id}
                      </a>
                    </td>
                    <td className="py-2.5">
                      {supplierHref ? (
                        <a href={supplierHref(entry.supplier.id)} className="text-[#1f4b6b] hover:underline">
                          {entry.supplier.legalName}
                        </a>
                      ) : (
                        entry.supplier.legalName
                      )}
                      <span className="block text-[11px] text-[var(--ink-soft)]">
                        {entry.supplier.address.split(",").slice(-2, -1)[0]?.trim() ?? "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-2.5 text-right">{e.kg.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="whitespace-nowrap py-2.5 text-right">{e.grade.toFixed(4)}</td>
                    <td className="whitespace-nowrap py-2.5 text-right font-semibold">
                      {e.containedKg.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="whitespace-nowrap py-2.5 text-right font-semibold">{formatNgn(e.listing)}</td>
                    <td className="whitespace-nowrap py-2.5 text-right">{formatNgn(e.royalty)}</td>
                    <td className="whitespace-nowrap py-2.5 text-right">{formatNgn(e.vat)}</td>
                    {showCountdown && (
                      <td className="whitespace-nowrap py-2.5">
                        <Countdown untilIso={entry.offer.closesAt} nowIso={nowIso} className="text-xs" />
                      </td>
                    )}
                    <td className="sticky right-0 z-10 border-l border-[var(--rule)] bg-white py-2.5 pl-3 group-hover:bg-[#f7faf8]">
                      <div className="flex justify-end gap-2 whitespace-nowrap">{action(entry)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--line-strong)] bg-[#f4f7f5] font-bold">
                  <td className="whitespace-nowrap py-3" colSpan={2}>
                    Total · {rows.length} lot{rows.length === 1 ? "" : "s"}
                  </td>
                  <td className="whitespace-nowrap py-3 text-right">{volume.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3" />
                  <td className="whitespace-nowrap py-3 text-right">{contained.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="whitespace-nowrap py-3 text-right">{formatNgnPrecise(listing)}</td>
                  <td className="whitespace-nowrap py-3 text-right">{formatNgnPrecise(royalty)}</td>
                  <td className="whitespace-nowrap py-3 text-right">{formatNgnPrecise(vat)}</td>
                  {showCountdown && <td />}
                  <td className="sticky right-0 z-10 border-l border-[var(--rule)] bg-[#f4f7f5]" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <section className="portal-card overflow-hidden">
          <div className="card-head">
            <h2 className="card-title">How every figure is calculated</h2>
          </div>
          <dl className="px-4 py-2">
            {formulas.map((row) => (
              <div key={row.label} className="border-b border-[var(--rule)] py-2 last:border-b-0">
                <dt className="text-sm font-semibold text-[var(--ink)]">{row.label}</dt>
                <dd className="formula mt-0.5">= {row.expression}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="portal-card overflow-hidden">
          <div className="card-head">
            <h2 className="card-title">
              Summary totals ({rows.length} lot{rows.length === 1 ? "" : "s"})
            </h2>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-5">
            <Total label="Gross weight" value={formatKg(volume)} sub={`${(volume / 1000).toFixed(3)} tonnes`} />
            <Total label={kind === "concentrate" ? "Contained tin" : "Fine tin"} value={formatKg(contained)} sub={`${(contained / 1000).toFixed(3)} tonnes Sn`} />
            <Total label="Total listing value" value={formatNgn(listing)} />
            <Total label={`Total royalty (${policy.royaltyPct}%)`} value={formatNgn(royalty)} />
            <Total label={`Total VAT (${policy.vatPct}%)`} value={formatNgn(vat)} />
          </div>
          <p className="border-t border-[var(--rule)] px-4 py-2.5 text-xs text-[var(--ink-muted)]">
            {kind === "concentrate"
              ? "Royalty transfers to the buying smelter at ₦0 on acceptance."
              : "Refined metal is sold at the full reference value — no smelter coefficient applies."}{" "}
            Percentages are shown against the verified {formatPct(
              volume > 0 ? (contained / volume) * 100 : 0,
              2,
            )} average {kind === "concentrate" ? "grade" : "purity"} across the board.
          </p>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="portal-card px-3 py-2">
      <p className="eyebrow">{label}</p>
      <p className="font-display text-lg tabular-nums">{value}</p>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="portal-card p-4">
      <p className="eyebrow">{label}</p>
      <p className="font-display mt-1 text-2xl tabular-nums">{value}</p>
      {sub && <p className="text-xs text-[var(--ink-soft)]">{sub}</p>}
    </div>
  );
}

function Total({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="font-display mt-1 text-xl tabular-nums">{value}</p>
      {sub && <p className="text-xs text-[var(--ink-soft)]">{sub}</p>}
    </div>
  );
}
