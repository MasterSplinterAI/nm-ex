import { ActionButton, ActionForm, inputClass } from "@/components/portal/action-button";
import { Empty } from "@/components/portal/empty";
import { FieldList } from "@/components/portal/field-list";
import { Panel } from "@/components/portal/panel";
import { ParticipantStatusPill } from "@/components/portal/status-pill";
import { formatDateTime } from "@/lib/format";
import { CATEGORY_LABEL, ROLE_LABEL } from "@/lib/dmo/labels";
import { pendingRegistrations } from "@/lib/dmo/queries";
import type { DemoState, Participant } from "@/lib/dmo/types";
import { reviewRegistrationAction } from "../actions";

function Application({ p, required }: { p: Participant; required: string[] }) {
  return (
    <article className="border border-[var(--line)] bg-white/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            {p.category ? CATEGORY_LABEL[p.category] : ROLE_LABEL[p.role]}
          </p>
          <h3 className="font-display mt-1 text-xl text-[var(--ink)]">{p.legalName}</h3>
          <p className="text-xs text-[var(--ink-muted)]">Applied {formatDateTime(p.createdAt)} · ref {p.id}</p>
        </div>
        <ParticipantStatusPill status={p.status} />
      </div>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <FieldList
          dense
          rows={[
            { label: "Address", value: p.address },
            { label: "Contact", value: `${p.contactName} · ${p.phone}` },
            { label: "E-mail", value: p.email },
            { label: "Officer note", value: p.reviewNote ?? "—" },
          ]}
        />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Compliance checklist</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {required.map((doc, i) => {
              const file = p.documents[i];
              return (
                <li key={doc} className="flex items-start gap-2">
                  <span className={`mt-1 inline-block h-2.5 w-2.5 shrink-0 ${file ? "bg-[var(--forest)]" : "border border-[var(--copper)]"}`} />
                  <span>
                    {doc}
                    {file ? <span className="ml-2 text-xs text-[var(--ink-muted)]">{file.name}</span> : <span className="ml-2 text-xs text-[var(--copper)]">not provided</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <ActionForm action={reviewRegistrationAction} hidden={{ participantId: p.id }} inline={false} className="mt-5 border-t border-[var(--line)] pt-4">
        <input name="note" placeholder="Officer note (optional, shown to the applicant)" className={inputClass} />
        <div className="flex flex-wrap gap-2">
          <button name="decision" value="approved" className="h-10 bg-[var(--forest)] px-4 text-sm font-semibold text-white hover:bg-[var(--ink)]">Approve & issue registration no.</button>
          <button name="decision" value="more_info" className="h-10 border border-[var(--copper)]/50 px-4 text-sm font-semibold text-[var(--copper)]">Request more information</button>
          <button name="decision" value="rejected" className="h-10 border border-[#9b2c2c]/40 px-4 text-sm font-semibold text-[#9b2c2c]">Reject</button>
        </div>
      </ActionForm>
    </article>
  );
}

export function RegistrationsTab({ state }: { state: DemoState }) {
  const pending = pendingRegistrations(state);
  const decided = state.participants
    .filter((p) => p.status === "approved" || p.status === "rejected" || p.status === "suspended")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <Panel kicker="Queue" title={`${pending.length} application${pending.length === 1 ? "" : "s"} awaiting decision`}>
        {pending.length === 0 ? (
          <Empty>No applications waiting. Submit one from the public Register page to see it appear here.</Empty>
        ) : (
          <div className="space-y-4">
            {pending.map((p) => (
              <Application key={p.id} p={p} required={p.category ? state.policy.requiredDocuments[p.category] : []} />
            ))}
          </div>
        )}
      </Panel>

      <Panel kicker="Register" title="Registered participants">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            <tr>
              <th className="pb-2 font-semibold">Registration no.</th>
              <th className="pb-2 font-semibold">Participant</th>
              <th className="pb-2 font-semibold">Type</th>
              <th className="pb-2 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {decided.map((p) => (
              <tr key={p.id}>
                <td className="py-2 tabular-nums">{p.regNo ?? "—"}</td>
                <td className="py-2">{p.legalName}</td>
                <td className="py-2 text-[var(--ink-muted)]">{p.category ? CATEGORY_LABEL[p.category] : ROLE_LABEL[p.role]}</td>
                <td className="py-2 text-right">
                  <div className="inline-flex items-center gap-2">
                    <ParticipantStatusPill status={p.status} />
                    {p.status === "approved" && p.role !== "officer" && (
                      <ActionForm action={reviewRegistrationAction} hidden={{ participantId: p.id, decision: "suspended", note: "Suspended by NM-EX officer" }} confirm={`Suspend ${p.legalName}?`}>
                        <ActionButton tone="ghost" small>Suspend</ActionButton>
                      </ActionForm>
                    )}
                    {p.status === "suspended" && (
                      <ActionForm action={reviewRegistrationAction} hidden={{ participantId: p.id, decision: "approved", note: "Reinstated" }}>
                        <ActionButton tone="ghost" small>Reinstate</ActionButton>
                      </ActionForm>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
