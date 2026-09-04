import { notFound, redirect } from "next/navigation";
import { CertificateSheet } from "@/components/certificate/certificate-sheet";
import { PrintButton } from "@/components/certificate/print-button";
import { formatDateTime } from "@/lib/format";
import { certificateFullView } from "@/lib/dmo/queries";
import { qrSvg, verifyUrl } from "@/lib/dmo/qr";
import { getSession, roleHome } from "@/lib/dmo/session";
import { readState } from "@/lib/dmo/store";

export const dynamic = "force-dynamic";

export default async function CertificatePage({ params }: { params: Promise<{ certNo: string }> }) {
  const { certNo } = await params;
  const decoded = decodeURIComponent(certNo);
  const session = await getSession();
  if (!session) redirect(`/verify?no=${encodeURIComponent(decoded)}`);

  const state = await readState();
  const view = certificateFullView(state, decoded);
  if (!view) notFound();

  const isParty = view.supplier.id === session.participantId || view.counterparty?.id === session.participantId;
  if (!isParty && session.role !== "officer" && session.role !== "verifier") {
    redirect(`/verify?no=${encodeURIComponent(decoded)}`);
  }

  const svg = await qrSvg(verifyUrl(view.certNo));

  return (
    <div className="min-h-dvh bg-[var(--paper)] px-4 py-6 text-[var(--ink)] sm:px-8 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-3xl flex-wrap items-center justify-between gap-3 print:hidden">
        <a href={roleHome(session.role)} className="text-sm text-[var(--ink-muted)] underline-offset-4 hover:underline">
          ← Back to portal
        </a>
        <div className="flex items-center gap-3">
          <a href={`/verify?no=${encodeURIComponent(view.certNo)}`} className="text-sm text-[var(--ink-muted)] underline-offset-4 hover:underline">
            Public verification view
          </a>
          <PrintButton />
        </div>
      </div>
      <CertificateSheet view={view} state={state} qrSvg={svg} />
      <div className="mx-auto mt-6 max-w-3xl print:hidden">
        <details className="border border-[var(--line)] bg-white/70 p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Chain of custody — {view.audit.length} audit events for this lot</summary>
          <ol className="mt-3 divide-y divide-[var(--line)]">
            {view.audit.map((e) => (
              <li key={e.id} className="grid gap-1 py-2 sm:grid-cols-[10rem_12rem_1fr]">
                <span className="tabular-nums text-[var(--ink-muted)]">{formatDateTime(e.at)}</span>
                <span className="font-medium">{e.actorLabel}</span>
                <span>{e.detail}</span>
              </li>
            ))}
          </ol>
        </details>
      </div>
    </div>
  );
}
