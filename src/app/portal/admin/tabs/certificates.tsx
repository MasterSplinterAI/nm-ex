import { ActionForm } from "@/components/portal/action-button";
import { inputClass } from "@/components/portal/form-styles";
import { Panel } from "@/components/portal/panel";
import { CertStatusPill } from "@/components/portal/status-pill";
import { formatDateTime, formatNgn } from "@/lib/format";
import { participantName } from "@/lib/dmo/queries";
import type { CertificateStatus, DemoState } from "@/lib/dmo/types";
import { certificateStatusAction } from "../actions";

const CONTROLS: { status: CertificateStatus; label: string; tone: string }[] = [
  { status: "UNDER_REVIEW", label: "Under review", tone: "border-[var(--copper)]/50 text-[var(--copper)]" },
  { status: "SUSPENDED", label: "Suspend", tone: "border-[var(--copper)]/50 text-[var(--copper)]" },
  { status: "VALID", label: "Reinstate", tone: "border-[var(--forest)]/50 text-[var(--forest)]" },
  { status: "UTILIZED", label: "Mark utilized", tone: "border-[#1f4b6b]/50 text-[#1f4b6b]" },
  { status: "CANCELLED", label: "Cancel", tone: "border-[#9b2c2c]/40 text-[#9b2c2c]" },
];

export function CertificatesTab({ state }: { state: DemoState }) {
  const certs = [...state.certificates].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  return (
    <Panel kicker="Register" title={`${certs.length} DMO certificates issued`}>
      <div className="space-y-3">
        {certs.map((c) => {
          const terminal = c.status === "UTILIZED" || c.status === "CANCELLED" || c.status === "SUPERSEDED";
          return (
            <article key={c.certNo} className="grid gap-3 border border-[var(--line)] bg-white/70 p-4 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <a href={`/certificates/${c.certNo}`} className="font-display text-lg tabular-nums underline-offset-4 hover:underline">{c.certNo}</a>
                  <CertStatusPill status={c.status} />
                </div>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  {c.lotId} · {participantName(state, c.supplierId)}
                  {c.counterpartyId && <> → {participantName(state, c.counterpartyId)}</>} · issued {formatDateTime(c.issuedAt)} · LME US${c.priceRef.lmeUsd.toLocaleString("en-US")} / ₦{c.priceRef.fxRate.toLocaleString("en-NG")}
                </p>
                <p className="mt-1 text-sm">
                  Reference {formatNgn(c.valuation.referenceValueNgn)} · royalty {formatNgn(c.valuation.royaltyNgn)}{" "}
                  <span className="text-[var(--ink-muted)]">({c.valuation.royaltyAtTransferNgn === 0 ? "transferred, ₦0 at this event" : "due before export"})</span>
                </p>
              </div>
              {!terminal && (
                <ActionForm action={certificateStatusAction} hidden={{ certNo: c.certNo }} inline={false} className="lg:w-72">
                  <input name="note" placeholder="Reason / reference (optional)" className={`${inputClass} h-9 text-xs`} />
                  <div className="flex flex-wrap gap-1.5">
                    {CONTROLS.filter((ctl) => ctl.status !== c.status && !(ctl.status === "UTILIZED" && c.cls === "DMO-A")).map((ctl) => (
                      <button key={ctl.status} name="status" value={ctl.status} className={`h-8 border bg-white px-2.5 text-xs font-semibold ${ctl.tone}`}>
                        {ctl.label}
                      </button>
                    ))}
                  </div>
                </ActionForm>
              )}
            </article>
          );
        })}
      </div>
    </Panel>
  );
}
