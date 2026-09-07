"use client";

import { useActionState } from "react";
import { loginAs } from "./actions";
import type { Participant, ParticipantCategory, Role } from "@/lib/dmo/types";
import { CATEGORY_LABEL, ROLE_SHORT } from "@/lib/dmo/labels";
import { ActionButton, inputClass, labelClass } from "@/components/portal/action-button";

/** What this participant actually does, in plain language, for a first-time viewer. */
const BY_CATEGORY: Partial<Record<ParticipantCategory, string>> = {
  tin_shed:
    "Buys tin from miners at the guaranteed floor, consolidates it into a marketable lot, sends it for official assay, then lists it on the National Pool.",
  mining_company: "Sells its own verified production straight into the National Pool, without going through a shed.",
  aggregator: "Consolidates concentrate from several sources into lots large enough to trade.",
};

const BY_ROLE: Record<Role, string> = {
  supplier: "Logs purchases, reaches the minimum marketable lot, submits for assay and follows the lot to sale.",
  smelter: "Sees every verified lot before it may leave the country, accepts at the board price, pays, collects and smelts.",
  buyer: "Buys refined Nigerian tin offered at home before any of it can be exported.",
  officer: "Approves participants, locks the official assay, runs the domestic offer window and issues every certificate.",
  verifier: "Scans a DMO certificate at the port and marks it used, so the same number cannot clear a second shipment.",
};

function blurb(p: Participant): string {
  return (p.category && BY_CATEGORY[p.category]) || BY_ROLE[p.role];
}

const CTA: Record<Role, string> = {
  supplier: "Open the supplier view",
  smelter: "Open the smelter view",
  buyer: "Open the buyer view",
  officer: "Open the officer console",
  verifier: "Open the verifier station",
};

/** Two suppliers on one page, so name the party rather than the role. */
const CTA_BY_CATEGORY: Partial<Record<ParticipantCategory, string>> = {
  mining_company: "Open the mine view",
  tin_shed: "Open the tin shed view",
  aggregator: "Open the aggregator view",
};

function cta(p: Participant): string {
  return (p.category && CTA_BY_CATEGORY[p.category]) || CTA[p.role];
}

type Group = {
  title: string;
  caption: string;
  pick: (p: Participant) => boolean;
};

const GROUPS: Group[] = [
  {
    title: "The market chain",
    caption: "Tin moves down this list. Each view sees only its own side of the trade.",
    pick: (p) => p.status === "approved" && (p.role === "supplier" || p.role === "smelter" || p.role === "buyer"),
  },
  {
    title: "Government & appointed agencies",
    caption: "Who may trade, what the assay says, and which certificate is allowed to clear the port.",
    pick: (p) => p.status === "approved" && (p.role === "officer" || p.role === "verifier"),
  },
  {
    title: "Waiting on approval",
    caption: "Applying does not activate an account. Sign in as the NM-EX officer to approve this one.",
    pick: (p) => p.status !== "approved",
  },
];

export function LoginCards({
  participants,
  oneClickPassword,
  next,
  coefMinerPct,
  coefShedPct,
  vatPct,
}: {
  participants: Participant[];
  oneClickPassword: string | null;
  next?: string | null;
  coefMinerPct: number;
  coefShedPct: number;
  vatPct: number;
}) {
  const [state, action, pending] = useActionState(loginAs, null);

  /** Where this participant sits on the coefficient ladder. */
  function economics(p: Participant): string | null {
    if (p.category === "mining_company") return `Sells direct at ${coefShedPct}% — no shed in between`;
    if (p.role === "supplier") return `Buys at ${coefMinerPct}% · sells at ${coefShedPct}%`;
    if (p.role === "smelter") return `Pays ${coefShedPct}% plus ${vatPct}% VAT`;
    if (p.role === "buyer") return "Buys refined tin at the board price";
    return null;
  }

  // Cards are numbered continuously across groups so they read as a walkthrough.
  // Offsets are folded up front rather than counted during render.
  const groups = GROUPS.map((group) => ({ group, cards: participants.filter(group.pick) }))
    .filter((g) => g.cards.length > 0)
    .reduce<{ list: { group: Group; cards: Participant[]; start: number }[]; n: number }>(
      (acc, g) => ({ list: [...acc.list, { ...g, start: acc.n }], n: acc.n + g.cards.length }),
      { list: [], n: 0 },
    ).list;

  return (
    <div className="space-y-8">
      {groups.map(({ group, cards, start }) => {
        return (
          <div key={group.title}>
            <h2 className="font-display text-lg">{group.title}</h2>
            <p className="mt-0.5 text-sm text-[var(--ink-muted)]">{group.caption}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((p, i) => {
                const step = start + i + 1;
                const approved = p.status === "approved";
                const money = economics(p);
                return (
                  <form key={p.id} action={action} className="portal-card flex flex-col p-4 transition hover:border-[#1b4d38]">
                    <input type="hidden" name="participantId" value={p.id} />
                    {next && <input type="hidden" name="next" value={next} />}
                    {oneClickPassword != null && <input type="hidden" name="password" value={oneClickPassword} />}

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          approved ? "bg-[#1b4d38] text-white" : "bg-[var(--paper)] text-[var(--ink-soft)]"
                        }`}
                      >
                        {step}
                      </span>
                      <span className="eyebrow">{ROLE_SHORT[p.role]}</span>
                    </div>

                    <p className="font-display mt-2 text-lg leading-tight text-[var(--ink)]">{p.legalName}</p>
                    <p className="text-sm text-[var(--ink-muted)]">
                      {p.category ? CATEGORY_LABEL[p.category] : "Authorised agency user"}
                    </p>
                    <p className="mt-0.5 text-xs tabular-nums text-[var(--ink-soft)]">
                      {p.regNo ?? (approved ? "No registration number required" : "Application pending")}
                    </p>

                    <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--ink-muted)]">{blurb(p)}</p>

                    {money && approved && (
                      <p className="mt-3 rounded-md bg-[#1b4d38]/[0.08] px-2.5 py-1.5 text-xs font-semibold text-[#1b4d38]">
                        {money}
                      </p>
                    )}
                    {!approved && (
                      <p className="mt-3 rounded-md bg-[var(--copper)]/[0.1] px-2.5 py-1.5 text-xs font-semibold text-[var(--copper)]">
                        No guaranteed coefficient until approved
                      </p>
                    )}

                    {oneClickPassword == null && (
                      <label className="mt-3 block">
                        <span className={labelClass}>Password</span>
                        <input type="password" name="password" required className={`${inputClass} mt-1`} />
                      </label>
                    )}

                    <ActionButton
                      tone={approved ? "primary" : "secondary"}
                      className="mt-4 w-full"
                      disabled={pending}
                      pendingText="Opening…"
                    >
                      {approved ? cta(p) : "Pending approval"}
                    </ActionButton>
                  </form>
                );
              })}
            </div>
          </div>
        );
      })}
      {state?.error && (
        <p className="text-sm text-[#9b2c2c]" role="alert">
          {state.error}
        </p>
      )}
    </div>
  );
}
