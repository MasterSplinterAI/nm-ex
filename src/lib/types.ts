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
  spec: string | null;
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

/** Central NM-EX tin procurement settings — editable without a code change. */
export type TinPolicy = {
  refinedSpec: string;
  concentrateSpec: string;
  /** NM-EX share of LME paid for concentrate, e.g. 70 */
  benchmarkPct: number;
  defaultAssayPct: number;
  minAssayPct: number;
  maxAssayPct: number;
  /** Government royalty on the procurement value, e.g. 7.5 */
  royaltyPct: number;
};
