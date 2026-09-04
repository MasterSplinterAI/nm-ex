import { DashCard } from "@/components/portal/dash-card";
import { Panel } from "@/components/portal/panel";
import { Pipeline } from "@/components/portal/pipeline";
import { CertStatusPill } from "@/components/portal/status-pill";
import { formatDateTime, formatFxRate, formatMt, formatNgn, formatUsd } from "@/lib/format";
import { CERT_CLASS_LABEL } from "@/lib/dmo/labels";
import { inspectionQueue, openOffers, pendingAcceptances, pendingRegistrations } from "@/lib/dmo/queries";
import { containedTinMt, nationalPipeline } from "@/lib/dmo/reports";
import type { DemoState } from "@/lib/dmo/types";
import type { SpotBoard } from "@/lib/types";

export function AdminHome({ state, board, nowIso }: { state: DemoState; board: SpotBoard; nowIso: string }) {
  const tin = board.minerals.find((m) => m.slug === "tin");
  const pending = pendingRegistrations(state).length;
  const inspections = inspectionQueue(state).length;
  const offers = openOffers(state).length;
  const settle = pendingAcceptances(state).length;
  const royaltyDue = state.certificates
    .filter((c) => c.status === "VALID" && c.cls !== "DMO-A")
    .reduce((a, c) => a + c.valuation.royaltyAtTransferNgn, 0);
  const royaltyHeld = state.certificates
    .filter((c) => c.cls === "DMO-A" && c.status !== "CANCELLED")
    .reduce((a, c) => a + c.valuation.royaltyNgn, 0);
  const mass = containedTinMt(state);
  const certs = [...state.certificates].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--forest)]">Ministry · NM-EX officer</p>
        <h1 className="font-display mt-1 text-2xl tracking-tight sm:text-3xl">National tin registry</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">
          Every tonne of Nigerian tin on one record — from shed ledger to export. Open a card for the queue; the report expands the
          national position.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashCard href="/portal/admin?tab=registrations" kicker="Queue" title="Registrations" value={pending} hint="Applications waiting for an officer decision." tone={pending ? "warn" : "ink"} />
        <DashCard href="/portal/admin?tab=inspections" kicker="Queue" title="Inspections" value={inspections} hint="Lots at the approved warehouse awaiting sample or assay." tone={inspections ? "warn" : "ink"} />
        <DashCard href="/portal/admin?tab=offers" kicker="Market" title="National Pool" value={offers} hint="Verified lots on the domestic offer clock." />
        <DashCard href="/portal/admin?tab=settlements" kicker="Queue" title="Settlements" value={settle} hint="Accepted lots waiting for payment or collection." />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashCard href="/portal/admin?tab=reports" kicker="Position" title="Tin in the system" value={formatMt(mass.inSystem * 1000)} hint={`${formatMt(mass.exported * 1000)} already exported · ${formatMt(mass.domestic * 1000)} sold domestically.`} />
        <DashCard href="/portal/admin?tab=reports" kicker="Fiscal" title="Royalty due at export" value={formatNgn(royaltyDue)} hint="On valid unused clearance certificates." tone="warn" />
        <DashCard href="/portal/admin?tab=reports" kicker="Fiscal" title="Royalty held by smelters" value={formatNgn(royaltyHeld)} hint="Transferred at ₦0 on DMO-A; reconciled on refined output." tone="ok" />
        <DashCard href="/portal/admin?tab=certificates" kicker="Register" title="Certificates issued" value={state.certificates.length} hint="DMO-A, DMO-EC and DMO-ER on the live register." />
      </div>

      <Panel kicker="National position" title="Where the tin is" actions={<a href="/portal/admin?tab=reports" className="text-sm underline underline-offset-4">Full report</a>}>
        <Pipeline stages={nationalPipeline(state)} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel kicker="Reference prices" title="Live board" className="lg:col-span-1">
          <dl className="space-y-3 text-sm">
            <div className="flex items-baseline justify-between">
              <dt className="text-[var(--ink-muted)]">LME tin cash</dt>
              <dd className="font-display text-2xl tabular-nums">
                {formatUsd(tin?.lastUsd ?? null)}
                <span className="ml-1 text-xs text-[var(--ink-muted)]">/MT</span>
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-[var(--ink-muted)]">USD → NGN</dt>
              <dd className="font-display text-2xl tabular-nums">{formatFxRate(board.fx.rate)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-[var(--line)] pt-3">
              <dt className="text-[var(--ink-muted)]">Reference / MT Sn</dt>
              <dd className="tabular-nums font-semibold">{formatNgn(tin?.lastUsd != null ? tin.lastUsd * board.fx.rate : null)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-[var(--ink-muted)]">
            Offers move with the board. Certificates snapshot these two numbers at issue. Demo clock {formatDateTime(nowIso)} WAT.
          </p>
        </Panel>
        <Panel kicker="Latest issues" title="Certificate register" className="lg:col-span-2" actions={<a href="/portal/admin?tab=certificates" className="text-sm underline underline-offset-4">All certificates</a>}>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              <tr>
                <th className="pb-2 font-semibold">Certificate</th>
                <th className="pb-2 font-semibold">Class</th>
                <th className="pb-2 text-right font-semibold">Royalty at event</th>
                <th className="pb-2 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {certs.slice(0, 6).map((c) => (
                <tr key={c.certNo}>
                  <td className="py-2 tabular-nums">
                    <a href={`/certificates/${c.certNo}`} className="underline-offset-4 hover:underline">
                      {c.certNo}
                    </a>
                  </td>
                  <td className="py-2 text-[var(--ink-muted)]">{CERT_CLASS_LABEL[c.cls]}</td>
                  <td className="py-2 text-right tabular-nums">{formatNgn(c.valuation.royaltyAtTransferNgn)}</td>
                  <td className="py-2 text-right">
                    <CertStatusPill status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <DashCard href="/portal/admin?tab=audit" kicker="Control" title="Audit trail" hint="Every transition, who did it, and when. Nothing is edited in place." />
        <DashCard href="/portal/admin?tab=policy" kicker="Control" title="Policy levers" hint="MML, coefficients, royalty, offer window — apply to new lots only." />
        <DashCard href="/portal/admin?tab=demo" kicker="Presentation" title="Demo controls" hint="Advance the clock to expire an offer, or reset the seeded scenario." />
      </div>
    </div>
  );
}
