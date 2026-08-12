export type MineralSlug =
  | "tin"
  | "copper"
  | "aluminum"
  | "lead"
  | "zinc"
  | "nickel"
  | "gold"
  | "tantalite";

export type MineralQuote = {
  slug: MineralSlug;
  name: string;
  symbol: string;
  unit: string;
  rank: number;
  sourceUrl: string;
  openUsd: number | null;
  lastUsd: number | null;
  closeUsd: number | null;
  scrapedAt: string | null;
  status: "live" | "stale" | "pending";
};

export type FxQuote = {
  pair: "USD/NGN";
  rate: number;
  source: "xe.com" | "fallback";
  scrapedAt: string;
};

export type SpotBoard = {
  updatedAt: string;
  fx: FxQuote;
  minerals: MineralQuote[];
};
