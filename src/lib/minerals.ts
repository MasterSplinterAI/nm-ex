import type { MineralQuote, MineralSlug } from "./types";

export type MineralDefinition = {
  slug: MineralSlug;
  name: string;
  symbol: string;
  unit: string;
  rank: number;
  sourceUrl: string;
  scrapeKind: "metal-com-lme" | "smm-table";
  /** For smm-table: visible row label on the SMM price page */
  tableLabel?: string;
  minUsd: number;
  maxUsd: number;
  /** Show cents in the board */
  precise?: boolean;
};

/**
 * Board catalog — Tin first (Nigeria primary), then core LME + gold/tantalite.
 */
export const MINERALS: MineralDefinition[] = [
  {
    slug: "tin",
    name: "Tin",
    symbol: "Sn",
    unit: "USD / tonne",
    rank: 1,
    sourceUrl: "https://www-old.metal.com/Tin/LME_SN_3M",
    scrapeKind: "metal-com-lme",
    minUsd: 15_000,
    maxUsd: 60_000,
  },
  {
    slug: "copper",
    name: "Copper",
    symbol: "Cu",
    unit: "USD / tonne",
    rank: 2,
    sourceUrl: "https://www-old.metal.com/Copper/LME_CA_3M",
    scrapeKind: "metal-com-lme",
    minUsd: 5_000,
    maxUsd: 20_000,
  },
  {
    slug: "aluminum",
    name: "Aluminum",
    symbol: "Al",
    unit: "USD / tonne",
    rank: 3,
    sourceUrl: "https://www-old.metal.com/Aluminum/LME_AH_3M",
    scrapeKind: "metal-com-lme",
    minUsd: 1_500,
    maxUsd: 5_000,
  },
  {
    slug: "lead",
    name: "Lead",
    symbol: "Pb",
    unit: "USD / tonne",
    rank: 4,
    sourceUrl: "https://www-old.metal.com/Lead/LME_PB_3M",
    scrapeKind: "metal-com-lme",
    minUsd: 1_200,
    maxUsd: 4_500,
  },
  {
    slug: "zinc",
    name: "Zinc",
    symbol: "Zn",
    unit: "USD / tonne",
    rank: 5,
    sourceUrl: "https://www-old.metal.com/Zinc/LME_ZS_3M",
    scrapeKind: "metal-com-lme",
    minUsd: 1_500,
    maxUsd: 6_500,
  },
  {
    slug: "nickel",
    name: "Nickel",
    symbol: "Ni",
    unit: "USD / tonne",
    rank: 6,
    sourceUrl: "https://www-old.metal.com/Nickel/LME_NI_3M",
    scrapeKind: "metal-com-lme",
    minUsd: 8_000,
    maxUsd: 35_000,
  },
  {
    slug: "gold",
    name: "Gold",
    symbol: "Au",
    unit: "USD / oz",
    rank: 7,
    sourceUrl: "https://www-old.metal.com/price/Precious-Metals/Gold",
    scrapeKind: "smm-table",
    tableLabel: "Gold (99.99%) (USD/oz)",
    minUsd: 1_500,
    maxUsd: 6_000,
    precise: true,
  },
  {
    slug: "tantalite",
    name: "Tantalite",
    symbol: "Ta",
    unit: "USD / lb · 30% Ta₂O₅ CIF",
    rank: 8,
    sourceUrl: "https://www-old.metal.com/price/Minor-Metals/Niobium-Tantalum",
    scrapeKind: "smm-table",
    tableLabel: "CIF China 30% Tantalum Ore (USD/lb)",
    minUsd: 50,
    maxUsd: 800,
    precise: true,
  },
];

export function emptyQuote(def: MineralDefinition): MineralQuote {
  return {
    slug: def.slug,
    name: def.name,
    symbol: def.symbol,
    unit: def.unit,
    rank: def.rank,
    sourceUrl: def.sourceUrl,
    openUsd: null,
    lastUsd: null,
    closeUsd: null,
    scrapedAt: null,
    status: "pending",
  };
}
