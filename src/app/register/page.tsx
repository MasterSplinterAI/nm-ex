import { PublicShell } from "@/components/portal/public-shell";
import { CATEGORY_LABEL } from "@/lib/dmo/labels";
import { readState } from "@/lib/dmo/store";
import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;
  const state = await readState();

  if (submitted) {
    const applicant = state.participants.find((p) => p.id === submitted);
    return (
      <PublicShell title="Application received" lede="Your application is now in the NM-EX compliance review queue.">
        <div className="overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-white shadow-[0_18px_60px_rgba(15,35,27,0.08)]">
          <div className="flex items-center gap-4 border-b border-[var(--rule)] bg-[var(--forest)]/[0.045] px-6 py-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--forest)] text-white">
              <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
                <path d="m4.5 10.2 3.3 3.2 7.7-7.3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">Submission complete</p>
              <p className="text-xs text-[var(--ink-muted)]">Keep the reference below for your records.</p>
            </div>
          </div>
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[var(--forest)]">Application reference</p>
              <p className="font-display mt-2 text-2xl tabular-nums text-[var(--ink)] sm:text-3xl">{submitted}</p>
              {applicant && (
                <div className="mt-6 rounded-xl border border-[var(--line)] bg-[#fbfcfb] p-4">
                  <p className="text-sm font-semibold text-[var(--ink)]">{applicant.legalName}</p>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">
                    {applicant.category ? CATEGORY_LABEL[applicant.category] : applicant.role} · {applicant.documents.length} document
                    {applicant.documents.length === 1 ? "" : "s"} attached
                  </p>
                </div>
              )}
            </div>
            <div className="border-t border-[var(--rule)] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="eyebrow">What happens next</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                Submission does not activate an account. An NM-EX official will verify the documents, then approve the
                application or request further information. Sign-in becomes available after approval.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-[var(--rule)] bg-[#fbfcfb] px-6 py-4 sm:px-8">
            <a href="/login" className="inline-flex h-11 items-center rounded-lg bg-[var(--ink)] px-5 text-sm font-semibold text-white hover:bg-[var(--forest)]">
              Go to sign in
            </a>
            <a href="/exchange" className="inline-flex h-11 items-center px-3 text-sm font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]">
              Back to the exchange
            </a>
          </div>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell
      wide
      title="Apply to join NM-EX"
      lede="Register your organization for role-based access to Nigeria’s mineral exchange and compliance registry."
    >
      <RegisterForm requiredDocuments={state.policy.requiredDocuments} />
    </PublicShell>
  );
}
