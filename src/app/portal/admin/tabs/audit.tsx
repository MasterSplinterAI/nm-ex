import { Panel } from "@/components/portal/panel";
import { formatDateTime } from "@/lib/format";
import type { DemoState } from "@/lib/dmo/types";

export function AuditTab({ state }: { state: DemoState }) {
  const events = [...state.audit].reverse();
  return (
    <Panel kicker="Immutable record" title={`${events.length} audit events`}>
      <p className="mb-4 text-sm text-[var(--ink-muted)]">
        Every transition — registration, purchase, submission, assay, offer, acceptance, payment, collection, aggregation, smelting,
        certificate issue and status change — is appended here with actor and timestamp. Nothing is edited in place.
      </p>
      <div className="max-h-[70vh] overflow-auto border border-[var(--line)]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[var(--paper)] text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            <tr>
              <th className="px-3 py-2 font-semibold">When (WAT)</th>
              <th className="px-3 py-2 font-semibold">Actor</th>
              <th className="px-3 py-2 font-semibold">Action</th>
              <th className="px-3 py-2 font-semibold">Subject</th>
              <th className="px-3 py-2 font-semibold">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] bg-white/70">
            {events.map((e) => (
              <tr key={e.id} className="align-top">
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-[var(--ink-muted)]">{formatDateTime(e.at)}</td>
                <td className="whitespace-nowrap px-3 py-2">{e.actorLabel}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{e.action}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-xs">{e.subjectId}</td>
                <td className="px-3 py-2 text-[var(--ink)]">{e.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
