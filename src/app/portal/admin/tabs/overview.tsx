import { Panel } from "@/components/portal/panel";
import { CertStatusPill } from "@/components/portal/status-pill";
import { formatDateTime, formatFxRate, formatNgn, formatUsd } from "@/lib/format";
import { CERT_CLASS_LABEL } from "@/lib/dmo/labels";
import { auditTail, inspectionQueue, openOffers, pendingAcceptances, pendingRegistrations } from "@/lib/dmo/queries";
import type { DemoState } from "@/lib/dmo/types";
import type { SpotBoard } from "@/lib/types";

function Stat({ label, value, href, tone = "ink" }: { label: string; value: string | number; href: string; tone?: "ink" | "copper" }) {
  return (
    <a href={href} className="block border border-[var(--line)] bg-white/70 px-4 py-4 transition hover:border-[var(--forest)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">{label}</p>
      <p className={`font-display mt-1 text-3xl tabular-nums ${tone === "copper" ? "text-[var(--copper)]" : "text-[var(--ink)]"}`}>{value}</p>
    </a>
  );
}

export function OverviewTab({ state, board, nowIso }: { state: DemoState; board: SpotBoard; nowIso: string }) {
  const tin = board.minerals.find((m) => m.slug === "tin");
  const certs = [...state.certificates].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const royaltyOutstanding = state.certificates
    .filter((c) => c.status === "VALID" && c.cls !== "DMO-A")
    .reduce((a, c) => a + c.valuation.royaltyNgn, 0);
  const royaltyTransferred = state.certificates
    .filter((c) => c.cls === "DMO-A" && c.status !== "CANCELLED")
    .reduce((a, c) => a + c.valuation.royaltyNgn, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Registrations to review" value={pendingRegistrations(state).length} href="/portal/admin?tab=registrations" tone="copper" />
        <Stat label="Lots in inspection" value={inspectionQueue(state).length} href="/portal/admin?tab=inspections" tone="copper" />
        <Stat label="Open domestic offers" value={openOffers(state).length} href="/portal/admin?tab=offers" />
        <Stat label="Acceptances awaiting settlement" value={pendingAcceptances(state).length} href="/portal/admin?tab=settlements" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel kicker="Reference prices" title="Live board" className="lg:col-span-1">
          <dl className="space-y-3 text-sm">
            <div className="flex items-baseline justify-between">
              <dt className="text-[var(--ink-muted)]">LME tin cash</dt>
              <dd className="font-display text-2xl tabular-nums">{formatUsd(tin?.lastUsd ?? null)}<span className="ml-1 text-xs text-[var(--ink-muted)]">/MT</span></dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-[var(--ink-muted)]">USD → NGN</dt>
              <dd className="font-display text-2xl tabular-nums">{formatFxRate(board.fx.rate)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-[var(--line)] pt-3">
              <dt className="text-[var(--ink-muted)]">Reference value / MT Sn</dt>
              <dd className="tabular-nums font-semibold">{formatNgn(tin?.lastUsd != null ? tin.lastUsd * board.fx.rate : null)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-[var(--ink-muted)]">
            Every acceptance and clearance certificate snapshots these two numbers at the moment it is issued. Open offers show
            indicative values that move with the board; nothing is fixed until the fiscal event.
          </p>
          <p className="mt-2 text-xs text-[var(--ink-muted)]">Demo clock: {formatDateTime(nowIso)} WAT</p>
        </Panel>

        <Panel kicker="Royalty position" title="Fiscal ledger" className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-[var(--line)] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Assessed on valid export clearances</p>
              <p className="font-display mt-1 text-2xl tabular-nums text-[#9b2c2c]">{formatNgn(royaltyOutstanding)}</p>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">Due from exporters before NESS / Customs clear the shipment.</p>
            </div>
            <div className="border border-[var(--line)] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Transferred to smelters on acceptance</p>
              <p className="font-display mt-1 text-2xl tabular-nums text-[var(--forest)]">{formatNgn(royaltyTransferred)}</p>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">₦0 collected at transfer; reconciled against refined output at export or domestic sale.</p>
            </div>
          </div>
          <table className="mt-5 w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              <tr>
                <th className="pb-2 font-semibold">Certificate</th>
                <th className="pb-2 font-semibold">Class</th>
                <th className="pb-2 font-semibold">Issued</th>
                <th className="pb-2 text-right font-semibold">Royalty</th>
                <th className="pb-2 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {certs.slice(0, 6).map((c) => (
                <tr key={c.certNo}>
                  <td className="py-2 tabular-nums"><a href={`/certificates/${c.certNo}`} className="underline-offset-4 hover:underline">{c.certNo}</a></td>
                  <td className="py-2 text-[var(--ink-muted)]">{CERT_CLASS_LABEL[c.cls]}</td>
                  <td className="py-2 tabular-nums text-[var(--ink-muted)]">{formatDateTime(c.issuedAt)}</td>
                  <td className="py-2 text-right tabular-nums">{formatNgn(c.valuation.royaltyAtTransferNgn)}</td>
                  <td className="py-2 text-right"><CertStatusPill status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel kicker="Latest activity" title="Audit trail" actions={<a href="/portal/admin?tab=audit" className="text-sm underline underline-offset-4">Full trail</a>}>
        <ol className="divide-y divide-[var(--line)] text-sm">
          {auditTail(state, 8).map((e) => (
            <li key={e.id} className="grid gap-1 py-2 sm:grid-cols-[10rem_12rem_1fr]">
              <span className="tabular-nums text-[var(--ink-muted)]">{formatDateTime(e.at)}</span>
              <span className="font-medium">{e.actorLabel}</span>
              <span>{e.detail}</span>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
