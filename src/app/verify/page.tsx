import { redirect } from "next/navigation";
import { ActionForm, inputClass } from "@/components/portal/action-button";
import { PublicShell } from "@/components/portal/public-shell";
import { CertStatusPill } from "@/components/portal/status-pill";
import { FieldList } from "@/components/portal/field-list";
import { formatDate, formatMt, formatPct } from "@/lib/format";
import { CERT_CLASS_LABEL } from "@/lib/dmo/labels";
import { certificatePublicView } from "@/lib/dmo/queries";
import { readState } from "@/lib/dmo/store";
import { getSession } from "@/lib/dmo/session";
import { certificateStatusAction } from "@/app/portal/admin/actions";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ no?: string }> }) {
  const { no } = await searchParams;
  const query = (no ?? "").trim();
  const [state, session] = await Promise.all([readState(), getSession()]);
  const view = query ? certificatePublicView(state, query) : null;
  const inspector = session?.role === "officer" || session?.role === "verifier";

  if (session?.role === "verifier" && query) {
    redirect(`/portal/verify?no=${encodeURIComponent(query)}`);
  }

  const canDischarge = inspector && view && view.cls !== "DMO-A" && view.status === "VALID";
  const loginNext = query ? `/verify?no=${encodeURIComponent(query)}` : "/verify";

  return (
    <PublicShell
      title="Verify a DMO certificate"
      lede="NESS, Nigeria Customs Service, banks and counterparties. Scan the QR or enter the number. The NM-EX record is authoritative — a printout has no standing if it differs."
    >
      <form method="get" action="/verify" className="flex flex-col gap-3 sm:flex-row">
        <input
          name="no"
          defaultValue={query}
          placeholder="NMEX-DMO-EC-TINC-2026-00021"
          className="h-12 flex-1 border border-[var(--line)] bg-white px-4 font-mono text-sm uppercase tracking-wide text-[var(--ink)] focus:border-[var(--forest)] focus:outline-none"
          autoFocus
          required
        />
        <button type="submit" className="h-12 bg-[var(--ink)] px-6 text-sm font-semibold text-[var(--paper)] hover:bg-[var(--forest)]">
          Verify
        </button>
      </form>

      {query && !view && (
        <div className="mt-8 border border-[#9b2c2c]/40 bg-[#9b2c2c]/5 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9b2c2c]">Not found</p>
          <p className="font-display mt-1 text-2xl text-[var(--ink)]">No certificate {query.toUpperCase()} exists on the NM-EX register.</p>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Treat any document bearing this number as invalid. Check the number, then contact NM-EX Compliance.
          </p>
        </div>
      )}

      {view && (
        <div
          className={`mt-8 border p-6 ${
            view.status === "VALID"
              ? "border-[var(--forest)]/40 bg-[var(--forest)]/5"
              : view.status === "UTILIZED"
                ? "border-[#1f4b6b]/40 bg-[#1f4b6b]/5"
                : "border-[#9b2c2c]/40 bg-[#9b2c2c]/5"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink-muted)]">{CERT_CLASS_LABEL[view.cls]}</p>
              <p className="font-display mt-1 text-2xl tabular-nums text-[var(--ink)] sm:text-3xl">{view.certNo}</p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                {view.title} — {view.subtitle}
              </p>
            </div>
            <CertStatusPill status={view.status} big />
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[var(--ink)]">
            {view.status === "VALID" && view.cls !== "DMO-A" && "Valid and unused. This clearance may support one export. Once NESS / Customs mark it utilized it cannot be presented again."}
            {view.status === "VALID" && view.cls === "DMO-A" && "This certificate records a valid domestic acceptance. It does not authorise export."}
            {view.status === "UTILIZED" && "Already presented and used for an export. Reject a second shipment against this number."}
            {(view.status === "CANCELLED" || view.status === "SUPERSEDED" || view.status === "EXPIRED") && "No longer valid. Do not accept it in support of any transaction or export."}
            {(view.status === "SUSPENDED" || view.status === "UNDER_REVIEW") && "Under NM-EX review. Hold the shipment and contact NM-EX Compliance."}
          </p>

          <div className="mt-5 border-t border-[var(--ink)]/10 pt-4">
            <FieldList
              rows={[
                { label: "Commodity", value: view.commodity },
                { label: "NM-EX lot ID", value: view.lotId, strong: true },
                ...(view.parentLotId ? [{ label: "Parent lot", value: view.parentLotId }] : []),
                { label: "Verified weight", value: formatMt(view.verifiedMt * 1000) },
                { label: "Verified grade", value: `${formatPct(view.verifiedGradePct, 2)} Sn` },
                { label: "Contained tin", value: formatMt(view.containedTinMt * 1000), strong: true },
                { label: "Issued", value: formatDate(view.issuedAt) },
                { label: "Used for export", value: view.utilized ? "Yes — cannot be reused" : "No" },
              ]}
            />
          </div>

          {canDischarge && (
            <div className="mt-6 border-t border-[var(--ink)]/10 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1f4b6b]">Appointed inspector action</p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Marking utilized is permanent. The certificate becomes unusable for any further shipment and the lot status updates on the national register.
              </p>
              <ActionForm
                action={certificateStatusAction}
                hidden={{ certNo: view.certNo, status: "UTILIZED" }}
                inline={false}
                className="mt-3 sm:flex-row sm:items-center"
                confirm="Mark this certificate utilized? It can never support another export."
              >
                <input name="note" placeholder="NXP / SAD / shipment reference" className={`${inputClass} sm:max-w-xs`} />
                <button className="h-11 bg-[#1f4b6b] px-5 text-sm font-semibold text-white hover:bg-[var(--ink)]">
                  Mark utilized — export completed
                </button>
              </ActionForm>
            </div>
          )}

          {!inspector && view.cls !== "DMO-A" && view.status === "VALID" && (
            <div className="mt-6 border-t border-[var(--ink)]/10 pt-4">
              <p className="text-sm text-[var(--ink)]">
                Appointed NESS / Customs officer? Sign in to discharge this certificate so it cannot be reused.
              </p>
              <a
                href={`/login?next=${encodeURIComponent(loginNext)}`}
                className="mt-3 inline-flex h-11 items-center bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)] hover:bg-[var(--forest)]"
              >
                Sign in to mark utilized
              </a>
            </div>
          )}

          {inspector && (
            <a
              href={`/certificates/${encodeURIComponent(view.certNo)}`}
              className="mt-4 inline-flex h-10 items-center px-0 text-sm font-semibold text-[var(--ink)] underline underline-offset-4"
            >
              Open full certificate
            </a>
          )}

          <p className="mt-4 text-xs text-[var(--ink-muted)]">
            Public verification shows lot identity and physical facts only. Prices and party details appear to named parties, NM-EX and appointed verifiers after sign-in.
          </p>
        </div>
      )}

      {!query && (
        <div className="mt-10 grid gap-3 text-sm text-[var(--ink-muted)] sm:grid-cols-3">
          {[
            ["VALID", "Genuine and unused. One export. Inspector marks it utilized at clearance."],
            ["UTILIZED", "Already used. Reject a second presentation — the live record will not flip back."],
            ["CANCELLED / SUSPENDED", "Do not accept. Contact NM-EX Compliance."],
          ].map(([k, v]) => (
            <div key={k} className="border border-[var(--line)] bg-white/70 p-4">
              <p className="font-semibold text-[var(--ink)]">{k}</p>
              <p className="mt-1">{v}</p>
            </div>
          ))}
        </div>
      )}
    </PublicShell>
  );
}
