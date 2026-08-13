"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MineralQuote, TinPolicy } from "@/lib/types";
import {
  clampAssay,
  concentrateProcurementUsd,
  royaltyUsd,
} from "@/lib/policy";
import {
  formatNgn,
  formatPct,
  formatUsd,
  toNgn,
} from "@/lib/format";

const FLOW = [
  "LME Price",
  "NM-EX Benchmark",
  "Assay",
  "Procurement Value",
  "Smelting",
  "Government Royalty",
  "Refined Tin",
] as const;

type Props = {
  tin: MineralQuote;
  fxRate: number;
  policy: TinPolicy;
};

export function TinDesk({ tin, fxRate, policy }: Props) {
  const [assayPct, setAssayPct] = useState(policy.defaultAssayPct);
  const [purityOpen, setPurityOpen] = useState(false);

  const assay = clampAssay(assayPct, policy);
  const lme = tin.lastUsd;
  const procurement = concentrateProcurementUsd(
    lme,
    policy.benchmarkPct,
    assay,
  );
  const royalty = royaltyUsd(procurement, policy.royaltyPct);
  const purityChanged = assay !== policy.defaultAssayPct;

  const formula = useMemo(
    () =>
      `LME × ${formatPct(policy.benchmarkPct, 1)} NM-EX × ${formatPct(assay, 1)} Sn`,
    [policy.benchmarkPct, assay],
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--forest)] sm:text-xs">
          International benchmark · {tin.spec ?? "99.9% Sn"}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-8">
          <PriceBlock
            label="Open"
            usd={tin.openUsd}
            ngn={toNgn(tin.openUsd, fxRate)}
          />
          <PriceBlock
            label="Last"
            usd={tin.lastUsd}
            ngn={toNgn(tin.lastUsd, fxRate)}
            emphasize
          />
          <PriceBlock
            label="Close"
            usd={tin.closeUsd}
            ngn={toNgn(tin.closeUsd, fxRate)}
          />
        </div>
      </div>

      <article
        id="concentrate"
        className="border border-[var(--line)] bg-white/55 px-3 py-4 sm:px-6 sm:py-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--forest)] sm:text-xs">
              NM-EX Nigerian procurement
            </p>
            <h3 className="mt-1 font-display text-2xl tracking-tight text-[var(--ink)] sm:text-3xl">
              Cassiterite
            </h3>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Tin concentrate · {policy.concentrateSpec}
              {purityChanged ? ` · showing ${formatPct(assay, 1)} Sn` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>
              NM-EX {formatPct(policy.benchmarkPct, 1)} of LME
            </Badge>
            <Badge tone="copper">
              Royalty {formatPct(policy.royaltyPct, 1)}
            </Badge>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Indicative USD / t
            </p>
            <p className="mt-2 font-display text-2xl tracking-tight text-[var(--ink)] sm:text-3xl">
              {formatUsd(procurement)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Indicative ₦ / t
            </p>
            <p className="mt-2 font-display text-2xl tracking-tight text-[var(--ink)] sm:text-3xl">
              {formatNgn(toNgn(procurement, fxRate))}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-[var(--ink-muted)] sm:text-sm">
          {formula}
        </p>

        <div className="mt-4 flex flex-col gap-2 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--copper)]">
            Government royalty · {formatPct(policy.royaltyPct, 1)}
          </p>
          <div className="sm:text-right">
            <p className="font-display text-lg text-[var(--ink)] sm:text-xl">
              {formatNgn(toNgn(royalty, fxRate))}
            </p>
            <p className="text-xs text-[var(--ink-muted)] sm:text-sm">
              {formatUsd(royalty)}
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-expanded={purityOpen}
          onClick={() => setPurityOpen((open) => !open)}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-between border border-[var(--ink)]/15 bg-white px-4 py-3 text-left text-sm font-semibold text-[var(--ink)] touch-manipulation sm:w-auto sm:min-w-[16rem]"
        >
          <span>{purityOpen ? "Hide purity" : "Adjust purity"}</span>
          <span
            className={`ml-6 text-xs text-[var(--ink-muted)] transition ${
              purityOpen ? "rotate-180" : ""
            }`}
            aria-hidden
          >
            ▾
          </span>
        </button>

        <AnimatePresence initial={false}>
          {purityOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <label className="mt-4 block">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  Seller assay · % Sn
                </span>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="range"
                    min={policy.minAssayPct}
                    max={policy.maxAssayPct}
                    step={0.5}
                    value={assay}
                    onChange={(event) =>
                      setAssayPct(Number.parseFloat(event.target.value))
                    }
                    className="h-11 w-full accent-[var(--forest)]"
                    aria-label="Tin assay percent"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    min={policy.minAssayPct}
                    max={policy.maxAssayPct}
                    step={0.5}
                    value={assay}
                    onChange={(event) => {
                      const next = Number.parseFloat(event.target.value);
                      if (Number.isFinite(next)) setAssayPct(next);
                    }}
                    className="h-11 w-[4.75rem] shrink-0 border border-[var(--line)] bg-white px-2 text-center text-base font-semibold text-[var(--ink)]"
                    aria-label="Tin assay percent numeric"
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  {policy.minAssayPct}–{policy.maxAssayPct}% · default{" "}
                  {formatPct(policy.defaultAssayPct, 0)}
                </p>
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </article>

      <ol className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {FLOW.map((step, index) => (
          <li key={step} className="flex shrink-0 items-center gap-2">
            <span className="border border-[var(--line)] bg-white/70 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] sm:text-xs">
              {step}
            </span>
            {index < FLOW.length - 1 && (
              <span className="text-[var(--ink-muted)]" aria-hidden>
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Badge({
  children,
  tone = "forest",
}: {
  children: ReactNode;
  tone?: "forest" | "copper";
}) {
  const color =
    tone === "copper"
      ? "text-[var(--copper)] border-[var(--copper)]/30"
      : "text-[var(--forest)] border-[var(--forest)]/25";
  return (
    <span
      className={`inline-flex items-center border bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-xs ${color}`}
    >
      {children}
    </span>
  );
}

function PriceBlock({
  label,
  usd,
  ngn,
  emphasize = false,
}: {
  label: string;
  usd: number | null;
  ngn: number | null;
  emphasize?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {label}
      </p>
      <p
        className={`mt-1.5 font-display tracking-tight text-[var(--ink)] ${
          emphasize ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
        }`}
      >
        {formatNgn(ngn)}
      </p>
      <p
        className={`mt-1 font-medium text-[var(--ink-muted)] ${
          emphasize ? "text-base sm:text-lg" : "text-sm sm:text-base"
        }`}
      >
        {formatUsd(usd)}
      </p>
    </div>
  );
}
