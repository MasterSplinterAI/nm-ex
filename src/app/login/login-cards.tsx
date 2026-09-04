"use client";

import { useActionState } from "react";
import { loginAs } from "./actions";
import type { Participant } from "@/lib/dmo/types";
import { ROLE_SHORT } from "@/lib/dmo/labels";
import { ActionButton, inputClass, labelClass } from "@/components/portal/action-button";

const BLURB: Record<Participant["role"], string> = {
  supplier: "Log purchases, reach the minimum lot, submit for assay, follow your lots and certificates.",
  smelter: "See verified lots in the National Pool, accept, pay and collect, aggregate, register refined tin.",
  buyer: "Buy refined Nigerian tin offered domestically before it can be exported.",
  officer: "Approve participants, lock assays, run offers, issue and control certificates, set policy.",
  verifier: "Confirm a DMO certificate by number or QR before issuing CCI or clearing export.",
};

export function LoginCards({
  participants,
  oneClickPassword,
}: {
  participants: Participant[];
  oneClickPassword: string | null;
}) {
  const [state, action, pending] = useActionState(loginAs, null);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--forest)]">
          Demonstration accounts
        </p>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Choose a participant to open their dashboard. Each role sees only what its permissions allow.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {participants.map((p) => (
            <form
              key={p.id}
              action={action}
              className="flex flex-col border border-[var(--line)] bg-white/70 p-4 transition hover:border-[var(--forest)]"
            >
              <input type="hidden" name="participantId" value={p.id} />
              {oneClickPassword != null && <input type="hidden" name="password" value={oneClickPassword} />}
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                {ROLE_SHORT[p.role]}
              </p>
              <p className="font-display mt-1 text-lg leading-tight text-[var(--ink)]">{p.legalName}</p>
              <p className="mt-0.5 text-xs tabular-nums text-[var(--ink-muted)]">
                {p.regNo ?? (p.status === "approved" ? "Authorised agency user" : "Application pending")}
              </p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--ink-muted)]">{BLURB[p.role]}</p>
              {oneClickPassword == null && (
                <label className="mt-3 block">
                  <span className={labelClass}>Password</span>
                  <input type="password" name="password" required className={`${inputClass} mt-1`} />
                </label>
              )}
              <ActionButton
                tone={p.status === "approved" ? "primary" : "secondary"}
                className="mt-4"
                disabled={pending}
                pendingText="Signing in…"
              >
                {p.status === "approved" ? "Sign in" : "Pending approval"}
              </ActionButton>
            </form>
          ))}
        </div>
        {state?.error && (
          <p className="mt-4 text-sm text-[#9b2c2c]" role="alert">
            {state.error}
          </p>
        )}
      </div>
    </div>
  );
}
