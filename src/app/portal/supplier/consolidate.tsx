import { ActionButton, ActionForm } from "@/components/portal/action-button";
import { FacilityPicker } from "@/components/portal/facility-picker";
import { formatKg, formatPct } from "@/lib/format";
import { FACILITIES } from "@/lib/dmo/facilities";
import { mmlKgForTier } from "@/lib/dmo/policy";
import { inventoryFor } from "@/lib/dmo/queries";
import type { DemoState, Participant } from "@/lib/dmo/types";
import { submitLotAction } from "./actions";

export function SupplierConsolidate({ state, me }: { state: DemoState; me: Participant }) {
  const inv = inventoryFor(state, me.id);
  const mml1 = mmlKgForTier(1, state.policy);
  const ready = inv.tier1Kg >= mml1;
  const entries = inv.entries.filter((e) => e.gradePct > state.policy.tier1MinGradePct);
  const avg =
    entries.reduce((n, e) => n + e.kg * e.gradePct, 0) / Math.max(entries.reduce((n, e) => n + e.kg, 0), 1);
  const defaultWarehouse =
    FACILITIES.find((f) => f.warehouse === state.policy.warehouses[0])?.warehouse ?? FACILITIES[0].warehouse;

  return (
    <div className="space-y-5">
      <p className="text-xs text-[var(--ink-muted)]">Home › Lot consolidation › Select delivery location</p>
      <ol className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {[
          ["Review purchases", true],
          ["Consolidate lot", ready],
          ["Select delivery location", true],
          ["Confirm & submit", false],
        ].map(([label, done], i) => (
          <li key={String(label)} className={`rounded-xl border px-3 py-2 ${done ? "border-[#1b4d38]/30 bg-[#1b4d38]/8" : "border-[var(--line)] bg-white"}`}>
            <span className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${done ? "bg-[#1b4d38] text-white" : "bg-[var(--paper)] text-[var(--ink-muted)]"}`}>
              {done ? "✓" : i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-tight sm:text-3xl">Lot consolidation</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">
            Choose the NM-EX warehouse that will receive the sample and lock the official assay to this lot.
          </p>
        </div>
        <a href="/portal/supplier" className="text-sm font-semibold text-[var(--forest)] hover:underline">
          Back to dashboard
        </a>
      </div>

      <ActionForm action={submitLotAction} inline={false} confirm={ready ? `Submit ${inv.tier1Kg} kg to the selected warehouse? Purchases lock to the lot.` : undefined}>
        <input type="hidden" name="tier" value="1" />
        <input type="hidden" name="kg" value={String(inv.tier1Kg)} />
        <FacilityPicker facilities={FACILITIES} defaultWarehouse={defaultWarehouse} />

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="portal-card p-5">
            <h2 className="font-display text-lg">Your consolidated lot</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--ink-muted)]">Total weight</dt>
                <dd className="tabular-nums font-semibold">{formatKg(inv.tier1Kg)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--ink-muted)]">Average purity (Sn)</dt>
                <dd className="tabular-nums font-semibold">{entries.length ? formatPct(avg, 1) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--ink-muted)]">Commodity</dt>
                <dd>Tin (Sn) concentrate</dd>
              </div>
            </dl>
            <p className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${ready ? "bg-[#1b4d38]/10 text-[#1b4d38]" : "bg-[var(--paper)] text-[var(--ink-muted)]"}`}>
              {ready ? "Eligible for DMO" : `${formatKg(mml1 - inv.tier1Kg)} short of MML`}
            </p>
          </section>
          <section className="portal-card p-5">
            <h2 className="font-display text-lg">What happens next</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-[var(--ink-muted)]">
              <li>Purchases lock to a lot number.</li>
              <li>You deliver a sample to the warehouse within 48 hours.</li>
              <li>Official weight and assay are locked to the lot.</li>
              <li>The lot enters the National Pool for domestic smelters.</li>
              <li>Acceptance or export clearance issues from that record.</li>
            </ol>
          </section>
          <section className="rounded-2xl border border-[#1b4d38]/20 bg-[#1b4d38]/8 p-5">
            <p className="text-sm font-semibold text-[#1b4d38]">Secure custody, one electronic record</p>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              The warehouse you select is the only place the sample is received. The live register — not a paper waybill — is
              authoritative.
            </p>
          </section>
        </div>

        {entries.length > 0 && (
          <section className="portal-card overflow-hidden">
            <div className="border-b border-[var(--line)] px-5 py-3">
              <h2 className="font-display text-lg">Purchases that will lock to this lot</h2>
              <p className="text-xs text-[var(--ink-muted)]">NM-EX purchase ID is assigned by the system. Your reference is the number from your own books.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  <tr>
                    <th className="px-5 pb-2 pt-3 font-semibold">Purchase ID</th>
                    <th className="pb-2 pt-3 font-semibold">Your reference</th>
                    <th className="pb-2 pt-3 font-semibold">Source</th>
                    <th className="pb-2 pt-3 text-right font-semibold">Weight</th>
                    <th className="px-5 pb-2 pt-3 text-right font-semibold">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td className="px-5 py-2 tabular-nums font-semibold">{e.id}</td>
                      <td className="py-2 tabular-nums text-[var(--ink-muted)]">{e.reference || "—"}</td>
                      <td className="py-2">{e.source}</td>
                      <td className="py-2 text-right tabular-nums">{formatKg(e.kg)}</td>
                      <td className="px-5 py-2 text-right tabular-nums">{formatPct(e.gradePct, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <a href="/portal/supplier" className="inline-flex h-11 items-center rounded-lg border border-[var(--line)] bg-white px-5 text-sm font-semibold">
            Cancel
          </a>
          <ActionButton disabled={!ready} pendingText="Submitting…">
            {ready ? "Continue — submit lot" : `${formatKg(mml1 - inv.tier1Kg)} more to reach MML`}
          </ActionButton>
        </div>
      </ActionForm>
    </div>
  );
}
