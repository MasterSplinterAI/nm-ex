import { redirect } from "next/navigation";
import { ActionForm } from "@/components/portal/action-button";
import { inputClass } from "@/components/portal/form-styles";
import { CertificateSheet } from "@/components/certificate/certificate-sheet";
import { PrintButton } from "@/components/certificate/print-button";
import { KpiTile, StatusTile } from "@/components/portal/kpi-tile";
import { Panel } from "@/components/portal/panel";
import { CertStatusPill } from "@/components/portal/status-pill";
import { WelcomeBanner } from "@/components/portal/welcome-banner";
import { formatDate } from "@/lib/format";
import { demoNowIso } from "@/lib/dmo/clock";
import { tabFromSearch } from "@/lib/dmo/nav";
import { certificateFullView, participantById } from "@/lib/dmo/queries";
import { qrSvg, verifyUrl } from "@/lib/dmo/qr";
import { getSession } from "@/lib/dmo/session";
import { readState } from "@/lib/dmo/store";
import { certificateStatusAction } from "../admin/actions";

export const dynamic = "force-dynamic";

export default async function VerifierPage({ searchParams }: { searchParams: Promise<{ no?: string; tab?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "verifier") redirect("/portal");
  const { no, tab } = await searchParams;
  const query = (no ?? "").trim();
  const showRegister = tabFromSearch(tab) === "register" && !query;
  const state = await readState();
  const me = participantById(state, session.participantId)!;
  const nowIso = demoNowIso(state);
  const view = query ? certificateFullView(state, query) : null;
  const svg = view ? await qrSvg(verifyUrl(view.certNo)) : null;
  const clearances = state.certificates.filter((c) => c.cls !== "DMO-A").sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const unused = clearances.filter((c) => c.status === "VALID").length;
  const used = clearances.filter((c) => c.status === "UTILIZED").length;

  return (
    <>
      {!query && !showRegister && (
        <div className="space-y-5">
          <WelcomeBanner name={me.legalName} nowIso={nowIso} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile href="/portal/verify?tab=register" icon="cert" label="Unused clearances" value={unused} hint="Valid DMO-EC / DMO-ER not yet presented." />
            <KpiTile href="/portal/verify?tab=register" icon="check" label="Already utilized" value={used} hint="Permanently spent numbers." />
            <KpiTile href="/verify" icon="scan" label="Public verify" value="Open" hint="What a bank sees without signing in." />
            <StatusTile
              href="/portal/verify?tab=register"
              label="Port desk"
              ok={unused === 0}
              okText="No unused clearances waiting at the port"
              waitText={`${unused} clearance${unused === 1 ? "" : "s"} still valid for a first scan`}
            />
          </div>
        </div>
      )}

      <form method="get" action="/portal/verify" className="my-6 flex flex-col gap-3 sm:flex-row">
        <input name="no" defaultValue={query} placeholder="Scan QR or enter certificate number" className={`${inputClass} h-12 flex-1 font-mono uppercase`} autoFocus />
        <button type="submit" className="h-12 rounded-lg bg-[#1b4d38] px-6 text-sm font-semibold text-white hover:bg-[#163d2c]">
          Look up
        </button>
      </form>

      {query && !view && (
        <div className="mb-6 border border-[#9b2c2c]/40 bg-[#9b2c2c]/5 p-5">
          <p className="font-display text-xl text-[var(--ink)]">No certificate {query.toUpperCase()} on the register.</p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">Treat the presented document as invalid and refer to NM-EX Compliance.</p>
        </div>
      )}

      {view && svg && (
        <div className="space-y-6">
          <Panel kicker="Inspector action" title={<span className="tabular-nums">{view.certNo}</span>} actions={<PrintButton />}>
            <div className="flex flex-wrap items-center gap-4">
              <CertStatusPill status={view.status} big />
              {view.cls !== "DMO-A" && view.status === "VALID" && (
                <ActionForm
                  action={certificateStatusAction}
                  hidden={{ certNo: view.certNo, status: "UTILIZED" }}
                  inline={false}
                  className="flex-1 sm:flex-row sm:items-center"
                  confirm="Mark this certificate utilized? It can never support another export."
                >
                  <input name="note" placeholder="NXP / SAD / shipment reference" className={`${inputClass} sm:max-w-xs`} />
                  <button className="h-11 bg-[#1f4b6b] px-5 text-sm font-semibold text-white hover:bg-[var(--ink)]">
                    Mark utilized — export completed
                  </button>
                </ActionForm>
              )}
              {view.status === "UTILIZED" && (
                <p className="text-sm text-[#1f4b6b]">Already utilized. This number is spent and will not authorise another shipment.</p>
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

      {(showRegister || (!query && !showRegister)) && (
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
                  <td className="py-2 tabular-nums">
                    <a href={`/portal/verify?no=${encodeURIComponent(c.certNo)}`} className="underline-offset-4 hover:underline">
                      {c.certNo}
                    </a>
                  </td>
                  <td className="py-2 tabular-nums">{c.lotId}</td>
                  <td className="py-2 tabular-nums text-[var(--ink-muted)]">{formatDate(c.issuedAt)}</td>
                  <td className="py-2 text-right">
                    <CertStatusPill status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </>
  );
}
