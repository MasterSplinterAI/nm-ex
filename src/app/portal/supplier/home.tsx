import { KpiTile, StatusTile } from "@/components/portal/kpi-tile";
import { GradeTrend, WeightDonut } from "@/components/portal/mini-charts";
import { WelcomeBanner } from "@/components/portal/welcome-banner";
import { formatKg, formatPct } from "@/lib/format";
import { mmlKgForTier } from "@/lib/dmo/policy";
import { inventoryFor } from "@/lib/dmo/queries";
import type { DemoState, Participant, PurchaseEntry } from "@/lib/dmo/types";

export function SupplierHome({ state, me, nowIso }: { state: DemoState; me: Participant; nowIso: string }) {
  const inv = inventoryFor(state, me.id);
  const entries = [...inv.entries].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  const recent = [...entries].reverse().slice(0, 7);
  const kg = inv.tier1Kg;
  const mml = mmlKgForTier(1, state.policy);
  const avg = weightedGrade(entries);
  const ready = kg >= mml;
  const bySource = rollup(entries);

  return (
    <div className="space-y-5">
      <WelcomeBanner name={me.legalName} nowIso={nowIso} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile icon="weight" label="Total weight (current MML)" value={formatKg(kg)} />
        <KpiTile icon="beaker" label="Average purity (Sn)" value={entries.length ? formatPct(avg, 1) : "—"} />
        <KpiTile icon="list" label="Purchase records" value={entries.length} />
        <StatusTile
          href="/portal/supplier?tab=consolidate"
          label="DMO eligibility"
          ok={ready}
          okText="Eligible for DMO — meets MML threshold"
          waitText={`${formatKg(mml - kg)} more to reach the ${formatKg(mml)} MML`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <section className="portal-card overflow-hidden">
          <div className="flex items-end justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
            <div>
              <h2 className="font-display text-lg">Recent purchase logs</h2>
              <p className="text-xs text-[var(--ink-muted)]">Unallocated ledger — oldest entries will lock into the next lot</p>
            </div>
            <a href="/portal/supplier?tab=ledger" className="text-sm font-semibold text-[var(--forest)] hover:underline">
              Open ledger
            </a>
          </div>
          {entries.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[var(--ink-muted)]">No unallocated purchases yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  <tr>
                    <th className="px-5 pb-2 pt-3 font-semibold">Purchase ID</th>
                    <th className="pb-2 pt-3 font-semibold">Date</th>
                    <th className="pb-2 pt-3 font-semibold">Supplier / miner</th>
                    <th className="pb-2 pt-3 font-semibold">Your reference</th>
                    <th className="pb-2 pt-3 text-right font-semibold">Weight</th>
                    <th className="pb-2 pt-3 text-right font-semibold">Assay (Sn)</th>
                    <th className="px-5 pb-2 pt-3 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {recent.map((e) => (
                    <tr key={e.id}>
                      <td className="px-5 py-2.5 tabular-nums font-semibold">{e.id}</td>
                      <td className="py-2.5 tabular-nums">{e.date}</td>
                      <td className="py-2.5">{e.source}</td>
                      <td className="py-2.5 tabular-nums text-[var(--ink-muted)]">{e.reference || "—"}</td>
                      <td className="py-2.5 text-right tabular-nums">{formatKg(e.kg)}</td>
                      <td className="py-2.5 text-right tabular-nums">{formatPct(e.gradePct, 1)}</td>
                      <td className="px-5 py-2.5 text-right">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--forest)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--forest)]" />
                          Recorded
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[var(--line)] text-sm font-semibold">
                    <td className="px-5 py-3" colSpan={4}>
                      Total · {entries.length} records
                    </td>
                    <td className="py-3 text-right tabular-nums">{formatKg(kg)}</td>
                    <td className="py-3 text-right tabular-nums">{formatPct(avg, 1)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        <section className="portal-card flex flex-col p-5">
          <h2 className="font-display text-lg">MML compliance</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <Meter label="Minimum lot weight" target={`${formatKg(mml)}`} actual={formatKg(kg)} met={ready} pct={Math.min(100, (kg / mml) * 100)} />
            <Meter
              label="Minimum average purity (Sn)"
              target={`${formatPct(state.policy.tier1MinGradePct, 0)}`}
              actual={entries.length ? formatPct(avg, 1) : "—"}
              met={entries.length > 0 && avg > state.policy.tier1MinGradePct}
              pct={entries.length ? Math.min(100, (avg / Math.max(state.policy.tier1MinGradePct, 1)) * 100) : 0}
            />
          </dl>
          <div className={`mt-5 rounded-xl border px-3 py-3 text-sm ${ready ? "border-[#1b4d38]/30 bg-[#1b4d38]/8 text-[#1b4d38]" : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink-muted)]"}`}>
            {ready
              ? "This inventory meets the minimum marketable lot. Choose a warehouse and submit for official assay."
              : `Add ${formatKg(mml - kg)} more eligible concentrate to unlock lot consolidation.`}
          </div>
          <a
            href="/portal/supplier?tab=consolidate"
            className="mt-auto inline-flex h-11 items-center justify-center rounded-lg bg-[#1b4d38] px-4 text-sm font-semibold text-white hover:bg-[#163d2c]"
          >
            Proceed to lot consolidation →
          </a>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="portal-card p-5">
          <h2 className="font-display text-lg">Grade trend</h2>
          <p className="mb-2 text-xs text-[var(--ink-muted)]">Sn purity (%) across the last {Math.min(7, entries.length)} purchases</p>
          <GradeTrend points={entries.slice(-7).map((e, i) => ({ label: String(i + 1), value: e.gradePct }))} />
        </section>
        <section className="portal-card p-5">
          <h2 className="font-display text-lg">Weight contribution</h2>
          <p className="mb-3 text-xs text-[var(--ink-muted)]">Share of the current MML by source</p>
          <WeightDonut slices={bySource} totalKg={kg} />
        </section>
      </div>
    </div>
  );
}

function Meter({
  label,
  target,
  actual,
  met,
  pct,
}: {
  label: string;
  target: string;
  actual: string;
  met: boolean;
  pct: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <dt className="text-[var(--ink-muted)]">{label}</dt>
        <dd className={`text-xs font-semibold ${met ? "text-[var(--forest)]" : "text-[var(--copper)]"}`}>{met ? "Met" : "Short"}</dd>
      </div>
      <p className="mt-1 tabular-nums">
        {actual} <span className="text-[var(--ink-muted)]">/ {target}</span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--ink)]/10">
        <div className={`h-full rounded-full ${met ? "bg-[var(--forest)]" : "bg-[var(--copper)]"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function weightedGrade(entries: PurchaseEntry[]): number {
  const kg = entries.reduce((n, e) => n + e.kg, 0);
  if (kg <= 0) return 0;
  return entries.reduce((n, e) => n + e.kg * e.gradePct, 0) / kg;
}

function rollup(entries: PurchaseEntry[]): { label: string; kg: number }[] {
  const map = new Map<string, number>();
  for (const e of entries) map.set(e.source, (map.get(e.source) ?? 0) + e.kg);
  return [...map.entries()]
    .map(([label, kg]) => ({ label, kg }))
    .sort((a, b) => b.kg - a.kg);
}
