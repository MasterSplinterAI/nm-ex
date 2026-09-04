import { redirect } from "next/navigation";
import { ActionForm, inputClass } from "@/components/portal/action-button";
import { CertificateSheet } from "@/components/certificate/certificate-sheet";
import { PrintButton } from "@/components/certificate/print-button";
import { Panel } from "@/components/portal/panel";
import { CertStatusPill } from "@/components/portal/status-pill";
import { formatDate } from "@/lib/format";
import { certificateFullView } from "@/lib/dmo/queries";
import { qrSvg, verifyUrl } from "@/lib/dmo/qr";
import { getSession } from "@/lib/dmo/session";
import { readState } from "@/lib/dmo/store";
import { PageHeader } from "../page-header";
import { certificateStatusAction } from "../admin/actions";

export const dynamic = "force-dynamic";

export default async function VerifierPage({ searchParams }: { searchParams: Promise<{ no?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "verifier") redirect("/portal");
  const { no } = await searchParams;
  const query = (no ?? "").trim();
  const state = await readState();
  const view = query ? certificateFullView(state, query) : null;
  const svg = view ? await qrSvg(verifyUrl(view.certNo)) : null;
  const clearances = state.certificates.filter((c) => c.cls !== "DMO-A").sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

  return (
    <>
      <PageHeader
        kicker="Appointed verifier · NESS / Customs / PIA"
        title="Export clearance verification"
        lede="Look up a certificate presented by an exporter, confirm it against the NM-EX record, and mark it utilized once the shipment clears so it cannot be re-used."
      />
      <form method="get" action="/portal/verify" className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input name="no" defaultValue={query} placeholder="Scan QR or enter certificate number" className={`${inputClass} h-12 flex-1 font-mono uppercase`} autoFocus />
        <button type="submit" className="h-12 bg-[var(--ink)] px-6 text-sm font-semibold text-[var(--paper)] hover:bg-[var(--forest)]">Look up</button>
      </form>

      {query && !view && (
        <div className="mb-6 border border-[#9b2c2c]/40 bg-[#9b2c2c]/5 p-5">
          <p className="font-display text-xl text-[var(--ink)]">No certificate {query.toUpperCase()} on the register.</p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">Treat the presented document as invalid and refer to NM-EX Compliance.</p>
        </div>
      )}

      {view && svg && (
        <div className="space-y-6">
          <Panel kicker="Verifier action" title={<span className="tabular-nums">{view.certNo}</span>} actions={<PrintButton />}>
            <div className="flex flex-wrap items-center gap-4">
              <CertStatusPill status={view.status} big />
              {view.cls !== "DMO-A" && view.status === "VALID" && (
                <ActionForm action={certificateStatusAction} hidden={{ certNo: view.certNo, status: "UTILIZED" }} inline={false} className="flex-1 sm:flex-row sm:items-center" confirm="Mark this certificate utilized? It can never support another export.">
                  <input name="note" placeholder="NXP / shipment reference" className={`${inputClass} sm:max-w-xs`} />
                  <button className="h-11 bg-[#1f4b6b] px-5 text-sm font-semibold text-white hover:bg-[var(--ink)]">Mark utilized — export completed</button>
                </ActionForm>
              )}
              {view.status === "VALID" && (
                <ActionForm action={certificateStatusAction} hidden={{ certNo: view.certNo, status: "UNDER_REVIEW", note: "Flagged by verifier" }}>
                  <button className="h-11 border border-[var(--copper)]/50 px-4 text-sm font-semibold text-[var(--copper)]">Flag for NM-EX review</button>
                </ActionForm>
              )}
              {view.cls === "DMO-A" && <p className="text-sm text-[var(--ink-muted)]">A DMO-A records a domestic sale and cannot support an export.</p>}
            </div>
          </Panel>
          <CertificateSheet view={view} state={state} qrSvg={svg} />
        </div>
      )}

      {!query && (
        <Panel kicker="Register" title="Export clearance certificates">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              <tr>
                <th className="pb-2 font-semibold">Certificate</th>
                <th className="pb-2 font-semibold">Lot</th>
                <th className="pb-2 font-semibold">Issued</th>
                <th className="pb-2 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {clearances.map((c) => (
                <tr key={c.certNo}>
                  <td className="py-2 tabular-nums"><a href={`/portal/verify?no=${encodeURIComponent(c.certNo)}`} className="underline-offset-4 hover:underline">{c.certNo}</a></td>
                  <td className="py-2 tabular-nums">{c.lotId}</td>
                  <td className="py-2 tabular-nums text-[var(--ink-muted)]">{formatDate(c.issuedAt)}</td>
                  <td className="py-2 text-right"><CertStatusPill status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </>
  );
}
