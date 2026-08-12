"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MINERALS } from "@/lib/minerals";
import type { MineralQuote, MineralSlug, SpotBoard } from "@/lib/types";
import {
  formatAsOf,
  formatFxRate,
  formatNgn,
  formatUsd,
  toNgn,
} from "@/lib/format";

type Props = {
  board: SpotBoard;
};

function isPrecise(slug: MineralQuote["slug"]): boolean {
  return MINERALS.find((m) => m.slug === slug)?.precise === true;
}

function isRangeQuote(slug: MineralQuote["slug"]): boolean {
  return MINERALS.find((m) => m.slug === slug)?.scrapeKind === "smm-table";
}

function labelsFor(slug: MineralQuote["slug"]) {
  if (isRangeQuote(slug)) {
    return { open: "Low", last: "Spot", close: "High" } as const;
  }
  return { open: "Open", last: "Last", close: "Close" } as const;
}

export function SpotBoardSection({ board }: Props) {
  const [expandedSlug, setExpandedSlug] = useState<MineralSlug | null>("tin");

  function toggle(slug: MineralSlug) {
    setExpandedSlug((current) => (current === slug ? null : slug));
  }

  return (
    <section
      id="spot"
      className="relative scroll-mt-8 border-t border-[var(--line)] bg-[var(--paper)]"
    >
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10 sm:py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--forest)]">
              Spot board
            </p>
            <h2 className="mt-3 font-display text-4xl tracking-tight text-[var(--ink)] sm:text-5xl">
              Open · Last · Close
            </h2>
            <p className="mt-3 max-w-lg text-[var(--ink-muted)]">
              Tap a mineral to expand prices in naira and US dollars.
            </p>
          </div>
          <div className="text-sm text-[var(--ink-muted)] sm:text-right">
            <p>
              USD/NGN{" "}
              <span className="font-semibold text-[var(--ink)]">
                {formatFxRate(board.fx.rate)}
              </span>
            </p>
            <p className="mt-1">
              As of {formatAsOf(board.updatedAt)} WAT · {board.fx.source}
            </p>
          </div>
        </div>

        <ul className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {board.minerals.map((mineral) => {
            const open = expandedSlug === mineral.slug;
            const labels = labelsFor(mineral.slug);
            const precise = isPrecise(mineral.slug);

            return (
              <li key={mineral.slug}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => toggle(mineral.slug)}
                  className={`w-full cursor-pointer text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--forest)] ${
                    open
                      ? "tin-panel px-0 sm:px-6"
                      : "hover:bg-[var(--ink)]/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 py-5 sm:items-center sm:py-6">
                    <div className="min-w-0">
                      {mineral.slug === "tin" && (
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--forest)]">
                          Primary export
                        </p>
                      )}
                      <p
                        className={`font-display tracking-tight text-[var(--ink)] ${
                          open ? "text-3xl sm:text-4xl" : "text-2xl"
                        }`}
                      >
                        {mineral.name}
                        <span className="ml-2 align-middle text-sm font-sans font-medium text-[var(--ink-muted)] sm:text-base">
                          {mineral.symbol}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-[var(--ink-muted)]">
                        {mineral.unit}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <StatusPill status={mineral.status} />
                      {!open && (
                        <div className="text-right">
                          <p className="font-medium text-[var(--ink)]">
                            {formatNgn(toNgn(mineral.lastUsd, board.fx.rate))}
                          </p>
                          <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
                            {formatUsd(mineral.lastUsd, precise)}
                          </p>
                        </div>
                      )}
                      <span
                        className={`text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)] transition ${
                          open ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      >
                        ▾
                      </span>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="grid gap-6 pb-6 sm:grid-cols-3 sm:gap-8 sm:pb-8">
                          <PriceBlock
                            label={labels.open}
                            usd={mineral.openUsd}
                            ngn={toNgn(mineral.openUsd, board.fx.rate)}
                            precise={precise}
                          />
                          <PriceBlock
                            label={labels.last}
                            usd={mineral.lastUsd}
                            ngn={toNgn(mineral.lastUsd, board.fx.rate)}
                            precise={precise}
                            emphasize
                          />
                          <PriceBlock
                            label={labels.close}
                            usd={mineral.closeUsd}
                            ngn={toNgn(mineral.closeUsd, board.fx.rate)}
                            precise={precise}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function PriceBlock({
  label,
  usd,
  ngn,
  precise = false,
  emphasize = false,
}: {
  label: string;
  usd: number | null;
  ngn: number | null;
  precise?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {label}
      </p>
      <p
        className={`mt-2 font-display tracking-tight text-[var(--ink)] ${
          emphasize ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
        }`}
      >
        {formatNgn(ngn)}
      </p>
      <p
        className={`mt-2 font-medium text-[var(--ink-muted)] ${
          emphasize ? "text-base sm:text-lg" : "text-sm sm:text-base"
        }`}
      >
        {formatUsd(usd, precise)}
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
