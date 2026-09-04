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
      <PublicShell title="Application received">
        <div className="border border-[var(--forest)]/40 bg-[var(--forest)]/5 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--forest)]">Reference</p>
          <p className="font-display mt-1 text-2xl tabular-nums text-[var(--ink)]">{submitted}</p>
          {applicant && (
            <p className="mt-3 text-sm text-[var(--ink)]">
              <strong>{applicant.legalName}</strong> — {applicant.category ? CATEGORY_LABEL[applicant.category] : applicant.role}.{" "}
              {applicant.documents.length} document{applicant.documents.length === 1 ? "" : "s"} attached.
            </p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
            Submission does not activate an account. An NM-EX official will verify your documents and either approve,
            request further information, or reject the application. You will be able to sign in once approved.
          </p>
          <div className="mt-6 flex gap-3">
            <a href="/login" className="inline-flex h-11 items-center bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)]">
              Go to sign in
            </a>
            <a href="/exchange" className="inline-flex h-11 items-center px-3 text-sm text-[var(--ink-muted)] underline-offset-4 hover:underline">
              Back to the exchange
            </a>
          </div>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell
      title="Register with NM-EX"
      lede="Role-based onboarding. Tell us what kind of participant you are and NM-EX will ask for the compliance documents that apply to you."
    >
      <RegisterForm requiredDocuments={state.policy.requiredDocuments} />
    </PublicShell>
  );
}
