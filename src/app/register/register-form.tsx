"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { submitRegistrationAction } from "./actions";
import { CATEGORY_LABEL } from "@/lib/dmo/labels";
import type { ParticipantCategory } from "@/lib/dmo/types";
import { ActionButton, inputClass, labelClass } from "@/components/portal/action-button";

const CATEGORY_HELP: Record<ParticipantCategory, string> = {
  tin_shed: "Buys small parcels from miners, accumulates, submits lots for NM-EX verification.",
  mining_company: "Holds a mining title and sells its own production.",
  aggregator: "Licensed to purchase and possess minerals; consolidates from sheds and miners.",
  smelter: "Qualified domestic processor. Accepts concentrate from the National Pool.",
  end_user: "Buys refined Nigerian tin — solder makers and other industrial consumers.",
};

const ORDER: ParticipantCategory[] = ["tin_shed", "mining_company", "aggregator", "smelter", "end_user"];
const CATEGORY_CODE: Record<ParticipantCategory, string> = {
  tin_shed: "TS",
  mining_company: "MC",
  aggregator: "AG",
  smelter: "SM",
  end_user: "EU",
};
const STEPS = ["Participant type", "Company details", "Compliance documents"] as const;
const buttonClass =
  "inline-flex h-11 items-center justify-center rounded-lg bg-[#1b4d38] px-5 text-sm font-semibold text-white transition hover:bg-[#163d2c] disabled:cursor-not-allowed disabled:opacity-40";

