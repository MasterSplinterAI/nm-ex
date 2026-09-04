import type { DmoPolicy } from "./types";

export const DEFAULT_DMO_POLICY: DmoPolicy = {
  coefMinerToAggregator: 0.7,
  coefToSmelter: 0.725,
  ompCoefficient: null,
  royaltyPct: 7.5,
  vatPct: 7.5,
  recoveryPct: 95,
  mmlTier1Kg: 1000,
  mmlTier2Kg: 2000,
  tier1MinGradePct: 50,
  sampleWindowHours: 48,
  offerPeriodDays: 5,
  paymentWindowDays: 5,
  requiredDocuments: {
    tin_shed: [
      "Mineral Buying Centre licence / certificate",
      "Approval documentation",
      "Tax Clearance Certificate (current)",
      "CAC registration",
    ],
    mining_company: [
      "Mining title / licence",
      "Minimum work programme documentation",
      "EIA / environmental audit documentation",
      "Mines Inspectorate submissions / letters",
      "Tax Clearance Certificate (current)",
    ],
    aggregator: [
      "Licence / authority to purchase and possess minerals",
      "Tax Clearance Certificate (current)",
      "CAC registration",
    ],
    smelter: [
      "Mineral processing licence",
      "Operating permits",
      "Tax Clearance Certificate (current)",
      "CAC registration",
    ],
    end_user: [
      "CAC registration",
      "Tax Clearance Certificate (current)",
      "Description of industrial use",
    ],
  },
  warehouses: [
    "NM-EX Approved Warehouse & Assay Centre — Jos",
    "NM-EX Approved Warehouse & Assay Centre — Lafia",
  ],
};

export function tierForGrade(gradePct: number, policy: DmoPolicy): 1 | 2 {
  return gradePct > policy.tier1MinGradePct ? 1 : 2;
}

export function mmlKgFor(gradePct: number, policy: DmoPolicy): number {
  return tierForGrade(gradePct, policy) === 1
    ? policy.mmlTier1Kg
    : policy.mmlTier2Kg;
}

export function mmlKgForTier(tier: 1 | 2, policy: DmoPolicy): number {
  return tier === 1 ? policy.mmlTier1Kg : policy.mmlTier2Kg;
}
