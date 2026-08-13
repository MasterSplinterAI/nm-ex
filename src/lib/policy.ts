import type { TinPolicy } from "./types";

export const DEFAULT_TIN_POLICY: TinPolicy = {
  refinedSpec: "99.9% Sn",
  concentrateSpec: "70% Sn",
  benchmarkPct: 70,
  defaultAssayPct: 70,
  minAssayPct: 50,
  maxAssayPct: 80,
  royaltyPct: 7.5,
};

function pctFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function policyFromEnv(base: TinPolicy = DEFAULT_TIN_POLICY): TinPolicy {
  return {
    ...base,
    benchmarkPct: pctFromEnv("TIN_BENCHMARK_PCT", base.benchmarkPct),
    royaltyPct: pctFromEnv("GOVERNMENT_ROYALTY_PCT", base.royaltyPct),
    defaultAssayPct: pctFromEnv("TIN_DEFAULT_ASSAY_PCT", base.defaultAssayPct),
  };
}

export function clampAssay(assayPct: number, policy: TinPolicy): number {
  return Math.min(policy.maxAssayPct, Math.max(policy.minAssayPct, assayPct));
}

/**
 * NM-EX concentrate procurement:
 * LME tin × NM-EX benchmark % × actual Sn assay %.
 */
export function concentrateProcurementUsd(
  lmeUsd: number | null,
  benchmarkPct: number,
  assayPct: number,
): number | null {
  if (lmeUsd == null || !Number.isFinite(lmeUsd)) return null;
  return lmeUsd * (benchmarkPct / 100) * (assayPct / 100);
}

export function royaltyUsd(
  procurementUsd: number | null,
  royaltyPct: number,
): number | null {
  if (procurementUsd == null) return null;
  return procurementUsd * (royaltyPct / 100);
}
