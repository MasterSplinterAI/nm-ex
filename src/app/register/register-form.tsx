"use client";

import { useActionState, useState } from "react";
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

export function RegisterForm({
  requiredDocuments,
}: {
  requiredDocuments: Record<ParticipantCategory, string[]>;
}) {
  const [category, setCategory] = useState<ParticipantCategory | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [state, action, pending] = useActionState(submitRegistrationAction, null);

  return (
    <form action={action} className="space-y-8">
      <ol className="flex gap-4 text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
        {["Participant type", "Company details", "Compliance documents"].map((label, i) => (
          <li key={label} className={step === i + 1 ? "font-semibold text-[var(--ink)]" : ""}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <fieldset className={step === 1 ? "" : "hidden"}>
        <legend className="font-display text-xl text-[var(--ink)]">What type of NM-EX participant are you?</legend>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Your selection decides which compliance documents NM-EX will ask for.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {ORDER.map((c) => (
            <label
              key={c}
              className={`flex cursor-pointer flex-col border p-4 transition ${
                category === c ? "border-[var(--forest)] bg-[var(--forest)]/5" : "border-[var(--line)] bg-white/70 hover:border-[var(--ink)]/40"
              }`}
            >
              <input
                type="radio"
                name="category"
                value={c}
                checked={category === c}
                onChange={() => setCategory(c)}
                className="sr-only"
              />
              <span className="font-semibold text-[var(--ink)]">{CATEGORY_LABEL[c]}</span>
              <span className="mt-1 text-sm text-[var(--ink-muted)]">{CATEGORY_HELP[c]}</span>
            </label>
          ))}
        </div>
        <div className="mt-6">
          <button
            type="button"
            disabled={!category}
            onClick={() => setStep(2)}
            className="h-11 bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)] hover:bg-[var(--forest)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      </fieldset>

      <fieldset className={step === 2 ? "space-y-4" : "hidden"}>
        <legend className="font-display text-xl text-[var(--ink)]">Company details</legend>
        <label className="block">
          <span className={labelClass}>Registered legal name</span>
          <input name="legalName" required className={`${inputClass} mt-1`} placeholder="e.g. Wamba Tin Shed Ltd" />
        </label>
        <label className="block">
          <span className={labelClass}>Registered address</span>
          <input name="address" required className={`${inputClass} mt-1`} placeholder="Street, town, state" />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={labelClass}>Contact person</span>
            <input name="contactName" required className={`${inputClass} mt-1`} />
          </label>
          <label className="block">
            <span className={labelClass}>Phone</span>
            <input name="phone" required className={`${inputClass} mt-1`} placeholder="+234 …" />
          </label>
          <label className="block">
            <span className={labelClass}>E-mail</span>
            <input name="email" type="email" required className={`${inputClass} mt-1`} />
          </label>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => setStep(1)} className="h-11 px-4 text-sm text-[var(--ink-muted)] underline-offset-4 hover:underline">
            Back
          </button>
          <button
            type="button"
            onClick={(e) => {
              const form = e.currentTarget.form!;
              const ok = ["legalName", "address", "contactName", "phone", "email"].every((n) =>
                (form.elements.namedItem(n) as HTMLInputElement).reportValidity(),
              );
              if (ok) setStep(3);
            }}
            className="h-11 bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)] hover:bg-[var(--forest)]"
          >
            Continue
          </button>
        </div>
      </fieldset>

      <fieldset className={step === 3 ? "space-y-4" : "hidden"}>
        <legend className="font-display text-xl text-[var(--ink)]">Compliance documents</legend>
        <p className="text-sm text-[var(--ink-muted)]">
          Required for <strong className="text-[var(--ink)]">{category ? CATEGORY_LABEL[category] : "—"}</strong>. NM-EX
          officials verify each document before the account is activated.
        </p>
        <ul className="divide-y divide-[var(--line)] border border-[var(--line)] bg-white/70">
          {(category ? requiredDocuments[category] : []).map((doc) => (
            <li key={doc} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-[var(--ink)]">{doc}</span>
              <input
                type="file"
                name="documents"
                accept=".pdf,.jpg,.jpeg,.png"
                className="text-xs text-[var(--ink-muted)] file:mr-3 file:border file:border-[var(--line)] file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--ink)]"
              />
            </li>
          ))}
        </ul>
        <p className="text-xs text-[var(--ink-muted)]">
          Demonstration: file names are recorded; file contents are not stored.
        </p>
        {state?.error && (
          <p className="text-sm text-[#9b2c2c]" role="alert">
            {state.error}
          </p>
        )}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => setStep(2)} className="h-11 px-4 text-sm text-[var(--ink-muted)] underline-offset-4 hover:underline">
            Back
          </button>
          <ActionButton disabled={pending} pendingText="Submitting…">
            Submit application
          </ActionButton>
        </div>
      </fieldset>
    </form>
  );
}
