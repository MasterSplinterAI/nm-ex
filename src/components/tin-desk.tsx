"use client";

import { useMemo, useState } from "react";
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
  "Refined Tin",
  "Government Royalty",
] as const;

type Props = {
  tin: MineralQuote;
  fxRate: number;
  policy: TinPolicy;
};

export function TinDesk({ tin, fxRate, policy }: Props) {
  const [assayPct, setAssayPct] = useState(policy.defaultAssayPct);

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
        <InclRoyalty
          rate={royaltyRate}
          burdenedUsd={refinedBurdened}
          royaltyAmountUsd={refinedRoyalty}
          fxRate={fxRate}
        />
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

        <label className="mt-4 block">
          <span className="text-sm font-medium text-[var(--ink)]">
            Cassiterite purity · % Sn
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

        <HeroQuote
          label="Indicative"
          usd={procurement}
          ngn={toNgn(procurement, fxRate)}
        />
        <p className="mt-1 text-xs text-[var(--ink-muted)]">{formula}</p>

        <InclRoyalty
          rate={royaltyRate}
          burdenedUsd={concentrateBurdened}
          royaltyAmountUsd={concentrateRoyalty}
          fxRate={fxRate}
          caption="Burdened export"
        />
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

function InclRoyalty({
  rate,
  burdenedUsd,
  royaltyAmountUsd,
  fxRate,
  caption = "Including government royalty",
}: {
  rate: number;
  burdenedUsd: number | null;
  royaltyAmountUsd: number | null;
  fxRate: number;
  caption?: string;
}) {
  return (
    <div className="mt-4 border border-[var(--copper)]/30 bg-[rgb(143_106_69/0.07)] px-3 py-3 sm:px-4 sm:py-4">
      <p className="text-sm font-semibold text-[var(--copper)] sm:text-base">
        {caption} · {formatPct(rate, 1)}
      </p>
      <p className="mt-1 font-display text-2xl tracking-tight text-[var(--ink)] sm:text-3xl">
        {formatNgn(toNgn(burdenedUsd, fxRate))}
      </p>
      <p className="mt-0.5 text-base text-[var(--ink)]">
        {formatUsd(burdenedUsd)}
      </p>
      <p className="mt-2 text-sm text-[var(--ink)] sm:text-base">
        Royalty {formatNgn(toNgn(royaltyAmountUsd, fxRate))}
        <span className="text-[var(--ink-muted)]">
          {" "}
          · {formatUsd(royaltyAmountUsd)}
        </span>
      </p>
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
