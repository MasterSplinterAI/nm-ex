import { Card, Note } from "@/components/portal/card";
import { formatDate, formatKg, formatNgn, formatNgnCompact } from "@/lib/format";
import { CERT_CLASS_LABEL } from "@/lib/dmo/labels";
import { royaltyPositions } from "@/lib/dmo/queries";
import type { DemoState, DmoPolicy, Participant } from "@/lib/dmo/types";

/**
 * What the smelter carries. Every DMO-A moves a royalty liability onto this
 * plant at ₦0; this is the running total and where each piece of it came from.
 */
export function SmelterRoyalty({
  state,
  me,
  policy,
}: {
  state: DemoState;
  me: Participant;
  policy: DmoPolicy;
}) {
  const rows = royaltyPositions(state).filter((r) => r.holderId === me.id);
  const outstanding = rows.filter((r) => !r.settled).reduce((n, r) => n + r.assessedNgn, 0);
  const settled = rows.filter((r) => r.settled).reduce((n, r) => n + r.assessedNgn, 0);

  // What the liability is secured against: the tin that came in with it.
  const containedKg = rows.reduce((n, r) => {
    const lot = state.lots.find((l) => l.id === r.lotId);
    if (!lot) return n;
    const kg = lot.verifiedKg ?? lot.declaredKg;
    const grade = lot.verifiedGradePct ?? lot.declaredGradePct;
    return n + kg * (grade / 100);
  }, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Figure label="Royalty you carry" value={formatNgnCompact(outstanding)} tone="warn" hint={`${rows.filter((r) => !r.settled).length} certificates`} />
        <Figure label="Already remitted" value={formatNgnCompact(settled)} tone="ok" />
        <Figure label="Contained tin behind it" value={formatKg(containedKg)} />
        <Figure label="Royalty rate" value={`${policy.royaltyPct}%`} hint="Of the full metal reference value" />
      </div>

      <Note tone="warn" title="Why you carry this.">
        On every acceptance the royalty transfers to you at ₦0 — you paid nothing that day, but the liability moved from the
        supplier onto this plant. NM-EX reconciles it against your refined output when that output is sold domestically or
        cleared for export. An officer marks it received; until then it stays on this page.
      </Note>

      <Card
        icon="royalty"
        title="Liabilities transferred onto this plant"
        action={<span className="text-xs text-[var(--ink-muted)]">{rows.length} in total</span>}
      >
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-[var(--ink-muted)]">
            No royalty has transferred to you yet. It moves across on the first DMO-A you accept.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-[13px]">
              <thead className="table-head">
                <tr>
                  <th className="py-2">Certificate</th>
                  <th className="py-2">Basis</th>
                  <th className="py-2">Lot</th>
                  <th className="py-2">Came from</th>
                  <th className="py-2">Accepted</th>
                  <th className="py-2 text-right">Royalty carried</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]">
                {rows.map((r) => (
                  <tr key={r.certNo} className="hover:bg-[#1b4d38]/[0.04]">
                    <td className="py-2 tabular-nums">
                      <a href={`/certificates/${r.certNo}`} className="font-semibold text-[#1f4b6b] hover:underline">
                        {r.certNo}
                      </a>
                    </td>
                    <td className="py-2 text-[var(--ink-muted)]">{CERT_CLASS_LABEL[r.cls]}</td>
                    <td className="py-2 tabular-nums">
                      <a
                        href={`/portal/smelter?tab=pool&lot=${encodeURIComponent(r.lotId)}`}
                        className="text-[#1f4b6b] hover:underline"
                      >
                        {r.lotId}
                      </a>
                    </td>
                    <td className="py-2">{r.supplier}</td>
                    <td className="py-2 tabular-nums text-[var(--ink-muted)]">{formatDate(r.issuedAt)}</td>
                    <td className="py-2 text-right tabular-nums font-semibold">{formatNgn(r.assessedNgn)}</td>
                    <td className="py-2">
                      {r.settled ? (
                        <span className="text-xs font-semibold text-[#1b4d38]">
                          Remitted {formatDate(r.settledAt!)}
                          {r.settlementRef && <span className="block text-[var(--ink-soft)]">{r.settlementRef}</span>}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-[var(--copper)]">Outstanding</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--line-strong)] bg-[#f4f7f5] font-bold">
                  <td className="py-2.5" colSpan={5}>
                    Outstanding total
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{formatNgn(outstanding)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Figure({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "ok" | "warn" }) {
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
