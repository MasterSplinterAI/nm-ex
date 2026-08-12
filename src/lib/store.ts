import { promises as fs } from "node:fs";
import path from "node:path";
import type { SpotBoard } from "./types";
import { MINERALS, emptyQuote } from "./minerals";

const DATA_PATH = path.join(process.cwd(), "data", "spot.json");
const PERSIST_PATH =
  process.env.NM_EX_DATA_PATH ||
  (process.env.NODE_ENV === "production" ? "/var/lib/nm-ex/spot.json" : DATA_PATH);

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
  for (const candidate of [PERSIST_PATH, DATA_PATH]) {
    try {
      const raw = await fs.readFile(candidate, "utf8");
      return JSON.parse(raw) as SpotBoard;
    } catch {
      // try next
    }
  }
  const seeded = seedBoard();
  await writeSpotBoard(seeded);
  return seeded;
}

export async function writeSpotBoard(board: SpotBoard): Promise<void> {
  const payload = `${JSON.stringify(board, null, 2)}\n`;
  await fs.mkdir(path.dirname(PERSIST_PATH), { recursive: true });
  await fs.writeFile(PERSIST_PATH, payload, "utf8");
  if (PERSIST_PATH !== DATA_PATH) {
    try {
      await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
      await fs.writeFile(DATA_PATH, payload, "utf8");
    } catch {
      // secondary copy is best-effort
    }
  }
}
