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
  const [expandedSlug, setExpandedSlug] = useState<MineralSlug>("tin");

  const expanded =
    board.minerals.find((m) => m.slug === expandedSlug) ?? board.minerals[0];
  const collapsed = board.minerals.filter((m) => m.slug !== expanded?.slug);

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
              Select a mineral to expand. Naira first, dollars beneath.
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

        <AnimatePresence mode="wait">
          {expanded && (
            <motion.article
              key={expanded.slug}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="tin-panel mt-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--forest)]">
                    {expanded.slug === "tin" ? "Primary export" : "Selected"}
                  </p>
                  <h3 className="mt-2 font-display text-4xl text-[var(--ink)] sm:text-5xl">
                    {expanded.name}
                    <span className="ml-3 align-middle text-lg font-sans font-medium text-[var(--ink-muted)]">
                      {expanded.symbol}
                    </span>
                  </h3>
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">
                    {expanded.unit}
                  </p>
                </div>
                <StatusPill status={expanded.status} />
              </div>

              <div className="mt-10 grid gap-8 sm:grid-cols-3">
                {(() => {
                  const labels = labelsFor(expanded.slug);
                  const precise = isPrecise(expanded.slug);
                  return (
                    <>
                      <PriceBlock
                        label={labels.open}
                        usd={expanded.openUsd}
                        ngn={toNgn(expanded.openUsd, board.fx.rate)}
                        precise={precise}
                      />
                      <PriceBlock
                        label={labels.last}
                        usd={expanded.lastUsd}
                        ngn={toNgn(expanded.lastUsd, board.fx.rate)}
                        precise={precise}
                        emphasize
                      />
                      <PriceBlock
                        label={labels.close}
                        usd={expanded.closeUsd}
                        ngn={toNgn(expanded.closeUsd, board.fx.rate)}
                        precise={precise}
                      />
                    </>
                  );
                })()}
              </div>
            </motion.article>
          )}
        </AnimatePresence>

        <div className="mt-10">
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-4 border-b border-[var(--line)] pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)] sm:grid">
            <span>Mineral</span>
            <span>Open / Low</span>
            <span>Last</span>
            <span>Close / High</span>
            <span className="text-right">Status</span>
          </div>

          <ul className="divide-y divide-[var(--line)]">
            {collapsed.map((mineral, index) => {
              const range = isRangeQuote(mineral.slug);
              const precise = isPrecise(mineral.slug);
              return (
                <motion.li
                  key={mineral.slug}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.03,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedSlug(mineral.slug)}
                    className="grid w-full cursor-pointer gap-4 py-7 text-left transition hover:bg-[var(--ink)]/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forest)] sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto] sm:items-center"
                  >
                    <div>
                      <p className="font-display text-2xl text-[var(--ink)]">
                        {mineral.name}
                      </p>
                      <p className="mt-1 text-sm text-[var(--ink-muted)]">
                        {mineral.symbol} · {mineral.unit}
                      </p>
                    </div>
                    <QuoteCell
                      label={range ? "Low" : "Open"}
                      usd={mineral.openUsd}
                      ngn={toNgn(mineral.openUsd, board.fx.rate)}
                      precise={precise}
                    />
                    <QuoteCell
                      label={range ? "Spot" : "Last"}
                      usd={mineral.lastUsd}
                      ngn={toNgn(mineral.lastUsd, board.fx.rate)}
                      precise={precise}
                      emphasize
                    />
                    <QuoteCell
                      label={range ? "High" : "Close"}
                      usd={mineral.closeUsd}
                      ngn={toNgn(mineral.closeUsd, board.fx.rate)}
                      precise={precise}
                    />
                    <div className="sm:justify-self-end">
                      <StatusPill status={mineral.status} />
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </div>
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
          emphasize ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"
        }`}
      >
        {formatNgn(ngn)}
      </p>
      <p
        className={`mt-2 font-medium text-[var(--ink-muted)] ${
          emphasize ? "text-lg sm:text-xl" : "text-base sm:text-lg"
        }`}
      >
        {formatUsd(usd, precise)}
      </p>
    </div>
  );
}

function QuoteCell({
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
      <p className="mb-1 text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)] sm:hidden">
        {label}
      </p>
      <p
        className={`font-medium text-[var(--ink)] ${
          emphasize ? "text-lg" : "text-base"
        }`}
      >
        {formatNgn(ngn)}
      </p>
      <p
        className={`mt-1 text-[var(--ink-muted)] ${
          emphasize ? "text-base" : "text-[0.95rem]"
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
