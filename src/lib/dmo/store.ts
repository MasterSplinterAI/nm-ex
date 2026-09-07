import { promises as fs } from "node:fs";
import path from "node:path";
import { readSpotBoard } from "@/lib/store";
import { demoNowIso } from "./clock";
import { priceRefFromBoard } from "./prices";
import { buildSeed, SEED_IDS } from "./seed";
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

const OLD_VERIFIER_NAME = "Nairobi Inspection Services";
const NEW_VERIFIER_NAME = "Neroli Inspection Services";
const OLD_VERIFIER_EMAIL = "pia@nairobi.example";
const NEW_VERIFIER_EMAIL = "pia@neroli.example";

/** Keep persistent demo data aligned with corrections that must not require a reset. */
export function migrateState(state: DemoState): boolean {
  let changed = false;
  const verifier = state.participants.find((participant) => participant.id === SEED_IDS.verifier);
  if (verifier?.legalName === OLD_VERIFIER_NAME) {
    verifier.legalName = NEW_VERIFIER_NAME;
    changed = true;
  }
  if (verifier?.email === OLD_VERIFIER_EMAIL) {
    verifier.email = NEW_VERIFIER_EMAIL;
    changed = true;
  }
  for (const event of state.audit ?? []) {
    const detail = event.detail
      ?.replaceAll(OLD_VERIFIER_NAME, NEW_VERIFIER_NAME)
      .replaceAll(OLD_VERIFIER_EMAIL, NEW_VERIFIER_EMAIL);
    const actorLabel = event.actorLabel
      ?.replaceAll(OLD_VERIFIER_NAME, NEW_VERIFIER_NAME)
      .replaceAll(OLD_VERIFIER_EMAIL, NEW_VERIFIER_EMAIL);
    if (detail !== event.detail) {
      event.detail = detail;
      changed = true;
    }
    if (actorLabel !== event.actorLabel) {
      event.actorLabel = actorLabel;
      changed = true;
    }
  }
  return changed;
}

async function load(): Promise<DemoState> {
  let state: DemoState;
  try {
    const raw = await fs.readFile(/* turbopackIgnore: true */ PERSIST_PATH, "utf8");
    state = JSON.parse(raw) as DemoState;
  } catch {
    return seedFresh();
  }
  if (migrateState(state)) await write(state);
  return state;
}

function serialize<T>(work: () => Promise<T>): Promise<T> {
  const run = chain.then(work, work);
  chain = run.catch(() => undefined);
  return run;
}

/** Read state; one-time data corrections may be persisted during loading. */
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
