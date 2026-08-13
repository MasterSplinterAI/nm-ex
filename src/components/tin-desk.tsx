"use client";

import { useMemo, useState, type ReactNode } from "react";
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

  const assay = clampAssay(assayPct, policy);
  const lme = tin.lastUsd;
  const procurement = concentrateProcurementUsd(
    lme,
    policy.benchmarkPct,
    assay,
  );
  const royalty = royaltyUsd(procurement, policy.royaltyPct);

  const formula = useMemo(
    () =>
      `LME × ${formatPct(policy.benchmarkPct, 1)} NM-EX × ${formatPct(assay, 1)} Sn`,
    [policy.benchmarkPct, assay],
  );

  return (
    <section id="tin" className="scroll-mt-20">
      <article className="tin-panel px-4 py-5 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--forest)] sm:text-xs">
              International benchmark
            </p>
            <h3 className="mt-1 font-display text-3xl tracking-tight text-[var(--ink)] sm:text-5xl">
              Refined tin
              <span className="ml-2 align-middle text-base font-sans font-medium text-[var(--ink-muted)] sm:text-lg">
                {tin.spec ?? "99.9% Sn"}
              </span>
            </h3>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              LME-linked 3-month tin · {tin.unit}
            </p>
          </div>
          <StatusPill status={tin.status} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-3 sm:gap-8">
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
      </article>

      <article
        id="concentrate"
        className="mt-4 border border-[var(--line)] bg-white/55 px-4 py-5 sm:mt-6 sm:px-8 sm:py-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--forest)] sm:text-xs">
              NM-EX Nigerian procurement benchmark
            </p>
            <h3 className="mt-1 font-display text-2xl tracking-tight text-[var(--ink)] sm:text-4xl">
              Nigerian tin concentrate
            </h3>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Cassiterite · reference grade {policy.concentrateSpec}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>
              NM-EX benchmark {formatPct(policy.benchmarkPct, 1)} of LME
            </Badge>
            <Badge tone="copper">
              Government royalty {formatPct(policy.royaltyPct, 1)}
            </Badge>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[var(--ink-muted)]">
          Procurement price = {formula}. Benchmark is set centrally and shown
          for transparency; assay is the actual Sn grade of the parcel.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <label className="block">
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
              Adjustable {policy.minAssayPct}–{policy.maxAssayPct}% · default{" "}
              {formatPct(policy.defaultAssayPct, 0)}
            </p>
          </label>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
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
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--copper)]">
              Government royalty · {formatPct(policy.royaltyPct, 1)}
            </p>
            <p className="mt-1 max-w-md text-sm text-[var(--ink-muted)]">
              Indicative fiscal take on this procurement — shown separately so
              pricing and government revenue stay visible on the same board.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="font-display text-xl text-[var(--ink)] sm:text-2xl">
              {formatNgn(toNgn(royalty, fxRate))}
            </p>
            <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
              {formatUsd(royalty)}
            </p>
          </div>
        </div>
      </article>

      <ol className="mt-4 flex gap-2 overflow-x-auto pb-2 sm:mt-6 sm:flex-wrap sm:overflow-visible">
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
    </section>
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
    tone === "copper" ? "text-[var(--copper)] border-[var(--copper)]/30" : "text-[var(--forest)] border-[var(--forest)]/25";
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

function StatusPill({ status }: { status: "live" | "stale" | "pending" }) {
  const label =
    status === "live" ? "Live" : status === "stale" ? "Cached" : "Pending";
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] ${
        status === "live"
          ? "text-[var(--forest)]"
          : status === "stale"
            ? "text-[var(--copper)]"
            : "text-[var(--ink-muted)]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 ${
          status === "live"
            ? "bg-[var(--forest)]"
            : status === "stale"
              ? "bg-[var(--copper)]"
              : "bg-[var(--ink-muted)]"
        }`}
      />
      {label}
    </span>
  );
}
