import { KpiTile, StatusTile } from "@/components/portal/kpi-tile";
import { Pipeline } from "@/components/portal/pipeline";
import { CertStatusPill } from "@/components/portal/status-pill";
import { WelcomeBanner } from "@/components/portal/welcome-banner";
import { formatDateTime, formatFxRate, formatMt, formatNgn, formatNgnCompact, formatUsd } from "@/lib/format";
import { CERT_CLASS_LABEL } from "@/lib/dmo/labels";
import { inspectionQueue, openOffers, pendingAcceptances, pendingRegistrations, poolFor } from "@/lib/dmo/queries";
import { containedTinMt, nationalPipeline } from "@/lib/dmo/reports";
import type { DemoState, Participant } from "@/lib/dmo/types";
import type { SpotBoard } from "@/lib/types";

export function AdminHome({
  state,
  board,
  nowIso,
  me,
}: {
  state: DemoState;
  board: SpotBoard;
  nowIso: string;
  me: Participant;
}) {
  const tin = board.minerals.find((m) => m.slug === "tin");
  const pending = pendingRegistrations(state).length;
  const inspections = inspectionQueue(state).length;
  const offers = openOffers(state).length;
  const smelterOffers = poolFor(state, "smelters").length;
  const buyerOffers = poolFor(state, "buyers").length;
  const settle = pendingAcceptances(state).length;
  const queue = pending + inspections + settle;
  const royaltyDue = state.certificates
    .filter((c) => c.status === "VALID" && c.cls !== "DMO-A")
    .reduce((a, c) => a + c.valuation.royaltyAtTransferNgn, 0);
  const royaltyHeld = state.certificates
    .filter((c) => c.cls === "DMO-A" && c.status !== "CANCELLED")
    .reduce((a, c) => a + c.valuation.royaltyNgn, 0);
  const mass = containedTinMt(state);
  const certs = [...state.certificates].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

  return (
    <div className="space-y-5">
      <WelcomeBanner name={me.legalName} nowIso={nowIso} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile href="/portal/admin?tab=registrations" icon="queue" label="Registrations" value={pending} hint="Applications waiting for a decision." />
        <KpiTile href="/portal/admin?tab=inspections" icon="beaker" label="Inspections" value={inspections} hint="Lots at warehouse awaiting sample or assay." />
        <KpiTile
          href="/portal/admin?tab=offers"
          icon="pool"
          label="National Pool"
          value={offers}
          hint={`${smelterOffers} to smelters · ${buyerOffers} refined to buyers`}
        />
        <StatusTile
          href={pending ? "/portal/admin?tab=registrations" : inspections ? "/portal/admin?tab=inspections" : "/portal/admin?tab=settlements"}
          label="Officer queue"
          ok={queue === 0}
          okText="No files waiting — registry is current"
          waitText={`${queue} item${queue === 1 ? "" : "s"} need an officer decision`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile href="/portal/admin?tab=reports" icon="weight" label="Tin in the system" value={formatMt(mass.inSystem * 1000)} hint={`${formatMt(mass.exported * 1000)} exported · ${formatMt(mass.domestic * 1000)} domestic.`} />
        <KpiTile href="/portal/admin?tab=reports" icon="money" label="Royalty due at export" value={formatNgnCompact(royaltyDue)} />
        <KpiTile href="/portal/admin?tab=reports" icon="plant" label="Royalty held by smelters" value={formatNgnCompact(royaltyHeld)} />
        <KpiTile href="/portal/admin?tab=certificates" icon="cert" label="Certificates issued" value={state.certificates.length} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <section className="portal-card overflow-hidden">
          <div className="flex items-end justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
            <div>
              <h2 className="font-display text-lg">Certificate register</h2>
              <p className="text-xs text-[var(--ink-muted)]">Latest issues on the live record</p>
            </div>
            <a href="/portal/admin?tab=certificates" className="text-sm font-semibold text-[var(--forest)] hover:underline">
              All certificates
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                <tr>
                  <th className="px-5 pb-2 pt-3 font-semibold">Certificate</th>
                  <th className="pb-2 pt-3 font-semibold">Class</th>
                  <th className="pb-2 pt-3 text-right font-semibold">Royalty at event</th>
                  <th className="px-5 pb-2 pt-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {certs.slice(0, 7).map((c) => (
                  <tr key={c.certNo}>
                    <td className="px-5 py-2.5 tabular-nums">
                      <a href={`/certificates/${c.certNo}`} className="underline-offset-4 hover:underline">
                        {c.certNo}
                      </a>
                    </td>
                    <td className="py-2.5 text-[var(--ink-muted)]">{CERT_CLASS_LABEL[c.cls]}</td>
                    <td className="py-2.5 text-right tabular-nums">{formatNgn(c.valuation.royaltyAtTransferNgn)}</td>
                    <td className="px-5 py-2.5 text-right">
                      <CertStatusPill status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="portal-card flex flex-col p-5">
          <h2 className="font-display text-lg">Live board</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-baseline justify-between">
              <dt className="text-[var(--ink-muted)]">LME tin cash</dt>
              <dd className="font-display text-2xl tabular-nums">
                {formatUsd(tin?.lastUsd ?? null)}
                <span className="ml-1 text-xs text-[var(--ink-muted)]">/MT</span>
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-[var(--ink-muted)]">USD → NGN</dt>
              <dd className="font-display text-xl tabular-nums">{formatFxRate(board.fx.rate)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-[var(--line)] pt-3">
              <dt className="text-[var(--ink-muted)]">Reference / MT Sn</dt>
              <dd className="tabular-nums font-semibold">{formatNgn(tin?.lastUsd != null ? tin.lastUsd * board.fx.rate : null)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-[var(--ink-muted)]">Offers move with the board. Demo clock {formatDateTime(nowIso)} WAT.</p>
          <a
            href="/portal/admin?tab=reports"
            className="mt-auto inline-flex h-11 items-center justify-center rounded-lg bg-[#1b4d38] px-4 text-sm font-semibold text-white hover:bg-[#163d2c]"
          >
            National position report →
          </a>
        </section>
      </div>

      <section className="portal-card p-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-lg">Where the tin is</h2>
          <a href="/portal/admin?tab=reports" className="text-sm font-semibold text-[var(--forest)] hover:underline">
            Full report
          </a>
        </div>
        <Pipeline stages={nationalPipeline(state)} />
      </section>
    </div>
  );
}
