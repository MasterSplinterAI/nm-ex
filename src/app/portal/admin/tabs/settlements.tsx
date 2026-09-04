import { ActionButton, ActionForm } from "@/components/portal/action-button";
import { Countdown } from "@/components/portal/countdown";
import { Empty } from "@/components/portal/empty";
import { Money } from "@/components/portal/money";
import { Panel } from "@/components/portal/panel";
import { StatusPill } from "@/components/portal/status-pill";
import { formatDateTime, formatKg, formatPct } from "@/lib/format";
import { pendingAcceptances } from "@/lib/dmo/queries";
import type { DemoState } from "@/lib/dmo/types";
import { defaultAcceptanceAction, officerCollectionAction, officerPaymentAction } from "../actions";

export function SettlementsTab({ state, nowIso }: { state: DemoState; nowIso: string }) {
  const rows = pendingAcceptances(state);
  return (
    <Panel kicker="Acceptance → payment → collection" title="Settlements in progress">
      <p className="mb-4 text-sm text-[var(--ink-muted)]">
        A smelter that accepts must pay within five business days and collect from the approved warehouse. An officer can record
        either step on the smelter&apos;s behalf, or default the acceptance to cancel the DMO-A and return the lot to the pool.
      </p>
      {rows.length === 0 ? (
        <Empty>Nothing awaiting settlement.</Empty>
      ) : (
        <div className="space-y-4">
          {rows.map(({ acceptance, lot, acceptor }) => (
            <article key={acceptance.id} className="grid gap-4 border border-[var(--line)] bg-white/70 p-5 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">{acceptor.legalName} · {acceptor.regNo}</p>
                <h3 className="font-display mt-1 text-xl tabular-nums">
                  <a href={`/certificates/${acceptance.certNo}`} className="underline-offset-4 hover:underline">{acceptance.certNo}</a>
                </h3>
                <p className="text-sm text-[var(--ink-muted)]">
                  {lot.id} · {formatKg(lot.verifiedKg)} @ {formatPct(lot.verifiedGradePct!, 2)} Sn · accepted {formatDateTime(acceptance.acceptedAt)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                  <Money ngn={acceptance.valuation.totalPayableNgn} size="sm" />
                  <StatusPill tone={acceptance.paymentStatus === "paid" ? "ok" : "warn"}>{acceptance.paymentStatus === "paid" ? "Paid" : "Payment pending"}</StatusPill>
                  <StatusPill tone={acceptance.collectionStatus === "collected" ? "ok" : "muted"}>{acceptance.collectionStatus === "collected" ? "Collected" : "Collection pending"}</StatusPill>
                  {acceptance.paymentStatus === "pending" && <Countdown untilIso={acceptance.deadlineAt} nowIso={nowIso} label="Payment due in" />}
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 lg:items-end">
                {acceptance.paymentStatus === "pending" && (
                  <>
                    <ActionForm action={officerPaymentAction} hidden={{ acceptanceId: acceptance.id }}>
                      <ActionButton small tone="secondary">Record payment received</ActionButton>
                    </ActionForm>
                    <ActionForm action={defaultAcceptanceAction} hidden={{ acceptanceId: acceptance.id }} confirm="Default this acceptance? The DMO-A will be cancelled and the lot re-offered.">
                      <ActionButton small tone="danger">Default & re-offer</ActionButton>
                    </ActionForm>
                  </>
                )}
                {acceptance.paymentStatus === "paid" && acceptance.collectionStatus === "pending" && (
                  <ActionForm action={officerCollectionAction} hidden={{ acceptanceId: acceptance.id }}>
                    <ActionButton small tone="secondary">Record collection</ActionButton>
                  </ActionForm>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}
