import { ActionButton, ActionForm } from "@/components/portal/action-button";
import { inputClass } from "@/components/portal/form-styles";
import { Card, Note } from "@/components/portal/card";
import { formatDate, formatNgn, formatNgnCompact } from "@/lib/format";
import { CERT_CLASS_LABEL } from "@/lib/dmo/labels";
import { royaltyPositions, royaltyTotals } from "@/lib/dmo/queries";
import type { DemoState } from "@/lib/dmo/types";
import { settleRoyaltyAction } from "../actions";

/**
 * Where every royalty liability sits and whether NM-EX has been paid. Grouped by
 * the party that carries it, because that is who an officer chases.
 */
export function RoyaltyTab({ state }: { state: DemoState }) {
  const rows = royaltyPositions(state);
  const t = royaltyTotals(rows);

  const byHolder = new Map<string, typeof rows>();
  for (const r of rows) {
    byHolder.set(r.holderId, [...(byHolder.get(r.holderId) ?? []), r]);
  }
  const holders = [...byHolder.entries()]
    .map(([holderId, list]) => ({
      holderId,
      holder: list[0].holder,
      list,
      outstanding: list.filter((r) => !r.settled).reduce((n, r) => n + r.assessedNgn, 0),
      settled: list.filter((r) => r.settled).reduce((n, r) => n + r.assessedNgn, 0),
    }))
    .sort((a, b) => b.outstanding - a.outstanding);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Figure label="Royalty assessed" value={formatNgnCompact(t.assessed)} hint={`${rows.length} certificates`} />
        <Figure label="Received by NM-EX" value={formatNgnCompact(t.settled)} tone="ok" />
        <Figure label="Still outstanding" value={formatNgnCompact(t.outstanding)} tone={t.outstanding > 0 ? "warn" : "ok"} />
        <Figure
          label="Held by smelters"
          value={formatNgnCompact(t.heldBySmelters)}
          hint="Transferred at ₦0 on a DMO-A"
        />
      </div>

      <Note tone="info" title="How to read this.">
        A DMO-A moves the royalty onto the buying smelter at ₦0 — nothing falls due that day, but the liability now sits with
        the smelter until it is reconciled. An export clearance assesses royalty on the full metal value and it falls due
        before the clearance may be used. Recording receipt below is what marks a liability paid.
      </Note>

      {holders.map((h) => (
        <Card
          key={h.holderId}
          icon="money"
          title={h.holder}
          action={
            <span className="text-xs text-[var(--ink-muted)]">
              {formatNgn(h.outstanding)} outstanding · {formatNgn(h.settled)} received
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="data-table w-full text-[13px]">
              <thead className="table-head">
                <tr>
                  <th className="py-2">Certificate</th>
                  <th className="py-2">Basis</th>
                  <th className="py-2">Lot</th>
                  <th className="py-2">From</th>
                  <th className="py-2 text-right">Assessed</th>
                  <th className="py-2 text-right">Due at issue</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Record receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]">
                {h.list.map((r) => (
                  <tr key={r.certNo} className="hover:bg-[#1b4d38]/[0.04]">
                    <td className="py-2 tabular-nums">
                      <a href={`/certificates/${r.certNo}`} className="font-semibold text-[#1f4b6b] hover:underline">
                        {r.certNo}
                      </a>
                    </td>
                    <td className="py-2 text-[var(--ink-muted)]">{CERT_CLASS_LABEL[r.cls]}</td>
                    <td className="py-2 tabular-nums">
                      <a href={`/portal/admin?lot=${encodeURIComponent(r.lotId)}`} className="text-[#1f4b6b] hover:underline">
                        {r.lotId}
                      </a>
                    </td>
                    <td className="py-2">
                      <a
                        href={`/portal/admin?tab=registrations&entity=${encodeURIComponent(r.supplierId)}`}
                        className="text-[#1f4b6b] hover:underline"
                      >
                        {r.supplier}
                      </a>
                    </td>
                    <td className="py-2 text-right tabular-nums font-semibold">{formatNgn(r.assessedNgn)}</td>
                    <td className="py-2 text-right tabular-nums text-[var(--ink-muted)]">
                      {r.transferred ? "₦0 — transferred" : formatNgn(r.dueNowNgn)}
                    </td>
                    <td className="py-2">
                      {r.settled ? (
                        <span className="text-xs font-semibold text-[#1b4d38]">
                          Received {formatDate(r.settledAt!)}
                          {r.settlementRef && <span className="block text-[var(--ink-soft)]">{r.settlementRef}</span>}
                        </span>
                      ) : r.transferred ? (
                        <span className="text-xs font-semibold text-[#1f4b6b]">Held by smelter</span>
                      ) : (
                        <span className="text-xs font-semibold text-[var(--copper)]">Due at export</span>
                      )}
                    </td>
                    <td className="py-2">
                      {r.settled ? (
                        <span className="text-xs text-[var(--ink-soft)]">Settled</span>
                      ) : (
                        <ActionForm
                          action={settleRoyaltyAction}
                          hidden={{ certNo: r.certNo }}
                          confirm={`Record receipt of ${formatNgn(r.assessedNgn)} royalty against ${r.certNo}?`}
                        >
                          <div className="flex items-center gap-1.5">
                            <input name="reference" placeholder="Payment ref" className={`${inputClass} h-8 w-28 text-xs`} />
                            <ActionButton small pendingText="Recording…">
                              Mark received
                            </ActionButton>
                          </div>
                        </ActionForm>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {rows.length === 0 && (
        <Card icon="money" title="Royalty ledger">
          <p className="p-4 text-sm text-[var(--ink-muted)]">No royalty has been assessed yet.</p>
        </Card>
      )}
    </div>
  );
}

function Figure({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="portal-card p-4">
      <p className="eyebrow">{label}</p>
      <p
        className={`font-display mt-1 text-2xl tabular-nums ${
          tone === "ok" ? "text-[#1b4d38]" : tone === "warn" ? "text-[var(--copper)]" : ""
        }`}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-[var(--ink-soft)]">{hint}</p>}
    </div>
  );
}
