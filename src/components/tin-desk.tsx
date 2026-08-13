"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MineralQuote, TinPolicy } from "@/lib/types";
import {
  burdenedUsd,
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
  const royaltyRate = policy.royaltyPct;
  const lme = tin.lastUsd;
  const procurement = concentrateProcurementUsd(
    lme,
    policy.benchmarkPct,
    assay,
  );
  const concentrateRoyalty = royaltyUsd(procurement, royaltyRate);
  const concentrateBurdened = burdenedUsd(procurement, royaltyRate);
  const refinedRoyalty = royaltyUsd(lme, royaltyRate);
  const refinedBurdened = burdenedUsd(lme, royaltyRate);
  const purityChanged = assay !== policy.defaultAssayPct;

  const formula = useMemo(
    () =>
      `LME × ${formatPct(policy.benchmarkPct, 1)} NM-EX × ${formatPct(assay, 1)} Sn`,
    [policy.benchmarkPct, assay],
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--forest)]">
          {tin.spec ?? "99.9% Sn"} · LME
        </p>
        <HeroQuote
          label="Last"
          usd={lme}
          ngn={toNgn(lme, fxRate)}
        />
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--ink-muted)]">
          <QuietQuote label="Open" usd={tin.openUsd} ngn={toNgn(tin.openUsd, fxRate)} />
          <QuietQuote label="Close" usd={tin.closeUsd} ngn={toNgn(tin.closeUsd, fxRate)} />
        </div>
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--copper)]">
            Burdened · last + {formatPct(royaltyRate, 1)} royalty
          </p>
          <p className="mt-1 font-display text-2xl tracking-tight text-[var(--ink)] sm:text-[1.75rem]">
            {formatNgn(toNgn(refinedBurdened, fxRate))}
          </p>
          <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
            {formatUsd(refinedBurdened)}
            <span className="mx-1.5 text-[var(--line)]">·</span>
            royalty {formatUsd(refinedRoyalty)}
          </p>
        </div>
      </div>

      <article
        id="concentrate"
        className="border border-[var(--line)] bg-white/55 px-3 py-4 sm:px-6 sm:py-5"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--forest)]">
              NM-EX procurement
            </p>
            <h3 className="mt-1 font-display text-xl tracking-tight text-[var(--ink)] sm:text-2xl">
              Cassiterite
              <span className="ml-2 align-middle text-sm font-sans font-medium text-[var(--ink-muted)]">
                {policy.concentrateSpec}
                {purityChanged ? ` → ${formatPct(assay, 1)}` : ""}
              </span>
            </h3>
          </div>
          <p className="text-xs text-[var(--ink-muted)]">
            Benchmark {formatPct(policy.benchmarkPct, 1)} of LME
          </p>
        </div>

        <HeroQuote
          label="Indicative"
          usd={procurement}
          ngn={toNgn(procurement, fxRate)}
        />
        <p className="mt-1 text-xs text-[var(--ink-muted)]">{formula}</p>

        <div className="mt-4 border-t border-[var(--line)] pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--copper)]">
            Burdened export · cost + {formatPct(royaltyRate, 1)} royalty
          </p>
          <p className="mt-1 font-display text-2xl tracking-tight text-[var(--ink)] sm:text-[1.75rem]">
            {formatNgn(toNgn(concentrateBurdened, fxRate))}
          </p>
          <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
            {formatUsd(concentrateBurdened)}
            <span className="mx-1.5 text-[var(--line)]">·</span>
            royalty {formatUsd(concentrateRoyalty)}
          </p>
        </div>

        <button
          type="button"
          aria-expanded={purityOpen}
          onClick={() => setPurityOpen((open) => !open)}
          className="mt-4 inline-flex min-h-10 w-full items-center justify-between border border-[var(--ink)]/12 bg-white px-3 py-2.5 text-left text-sm text-[var(--ink)] touch-manipulation sm:w-auto sm:min-w-[14rem]"
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
              <label className="mt-3 block">
                <span className="text-xs text-[var(--ink-muted)]">
                  Seller assay · % Sn
                </span>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="range"
                    min={policy.minAssayPct}
                    max={policy.maxAssayPct}
                    step={0.5}
                    value={assay}
                    onChange={(event) =>
                      setAssayPct(Number.parseFloat(event.target.value))
                    }
                    className="h-10 w-full accent-[var(--forest)]"
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
                    className="h-10 w-[4.25rem] shrink-0 border border-[var(--line)] bg-white px-2 text-center text-sm text-[var(--ink)]"
                    aria-label="Tin assay percent numeric"
                  />
                </div>
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </article>

      <ol className="flex gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {FLOW.map((step, index) => (
          <li key={step} className="flex shrink-0 items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              {step}
            </span>
            {index < FLOW.length - 1 && (
              <span className="text-[var(--ink-muted)]/50" aria-hidden>
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function HeroQuote({
  label,
  usd,
  ngn,
}: {
  label: string;
  usd: number | null;
  ngn: number | null;
}) {
  return (
    <div className="mt-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
        {formatNgn(ngn)}
      </p>
      <p className="mt-0.5 text-sm text-[var(--ink-muted)]">{formatUsd(usd)}</p>
    </div>
  );
}

function QuietQuote({
  label,
  usd,
  ngn,
}: {
  label: string;
  usd: number | null;
  ngn: number | null;
}) {
  return (
    <span>
      <span className="text-[10px] uppercase tracking-[0.14em]">{label} </span>
      {formatNgn(ngn)}
      <span className="text-[var(--ink-muted)]/70"> {formatUsd(usd)}</span>
    </span>
  );
}
