import { promises as fs } from "node:fs";
import path from "node:path";
import type { SpotBoard } from "./types";
import { MINERALS, emptyQuote } from "./minerals";

const DATA_PATH = path.join(process.cwd(), "data", "spot.json");

const SEED_LAST: Partial<Record<(typeof MINERALS)[number]["slug"], number>> = {
  tin: 33_600,
  copper: 9_850,
  aluminum: 2_550,
  lead: 2_060,
  zinc: 2_805,
  nickel: 16_200,
  gold: 2_355,
  tantalite: 230,
};

/** Seed used when no file exists or scrape fails entirely. */
export function seedBoard(): SpotBoard {
  const now = new Date().toISOString();
  return {
    updatedAt: now,
    fx: {
      pair: "USD/NGN",
      rate: 1550,
      source: "fallback",
      scrapedAt: now,
    },
    minerals: MINERALS.map((def) => {
      const base = emptyQuote(def);
      const last = SEED_LAST[def.slug];
      if (last == null) return base;
      return {
        ...base,
        openUsd: last,
        lastUsd: last,
        closeUsd: last,
        scrapedAt: now,
        status: "stale" as const,
      };
    }),
  };
}

export async function readSpotBoard(): Promise<SpotBoard> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(raw) as SpotBoard;
  } catch {
    const seeded = seedBoard();
    await writeSpotBoard(seeded);
    return seeded;
  }
}

export async function writeSpotBoard(board: SpotBoard): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, `${JSON.stringify(board, null, 2)}\n`, "utf8");
}
