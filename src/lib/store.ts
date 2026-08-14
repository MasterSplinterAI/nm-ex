import { promises as fs } from "node:fs";
import path from "node:path";
import type { SpotBoard, TinPolicy } from "./types";
import { MINERALS, emptyQuote } from "./minerals";
import { DEFAULT_TIN_POLICY, policyFromEnv } from "./policy";

const DATA_PATH = path.join(process.cwd(), "data", "spot.json");
const PERSIST_PATH =
  process.env.NM_EX_DATA_PATH ||
  (process.env.NODE_ENV === "production" ? "/var/lib/nm-ex/spot.json" : DATA_PATH);
const POLICY_PATH = path.join(process.cwd(), "data", "policy.json");
const POLICY_PERSIST_PATH =
  process.env.NM_EX_POLICY_PATH ||
  (process.env.NODE_ENV === "production"
    ? "/var/lib/nm-ex/policy.json"
    : POLICY_PATH);

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

function hydrateBoard(board: SpotBoard): SpotBoard {
  return {
    ...board,
    minerals: board.minerals.map((mineral) => {
      const def = MINERALS.find((item) => item.slug === mineral.slug);
      if (!def) return mineral;
      return {
        ...mineral,
        name: def.name,
        symbol: def.symbol,
        unit: def.unit,
        spec: def.spec ?? mineral.spec ?? null,
      };
    }),
  };
}

export async function readSpotBoard(): Promise<SpotBoard> {
  for (const candidate of [PERSIST_PATH, DATA_PATH]) {
    try {
      const raw = await fs.readFile(/* turbopackIgnore: true */ candidate, "utf8");
      return hydrateBoard(JSON.parse(raw) as SpotBoard);
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

function mergePolicy(raw: Partial<TinPolicy> | null): TinPolicy {
  return policyFromEnv({
    ...DEFAULT_TIN_POLICY,
    ...raw,
  });
}

export async function readTinPolicy(): Promise<TinPolicy> {
  for (const candidate of [POLICY_PERSIST_PATH, POLICY_PATH]) {
    try {
      const raw = await fs.readFile(/* turbopackIgnore: true */ candidate, "utf8");
      return mergePolicy(JSON.parse(raw) as Partial<TinPolicy>);
    } catch {
      // try next
    }
  }
  const seeded = mergePolicy(null);
  await writeTinPolicy(seeded);
  return seeded;
}

export async function writeTinPolicy(policy: TinPolicy): Promise<void> {
  const payload = `${JSON.stringify(policy, null, 2)}\n`;
  await fs.mkdir(path.dirname(POLICY_PERSIST_PATH), { recursive: true });
  await fs.writeFile(POLICY_PERSIST_PATH, payload, "utf8");
  if (POLICY_PERSIST_PATH !== POLICY_PATH) {
    try {
      await fs.mkdir(path.dirname(POLICY_PATH), { recursive: true });
      await fs.writeFile(POLICY_PATH, payload, "utf8");
    } catch {
      // secondary copy is best-effort
    }
  }
}
