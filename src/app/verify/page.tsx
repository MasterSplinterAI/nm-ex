import { redirect } from "next/navigation";
import { ActionButton, ActionForm } from "@/components/portal/action-button";
import { inputClass } from "@/components/portal/form-styles";
import { PublicShell } from "@/components/portal/public-shell";
import { certTone, CertStatusPill, type Tone } from "@/components/portal/status-pill";
import { formatDate, formatMt, formatPct } from "@/lib/format";
import { CERT_CLASS_LABEL } from "@/lib/dmo/labels";
import { certificatePublicView } from "@/lib/dmo/queries";
import { readState } from "@/lib/dmo/store";
import { getSession } from "@/lib/dmo/session";
import type { CertificateStatus } from "@/lib/dmo/types";
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
      wide
      title="Verify a DMO certificate"
      lede="Confirm a Domestic Market Obligation certificate against the authoritative NM-EX registry."
    >
      <section className="grid overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-white shadow-[0_18px_60px_rgba(15,35,27,0.08)] lg:grid-cols-[19rem_minmax(0,1fr)]">
        <div className="relative overflow-hidden bg-[#153d2d] px-6 py-7 text-white sm:px-8 lg:min-h-64 lg:py-8">
          <div className="absolute -right-14 -top-20 h-52 w-52 rounded-full border border-white/10" />
          <div className="absolute -right-6 -top-12 h-36 w-36 rounded-full border border-white/10" />
          <div className="relative">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <ShieldCheckIcon />
            </span>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">Public registry check</p>
            <p className="font-display mt-2 text-2xl tracking-tight">Trust the live record</p>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              A printed certificate has no standing if its number, status, or physical facts differ from this registry.
            </p>
          </div>
        </div>

        <div className="px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[var(--forest)]">Certificate lookup</p>
          <h2 className="font-display mt-1 text-2xl tracking-tight text-[var(--ink)]">
            Enter the certificate number
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">
            Scan the document QR code or enter the complete NM-EX number exactly as printed.
          </p>
          <form method="get" action="/verify" className="mt-6">
            <label htmlFor="certificate-number" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              DMO certificate number
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--ink-soft)]">
                  <SearchIcon />
                </span>
                <input
                  id="certificate-number"
                  name="no"
                  defaultValue={query}
                  placeholder="NMEX-DMO-ER-TIN-2026-00001"
                  className="h-12 w-full rounded-lg border border-[var(--line-strong)] bg-white pl-11 pr-4 font-mono text-sm uppercase tracking-wide text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-soft)] focus:border-[var(--forest)] focus:ring-2 focus:ring-[var(--forest)]/15"
                  autoFocus={!query}
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
              </div>
              <button type="submit" className="inline-flex h-12 items-center justify-center rounded-lg bg-[#1b4d38] px-7 text-sm font-semibold text-white transition hover:bg-[#163d2c]">
                Verify certificate
                <ArrowIcon />
              </button>
            </div>
          </form>
          {!query && (
            <p className="mt-4 text-xs text-[var(--ink-soft)]">
              Demonstration number:{" "}
              <a href="/verify?no=NMEX-DMO-ER-TIN-2026-00001" className="font-mono font-semibold text-[var(--forest)] underline-offset-4 hover:underline">
                NMEX-DMO-ER-TIN-2026-00001
              </a>
            </p>
          )}
        </div>
      </section>

      {query && !view && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-[#9b2c2c]/25 bg-white shadow-sm">
          <div className="flex gap-4 bg-[#9b2c2c]/[0.06] px-6 py-5 sm:px-8">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#9b2c2c] text-white">
              <CrossIcon />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#9b2c2c]">No registry match</p>
              <h2 className="font-display mt-1 break-all text-xl text-[var(--ink)] sm:text-2xl">{query.toUpperCase()}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                No certificate with this number exists on the NM-EX register. Treat the presented document as invalid,
                check the number, and contact NM-EX Compliance if the discrepancy remains.
              </p>
            </div>
          </div>
        </section>
      )}

      {view && (
        <article className="mt-6 overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-white shadow-[0_14px_45px_rgba(15,35,27,0.06)]">
          <div className={`border-b px-5 py-5 sm:px-8 ${RESULT_TONE[certTone(view.status)].band}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ResultIcon status={view.status} />
                  <p className="eyebrow">{CERT_CLASS_LABEL[view.cls]}</p>
                </div>
                <h2 className="font-display mt-2 break-words text-xl tabular-nums text-[var(--ink)] sm:text-3xl">{view.certNo}</h2>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  {view.title} · {view.subtitle}
                </p>
              </div>
              <CertStatusPill status={view.status} big />
            </div>
            <p className="mt-4 max-w-4xl text-sm font-medium leading-relaxed text-[var(--ink)]">
              {view.status === "VALID" && view.cls !== "DMO-A" && "Genuine and unused. This clearance may support one export. Once NESS or Customs marks it utilized, it cannot be presented again."}
              {view.status === "VALID" && view.cls === "DMO-A" && "This certificate records a valid domestic acceptance. It does not authorize export."}
              {view.status === "UTILIZED" && "Already presented and used for an export. Reject any second shipment against this number."}
              {(view.status === "CANCELLED" || view.status === "SUPERSEDED" || view.status === "EXPIRED") && "No longer valid. Do not accept it in support of a transaction or export."}
              {(view.status === "SUSPENDED" || view.status === "UNDER_REVIEW") && "Under NM-EX review. Hold the shipment and contact NM-EX Compliance."}
            </p>
          </div>

          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <section>
              <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[var(--forest)]">Verified physical facts</p>
              <dl className="mt-3 grid gap-px overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--rule)] sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2">
                <Detail label="Commodity" value={view.commodity} />
                <Detail label="NM-EX lot ID" value={view.lotId} strong />
                {view.parentLotId && <Detail label="Parent lot" value={view.parentLotId} />}
                <Detail label="Verified weight" value={formatMt(view.verifiedMt * 1000)} />
                <Detail label="Verified grade" value={`${formatPct(view.verifiedGradePct, 2)} Sn`} />
                <Detail label="Contained tin" value={formatMt(view.containedTinMt * 1000)} strong />
                <Detail label="Date issued" value={formatDate(view.issuedAt)} />
                <Detail label="Used for export" value={view.utilized ? "Yes — cannot be reused" : "No"} strong={view.utilized} />
              </dl>
            </section>

            <aside className="rounded-xl border border-[var(--line)] bg-[#fbfcfb] p-5">
              <p className="eyebrow">Registry guidance</p>
              <div className="mt-3 flex gap-3">
                <ShieldSmallIcon />
                <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                  Public verification shows lot identity and physical facts only. Commercial values and party details
                  are available to named parties, NM-EX, and appointed verifiers after sign-in.
                </p>
              </div>

              {canDischarge && (
                <div className="mt-5 border-t border-[var(--rule)] pt-5">
                  <p className="text-xs font-semibold text-[#1f4b6b]">Appointed inspector action</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                    Marking utilized is permanent and prevents reuse.
                  </p>
                  <ActionForm
                    action={certificateStatusAction}
                    hidden={{ certNo: view.certNo, status: "UTILIZED" }}
                    inline={false}
                    className="mt-3"
                    confirm="Mark this certificate utilized? It can never support another export."
                  >
                    <input name="note" aria-label="Shipment reference" placeholder="NXP / SAD / shipment reference" className={inputClass} />
                    <ActionButton pendingText="Marking utilized…">
                      Mark utilized
                    </ActionButton>
                  </ActionForm>
                </div>
              )}

              {!inspector && view.cls !== "DMO-A" && view.status === "VALID" && (
                <div className="mt-5 border-t border-[var(--rule)] pt-5">
                  <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
                    NESS or Customs officers can sign in to discharge this clearance after export.
                  </p>
                  <a
                    href={`/login?next=${encodeURIComponent(loginNext)}`}
                    className="mt-3 inline-flex h-10 items-center rounded-lg bg-[var(--ink)] px-4 text-xs font-semibold text-white hover:bg-[var(--forest)]"
                  >
                    Inspector sign in
                  </a>
                </div>
              )}

              {inspector && (
                <a
                  href={`/certificates/${encodeURIComponent(view.certNo)}`}
                  className="mt-4 inline-flex text-sm font-semibold text-[var(--forest)] underline underline-offset-4"
                >
                  Open full certificate
                </a>
              )}
            </aside>
          </div>
        </article>
      )}

      {!query && (
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[var(--forest)]">Reading the result</p>
              <h2 className="font-display mt-1 text-xl text-[var(--ink)]">Certificate status guide</h2>
            </div>
            <p className="hidden text-xs text-[var(--ink-soft)] sm:block">The live status always prevails</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatusGuide tone="green" title="Valid" text="Genuine and unused. One export clearance may be supported." />
            <StatusGuide tone="blue" title="Utilized" text="Already used. Reject a second presentation of the number." />
            <StatusGuide tone="amber" title="Under review or suspended" text="Hold the shipment and contact NM-EX Compliance." />
            <StatusGuide tone="red" title="Cancelled or expired" text="No longer valid. Do not accept the certificate." />
          </div>
        </section>
      )}
    </PublicShell>
  );
}

function Detail({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0 bg-white px-4 py-3">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--ink-soft)]">{label}</dt>
      <dd className={`mt-1 break-words text-sm text-[var(--ink)] ${strong ? "font-semibold" : ""}`}>{value}</dd>
    </div>
  );
}

function StatusGuide({ tone, title, text }: { tone: "green" | "blue" | "amber" | "red"; title: string; text: string }) {
  const colors = {
    green: "border-[var(--forest)]/20 bg-[var(--forest)]/[0.035] text-[var(--forest)]",
    blue: "border-[#1f4b6b]/20 bg-[#1f4b6b]/[0.035] text-[#1f4b6b]",
    amber: "border-[var(--copper)]/20 bg-[var(--copper)]/[0.045] text-[var(--copper)]",
    red: "border-[#9b2c2c]/20 bg-[#9b2c2c]/[0.035] text-[#9b2c2c]",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[tone]}`}>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-current" />
        <p className="text-xs font-bold uppercase tracking-[0.1em]">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{text}</p>
    </div>
  );
}

