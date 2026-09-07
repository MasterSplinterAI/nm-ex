import { formatKg, formatNgn, formatNgnPrecise, formatPct, formatUsd, formatWelcomeStamp } from "@/lib/format";
import { lotEconomics, poolFormulas } from "@/lib/dmo/lot-view";
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
  const rows = pool.map((entry) => ({ entry, e: lotEconomics(entry.lot, policy, lmeUsd, fxRate) }));
  const volume = rows.reduce((n, r) => n + r.e.kg, 0);
  const listing = rows.reduce((n, r) => n + r.e.listing, 0);
  const royalty = rows.reduce((n, r) => n + r.e.royalty, 0);
  const vat = rows.reduce((n, r) => n + r.e.vat, 0);
  const formulas = poolFormulas(policy, lmeUsd, fxRate);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-[1.75rem]">National Pool — tin (Sn) concentrate</h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Verified lots from accredited tin sheds and aggregators. An assay is locked before a lot appears here.
          </p>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">{formatWelcomeStamp(nowIso)} WAT</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Stat label="LME tin (USD/t)" value={formatUsd(lmeUsd)} />
          <Stat label="FX (₦/$)" value={`₦${fxRate.toLocaleString("en-NG")}`} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total available lots" value={String(rows.length)} />
        <StatCard label="Total volume" value={formatKg(volume)} sub={`${(volume / 1000).toFixed(3)} tonnes`} />
        <StatCard label="Total listing value" value={formatNgn(listing)} />
      </div>

      <section className="portal-card overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-sm text-[var(--ink-muted)]">
            The National Pool is empty. Lots appear when NM-EX locks an assay and opens the domestic window.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full whitespace-nowrap text-[13px]">
              <thead>
                <tr className="bg-[#1b4d38] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-white">
                  <th className="py-2.5">Lot no.</th>
                  <th className="py-2.5">Supplier</th>
                  <th className="py-2.5 text-right">Final weight (kg)</th>
                  <th className="py-2.5 text-right">Grade (Sn %)</th>
                  <th className="py-2.5 text-right">Listing price (₦)</th>
                  <th className="py-2.5 text-right">Royalty {policy.royaltyPct}% (₦)</th>
                  <th className="py-2.5 text-right">VAT {policy.vatPct}% (₦)</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]">
                {rows.map(({ entry, e }) => {
                  const href = `/portal/smelter?tab=pool&lot=${encodeURIComponent(entry.lot.id)}`;
                  return (
                    <tr key={entry.offer.id} className="hover:bg-[#1b4d38]/[0.04]">
                      <td className="py-2.5 font-semibold">{entry.lot.id}</td>
                      <td className="py-2.5">
                        {entry.supplier.legalName}
                        <span className="block text-[11px] text-[var(--ink-soft)]">
                          {entry.supplier.address.split(",").slice(-2, -1)[0]?.trim() ?? "—"}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">{e.kg.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-2.5 text-right">{e.grade.toFixed(4)}</td>
                      <td className="py-2.5 text-right font-semibold">{formatNgn(e.listing)}</td>
                      <td className="py-2.5 text-right">{formatNgn(e.royalty)}</td>
                      <td className="py-2.5 text-right">{formatNgn(e.vat)}</td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1b4d38]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#1b4d38]" />
                          Available
                        </span>
                      </td>
                      <td className="py-2.5">
                        <div className="flex justify-end gap-2">
                          <a
                            href={href}
                            className="inline-flex h-7 items-center rounded-md bg-[#1b4d38] px-3 text-xs font-semibold text-white hover:bg-[#163d2c]"
                          >
                            Bid
                          </a>
                          <a
                            href={href}
                            className="inline-flex h-7 items-center rounded-md border border-[var(--line-strong)] px-3 text-xs font-semibold text-[var(--ink)] hover:border-[#1b4d38] hover:text-[#1b4d38]"
                          >
                            View
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--line-strong)] bg-[#f4f7f5] font-bold">
                  <td className="py-3" colSpan={2}>
                    Total · {rows.length} lot{rows.length === 1 ? "" : "s"}
                  </td>
                  <td className="py-3 text-right">{volume.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3" />
                  <td className="py-3 text-right">{formatNgnPrecise(listing)}</td>
                  <td className="py-3 text-right">{formatNgnPrecise(royalty)}</td>
                  <td className="py-3 text-right">{formatNgnPrecise(vat)}</td>
                  <td colSpan={2} />
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
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
            <Total label="Total volume" value={formatKg(volume)} sub={`${(volume / 1000).toFixed(3)} tonnes`} />
            <Total label="Total listing value" value={formatNgn(listing)} />
            <Total label={`Total royalty (${policy.royaltyPct}%)`} value={formatNgn(royalty)} />
            <Total label={`Total VAT (${policy.vatPct}%)`} value={formatNgn(vat)} />
          </div>
          <p className="border-t border-[var(--rule)] px-4 py-2.5 text-xs text-[var(--ink-muted)]">
            Royalty transfers to the buying smelter at ₦0 on acceptance. Open a lot to accept it at the live board price.
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
