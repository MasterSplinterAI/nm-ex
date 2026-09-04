import { promises as fs } from "node:fs";
import path from "node:path";
import { readSpotBoard } from "@/lib/store";
import { demoNowIso } from "./clock";
import { priceRefFromBoard } from "./prices";
import { buildSeed } from "./seed";
import type { DemoState } from "./types";
import { expireDueOffers, type Ctx } from "./workflow";

const LOCAL_PATH = path.join(process.cwd(), "data", "demo.json");
const PERSIST_PATH =
  process.env.NM_EX_DEMO_PATH ||
  (process.env.NODE_ENV === "production" ? "/var/lib/nm-ex/demo.json" : LOCAL_PATH);

let chain: Promise<unknown> = Promise.resolve();

async function write(state: DemoState): Promise<void> {
  await fs.mkdir(path.dirname(PERSIST_PATH), { recursive: true });
  await fs.writeFile(PERSIST_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function seedFresh(): Promise<DemoState> {
  const board = await readSpotBoard();
  const seeded = buildSeed(board, new Date().toISOString());
  await write(seeded);
  return seeded;
}

async function load(): Promise<DemoState> {
  try {
    const raw = await fs.readFile(/* turbopackIgnore: true */ PERSIST_PATH, "utf8");
    return JSON.parse(raw) as DemoState;
  } catch {
    return seedFresh();
  }
}

function serialize<T>(work: () => Promise<T>): Promise<T> {
  const run = chain.then(work, work);
  chain = run.catch(() => undefined);
  return run;
}

/** Read-only view. Expired offers are settled lazily on the next mutation. */
export function readState(): Promise<DemoState> {
  return serialize(load);
}

export function mutate<T>(
  actorId: string,
  fn: (state: DemoState, ctx: Ctx) => T,
): Promise<T> {
  return serialize(async () => {
    const [state, board] = await Promise.all([load(), readSpotBoard()]);
    const nowIso = demoNowIso(state);
    const ctx: Ctx = {
      actorId,
      nowIso,
      priceRef: () => priceRefFromBoard(board, nowIso),
    };
    expireDueOffers(state, { ...ctx, actorId: "system" });
    const result = fn(state, ctx);
    await write(state);
    return result;
  });
}

/** Settle any offers whose window has closed, without other changes. */
export function settle(): Promise<number> {
  return mutate("system", (state, ctx) => expireDueOffers(state, ctx).length);
}

export function resetState(): Promise<DemoState> {
  return serialize(seedFresh);
}