const RESULT_TONE: Record<Tone, { icon: string; band: string }> = {
  ok: {
    icon: "bg-[var(--forest)]",
    band: "border-[var(--forest)]/20 bg-[var(--forest)]/[0.055]",
  },
  info: {
    icon: "bg-[#1f4b6b]",
    band: "border-[#1f4b6b]/20 bg-[#1f4b6b]/[0.055]",
  },
  warn: {
    icon: "bg-[var(--copper)]",
    band: "border-[var(--copper)]/20 bg-[var(--copper)]/[0.065]",
  },
  bad: {
    icon: "bg-[#9b2c2c]",
    band: "border-[#9b2c2c]/20 bg-[#9b2c2c]/[0.055]",
  },
  muted: {
    icon: "bg-[var(--ink-muted)]",
    band: "border-[var(--line)] bg-[var(--ink)]/[0.03]",
  },
};

function ResultIcon({ status }: { status: CertificateStatus }) {
  const tone = certTone(status);
  return (
    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${RESULT_TONE[tone].icon}`}>
      {tone === "ok" ? <CheckIcon /> : tone === "info" ? <LockIcon /> : tone === "warn" ? <AlertIcon /> : <CrossIcon />}
    </span>
  );
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path d="M12 3 5.5 5.5v5.8c0 4 2.5 7.5 6.5 9.7 4-2.2 6.5-5.7 6.5-9.7V5.5L12 3Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function ShieldSmallIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--forest)]" aria-hidden="true">
      <path d="M12 3 5.5 5.5v5.8c0 4 2.5 7.5 6.5 9.7 4-2.2 6.5-5.7 6.5-9.7V5.5L12 3Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="m12.2 12.2 3.4 3.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" className="ml-2 h-4 w-4" aria-hidden="true">
      <path d="M4 10h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="m4.5 10.2 3.3 3.2 7.7-7.3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="m6 6 8 8m0-8-8 8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
      <rect x="5" y="8.5" width="10" height="7.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.5 8.5V6.8a2.5 2.5 0 0 1 5 0v1.7" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M10 5.2v5.2m0 3.2v.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}