export function RegisterForm({
  requiredDocuments,
}: {
  requiredDocuments: Record<ParticipantCategory, string[]>;
}) {
  const [category, setCategory] = useState<ParticipantCategory | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [documentNames, setDocumentNames] = useState<Record<string, string>>({});
  const [state, action, pending] = useActionState(submitRegistrationAction, null);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    stepHeading.current?.focus();
  }, [step]);

  return (
    <form
      action={action}
      onKeyDown={(event) => {
        if (event.key === "Enter" && step !== 3 && event.target instanceof HTMLInputElement) {
          event.preventDefault();
        }
      }}
    >
      {(category ? requiredDocuments[category] : []).map((document) =>
        documentNames[document] ? (
          <input key={document} type="hidden" name="documentNames" value={documentNames[document]} />
        ) : null,
      )}
      <div className="grid overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-white shadow-[0_18px_60px_rgba(15,35,27,0.08)] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="relative overflow-hidden bg-[#153d2d] px-5 py-6 text-white sm:px-7 lg:min-h-[38rem] lg:py-8">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-white/10" />
          <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full border border-white/10" />
          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">NM-EX onboarding</p>
            <h2 className="font-display mt-2 text-2xl tracking-tight">Participant application</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              One application establishes your organization in the national minerals registry.
            </p>

            <ol className="mt-6 grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-0" aria-label="Application progress">
              {STEPS.map((label, index) => {
                const number = (index + 1) as 1 | 2 | 3;
                const active = step === number;
                const complete = step > number;
                return (
                  <li
                    key={label}
                    aria-current={active ? "step" : undefined}
                    className={`relative flex min-w-0 items-center gap-3 py-2 lg:py-3 ${
                      index < STEPS.length - 1 ? "lg:after:absolute lg:after:left-[15px] lg:after:top-[42px] lg:after:h-[18px] lg:after:w-px lg:after:bg-white/15" : ""
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                        complete
                          ? "border-[#d7b76d] bg-[#d7b76d] text-[#153d2d]"
                          : active
                            ? "border-white bg-white text-[#153d2d]"
                            : "border-white/25 text-white/50"
                      }`}
                    >
                      {complete ? <CheckIcon /> : number}
                    </span>
                    <span className={`hidden text-sm sm:block ${active || complete ? "text-white" : "text-white/45"}`}>{label}</span>
                    <span className="sr-only sm:hidden">{label}</span>
                  </li>
                );
              })}
            </ol>

            <div className="mt-6 hidden border-t border-white/15 pt-6 lg:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">What happens next</p>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                NM-EX reviews the organization and supporting documents before issuing access or requesting more information.
              </p>
              {category && (
                <div className="mt-5 rounded-xl border border-white/15 bg-white/[0.06] p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Applying as</p>
                  <p className="mt-1 text-sm font-semibold">{CATEGORY_LABEL[category]}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/55">
                    {requiredDocuments[category].length} compliance document
                    {requiredDocuments[category].length === 1 ? "" : "s"} requested
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="min-w-0 px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
          <div className="mb-7 border-b border-[var(--rule)] pb-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[var(--forest)]">Step {step} of 3</p>
            <h3 ref={stepHeading} tabIndex={-1} className="font-display mt-1 text-2xl tracking-tight text-[var(--ink)] outline-none">
              {step === 1 ? "Choose your participant type" : step === 2 ? "Tell us about the organization" : "Provide compliance documents"}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">
              {step === 1
                ? "This determines your NM-EX permissions, market view, and document requirements."
                : step === 2
                  ? "Use the details shown on the organization’s registration records."
                  : "Files are reviewed by compliance before the account can be activated."}
            </p>
          </div>

          <fieldset className={step === 1 ? "" : "hidden"}>
            <legend className="sr-only">Participant type</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {ORDER.map((item) => {
                const selected = category === item;
                return (
                  <label
                    key={item}
                    className={`group relative flex cursor-pointer gap-4 rounded-xl border p-4 transition focus-within:ring-2 focus-within:ring-[var(--forest)] focus-within:ring-offset-2 ${
                      selected
                        ? "border-[var(--forest)] bg-[var(--forest)]/[0.055] shadow-[inset_0_0_0_1px_var(--forest)]"
                        : "border-[var(--line)] bg-white hover:border-[var(--forest)]/50 hover:bg-[#f8faf8]"
                    } ${item === "end_user" ? "sm:col-span-2" : ""}`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={item}
                      checked={selected}
                      onChange={() => {
                        setCategory(item);
                        setDocumentNames({});
                      }}
                      className="sr-only"
                    />
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold tracking-wide ${
                        selected ? "bg-[var(--forest)] text-white" : "bg-[#edf2ef] text-[var(--forest)]"
                      }`}
                    >
                      {CATEGORY_CODE[item]}
                    </span>
                    <span className="min-w-0 pr-5">
                      <span className="block text-sm font-semibold text-[var(--ink)]">{CATEGORY_LABEL[item]}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-[var(--ink-muted)]">{CATEGORY_HELP[item]}</span>
                    </span>
                    {selected && (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--forest)] text-white">
                        <CheckIcon />
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            <FormFooter>
              <span className="text-xs text-[var(--ink-soft)]">Select the role that best describes your principal activity.</span>
              <button type="button" disabled={!category} onClick={() => setStep(2)} className={buttonClass}>
                Continue
                <ArrowIcon />
              </button>
            </FormFooter>
          </fieldset>

          <fieldset className={step === 2 ? "" : "hidden"}>
            <legend className="sr-only">Company details</legend>
            <FormSection label="Registered entity">
              <label className="block">
                <span className={labelClass}>Registered legal name</span>
                <input name="legalName" required autoComplete="organization" className={`${inputClass} mt-1.5`} placeholder="e.g. Wamba Tin Shed Ltd" />
              </label>
              <label className="block">
                <span className={labelClass}>Registered address</span>
                <input name="address" required autoComplete="street-address" className={`${inputClass} mt-1.5`} placeholder="Street, town, state" />
              </label>
            </FormSection>

            <FormSection label="Primary contact">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={labelClass}>Contact person</span>
                  <input name="contactName" required autoComplete="name" className={`${inputClass} mt-1.5`} placeholder="Full name" />
                </label>
                <label className="block">
                  <span className={labelClass}>Phone</span>
                  <input name="phone" type="tel" required autoComplete="tel" className={`${inputClass} mt-1.5`} placeholder="+234 …" />
                </label>
                <label className="block">
                  <span className={labelClass}>E-mail</span>
                  <input name="email" type="email" required autoComplete="email" className={`${inputClass} mt-1.5`} placeholder="name@company.com" />
                </label>
              </div>
            </FormSection>

            <FormFooter>
              <button type="button" onClick={() => setStep(1)} className="h-11 px-2 text-sm font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]">
                Back
              </button>
              <button
                type="button"
                onClick={(event) => {
                  const fieldset = event.currentTarget.closest("fieldset");
                  const fields = fieldset?.querySelectorAll<HTMLInputElement>("input:not([type='hidden'])") ?? [];
                  const valid = Array.from(fields).every((field) => field.reportValidity());
                  if (valid) setStep(3);
                }}
                className={buttonClass}
              >
                Review documents
                <ArrowIcon />
              </button>
            </FormFooter>
          </fieldset>

          <fieldset className={step === 3 ? "" : "hidden"}>
            <legend className="sr-only">Compliance documents</legend>
            <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-[var(--forest)]/15 bg-[var(--forest)]/[0.045] px-4 py-3">
              <div>
                <p className="text-xs text-[var(--ink-muted)]">Requirements for</p>
                <p className="text-sm font-semibold text-[var(--ink)]">{category ? CATEGORY_LABEL[category] : "—"}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--forest)] shadow-sm">
                {category ? requiredDocuments[category].length : 0} required
              </span>
            </div>

            <ul key={category} className="space-y-3">
              {(category ? requiredDocuments[category] : []).map((document, index) => (
                <li key={document} className="rounded-xl border border-[var(--line)] bg-[#fbfcfb] p-4">
                  <div className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf2ef] text-xs font-bold text-[var(--forest)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[var(--ink)]">{document}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-soft)]">PDF, JPG or PNG</span>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        aria-label={`Upload ${document}`}
                        onChange={(event) => {
                          const name = event.currentTarget.files?.[0]?.name ?? "";
                          setDocumentNames((current) => {
                            const next = { ...current };
                            if (name) next[document] = name;
                            else delete next[document];
                            return next;
                          });
                        }}
                        className="mt-3 block w-full text-xs text-[var(--ink-muted)] file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-[var(--line-strong)] file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--ink)] hover:file:border-[var(--forest)]"
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex gap-3 rounded-lg bg-[#f5f3ed] px-4 py-3 text-xs leading-relaxed text-[var(--ink-muted)]">
              <ShieldIcon />
              <p>
                NM-EX officials verify every document before activation. In this demonstration, only file names are recorded; file contents are not stored.
              </p>
            </div>
            <FormFooter>
              <button type="button" onClick={() => setStep(2)} className="h-11 px-2 text-sm font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]">
                Back
              </button>
              <ActionButton disabled={pending} pendingText="Submitting…" className="min-w-40">
                Submit application
              </ActionButton>
            </FormFooter>
          </fieldset>
          {state?.error && (
            <p className="mt-4 rounded-lg border border-[#9b2c2c]/20 bg-[#9b2c2c]/5 px-4 py-3 text-sm text-[#9b2c2c]" role="alert">
              {state.error}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

function FormSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="mb-7">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">{label}</p>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FormFooter({ children }: { children: ReactNode }) {
  return (
    <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[var(--rule)] pt-5 sm:flex-row sm:items-center sm:justify-between">
      {children}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="m4.5 10.2 3.3 3.2 7.7-7.3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
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

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--forest)]" aria-hidden="true">
      <path d="M12 3 5.5 5.5v5.8c0 4 2.5 7.5 6.5 9.7 4-2.2 6.5-5.7 6.5-9.7V5.5L12 3Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}
