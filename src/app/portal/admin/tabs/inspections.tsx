import { ActionButton, ActionForm, inputClass, labelClass } from "@/components/portal/action-button";
import { Countdown } from "@/components/portal/countdown";
import { Empty } from "@/components/portal/empty";
import { Panel } from "@/components/portal/panel";
import { StatusPill } from "@/components/portal/status-pill";
import { formatDateTime, formatKg, formatNgn, formatPct } from "@/lib/format";
import { INSPECTION_STATUS_LABEL } from "@/lib/dmo/labels";
import { inspectionQueue } from "@/lib/dmo/queries";
import { referenceValueNgn } from "@/lib/dmo/valuation";
import type { DemoState } from "@/lib/dmo/types";
import type { SpotBoard } from "@/lib/types";
import { sampleReceivedAction, verifyLotAction } from "../actions";

export function InspectionsTab({ state, board, nowIso }: { state: DemoState; board: SpotBoard; nowIso: string }) {
  const queue = inspectionQueue(state);
  const lme = board.minerals.find((m) => m.slug === "tin")?.lastUsd ?? 0;

  return (
    <Panel kicker="Approved warehouse & assay centre" title="Inspection queue">
      <p className="mb-4 text-sm text-[var(--ink-muted)]">
        Suppliers have 48 hours from submission to deliver a sample. Once the assay is entered the grade is locked to the lot,
        the LME and FX rates are snapshotted, and a five-day domestic offer opens automatically.
      </p>
      {queue.length === 0 ? (
        <Empty>No lots awaiting inspection.</Empty>
      ) : (
        <div className="space-y-4">
          {queue.map(({ inspection, lot, supplier }) => (
            <article key={inspection.id} className="border border-[var(--line)] bg-white/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">{supplier.legalName} · {supplier.regNo}</p>
                  <h3 className="font-display mt-1 text-xl tabular-nums">{lot.id}</h3>
                  <p className="text-sm text-[var(--ink-muted)]">
                    {formatKg(inspection.submittedKg)} declared {formatPct(lot.declaredGradePct, 2)} Sn · {lot.purchaseIds.length} ledger entries · {inspection.warehouse}
                  </p>
                </div>
                <div className="text-right">
                  <StatusPill tone={inspection.status === "awaiting_sample" ? "warn" : "info"}>{INSPECTION_STATUS_LABEL[inspection.status]}</StatusPill>
                  <p className="mt-2 text-xs">
                    <Countdown untilIso={inspection.windowEndsAt} nowIso={nowIso} label="Sample window" />
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">Submitted {formatDateTime(inspection.createdAt)}</p>
                </div>
              </div>

              {inspection.status === "awaiting_sample" ? (
                <ActionForm action={sampleReceivedAction} hidden={{ inspectionId: inspection.id }} className="mt-4">
                  <ActionButton pendingText="Recording…">Mark sample received</ActionButton>
                </ActionForm>
              ) : (
                <ActionForm action={verifyLotAction} hidden={{ inspectionId: inspection.id }} inline={false} className="mt-4 border-t border-[var(--line)] pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--forest)]">Enter assay result</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block">
                      <span className={labelClass}>Verified weight (kg)</span>
                      <input name="verifiedKg" type="number" step="0.1" defaultValue={inspection.submittedKg} className={`${inputClass} mt-1`} required />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Verified grade (% Sn)</span>
                      <input name="verifiedGradePct" type="number" step="0.01" defaultValue={lot.declaredGradePct} className={`${inputClass} mt-1`} required />
                    </label>
                    <div className="flex items-end">
                      <ActionButton pendingText="Locking assay…" className="w-full">Verify & open domestic offer</ActionButton>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Indicative reference at today&apos;s board: {formatNgn(referenceValueNgn(inspection.submittedKg / 1000, lot.declaredGradePct, lme, board.fx.rate))} for the declared
                    grade. The assay entered here is final for this lot.
                  </p>
                </ActionForm>
              )}
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}
