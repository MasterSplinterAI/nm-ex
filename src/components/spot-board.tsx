"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TinDesk } from "@/components/tin-desk";
import { MINERALS } from "@/lib/minerals";
import type { MineralQuote, MineralSlug, SpotBoard, TinPolicy } from "@/lib/types";
import {
  formatAsOf,
  formatFxRate,
  formatNgn,
  formatUsd,
  toNgn,
} from "@/lib/format";

type Props = {
  board: SpotBoard;
  policy: TinPolicy;
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

function slugFromHash(): MineralSlug | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace("#", "");
  if (hash === "tin" || hash === "concentrate") return "tin";
  return null;
}

export function SpotBoardSection({ board, policy }: Props) {
  const [expandedSlug, setExpandedSlug] = useState<MineralSlug | null>(null);

  useEffect(() => {
    const applyHash = () => {
      const fromHash = slugFromHash();
      if (fromHash) setExpandedSlug(fromHash);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  function toggle(slug: MineralSlug) {
    setExpandedSlug((current) => (current === slug ? null : slug));
  }

  return (
    <section
      id="spot"
      className="relative scroll-mt-8 border-t border-[var(--line)] bg-[var(--paper)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-10 sm:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--forest)] sm:text-base">
              Spot board
            </h2>
            <p className="mt-2 max-w-lg text-sm text-[var(--ink-muted)] sm:text-base">
              Open a row for details. Tin includes tin concentrate procurement.
            </p>
          </div>
          <div className="text-sm text-[var(--ink-muted)] sm:text-right">
            <p>
              USD/NGN{" "}
              <span className="font-semibold text-[var(--ink)]">
                {formatFxRate(board.fx.rate)}
              </span>
            </p>
            <p className="mt-1 text-xs sm:text-sm">
              As of {formatAsOf(board.updatedAt)} WAT · {board.fx.source}
            </p>
          </div>
        </div>

        <ul className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)] sm:mt-8">
          {board.minerals.map((mineral) => {
            const open = expandedSlug === mineral.slug;
            const labels = labelsFor(mineral.slug);
            const precise = isPrecise(mineral.slug);
            const isTin = mineral.slug === "tin";

            return (
              <li
                key={mineral.slug}
                id={isTin ? "tin" : undefined}
                className={open ? "tin-panel" : undefined}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  aria-label={`${open ? "Hide" : "View"} ${mineral.name} details`}
                  onClick={() => toggle(mineral.slug)}
                  className="w-full cursor-pointer touch-manipulation px-1 py-4 text-left transition hover:bg-[var(--ink)]/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--forest)] sm:px-3 sm:py-6"
                >
                  <div className="flex items-start justify-between gap-3 sm:items-center sm:gap-4">
                    <div className="min-w-0">
                      <p
                        className={`font-display tracking-tight text-[var(--ink)] ${
                          open ? "text-2xl sm:text-4xl" : "text-xl sm:text-2xl"
                        }`}
                      >
                        {mineral.name}
                        <span className="ml-2 align-middle text-sm font-sans font-medium text-[var(--ink-muted)]">
                          {mineral.symbol}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-[var(--ink-muted)] sm:text-sm">
                        {mineral.spec ? `${mineral.spec} · ` : ""}
                        {mineral.unit}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <StatusPill status={mineral.status} />
                      {!open && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-[var(--ink)] sm:text-base">
                            {formatNgn(toNgn(mineral.lastUsd, board.fx.rate))}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--ink-muted)] sm:text-sm">
                            {formatUsd(mineral.lastUsd, precise)}
                          </p>
                        </div>
                      )}
                      <span
                        className={`mt-0.5 inline-flex min-h-8 items-center gap-1.5 border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                          open
                            ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                            : "border-[var(--line)] bg-white text-[var(--ink)]"
                        }`}
                      >
                        {open ? "Hide details" : "View details"}
                        <span
                          className={`text-[10px] leading-none ${
                            open ? "rotate-180" : ""
                          }`}
                          aria-hidden
                        >
                          ▾
                        </span>
                      </span>
                    </div>
                  </div>
                </button>

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
                      {isTin ? (
                        <div className="px-1 pb-5 sm:px-3 sm:pb-8">
                          <TinDesk
                            tin={mineral}
                            fxRate={board.fx.rate}
                            policy={policy}
                          />
                        </div>
                      ) : (
                        <div className="px-1 pb-5 sm:px-3 sm:pb-8">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                            Last
                          </p>
                          <p className="mt-1 font-display text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
                            {formatNgn(toNgn(mineral.lastUsd, board.fx.rate))}
                          </p>
                          <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
                            {formatUsd(mineral.lastUsd, precise)}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--ink-muted)]">
                            <span>
                              <span className="text-[10px] uppercase tracking-[0.14em]">
                                {labels.open}{" "}
                              </span>
                              {formatNgn(toNgn(mineral.openUsd, board.fx.rate))}
                              <span className="text-[var(--ink-muted)]/70">
                                {" "}
                                {formatUsd(mineral.openUsd, precise)}
                              </span>
                            </span>
                            <span>
                              <span className="text-[10px] uppercase tracking-[0.14em]">
                                {labels.close}{" "}
                              </span>
                              {formatNgn(toNgn(mineral.closeUsd, board.fx.rate))}
                              <span className="text-[var(--ink-muted)]/70">
                                {" "}
                                {formatUsd(mineral.closeUsd, precise)}
                              </span>
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function StatusPill({ status }: { status: "live" | "stale" | "pending" }) {
  const label =
    status === "live" ? "Live" : status === "stale" ? "Cached" : "Pending";
  return (
    <span
      className={`inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] sm:text-xs ${
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
