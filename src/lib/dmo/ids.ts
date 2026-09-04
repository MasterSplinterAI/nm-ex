import type { CertificateClass, DemoState, LotKind, Role } from "./types";

type Counters = Pick<DemoState, "counters">;

export function nextCounter(state: Counters, key: string): number {
  const next = (state.counters[key] ?? 0) + 1;
  state.counters[key] = next;
  return next;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

const COMMODITY: Record<LotKind, string> = { concentrate: "TINC", refined: "TIN" };

export function certificateNumber(
  state: Counters,
  cls: CertificateClass,
  kind: LotKind,
  year: number,
): string {
  const key = `cert:${cls}:${kind}:${year}`;
  return `NMEX-${cls}-${COMMODITY[kind]}-${year}-${pad(nextCounter(state, key), 5)}`;
}

export function lotId(state: Counters, kind: LotKind, year: number): string {
  const prefix = kind === "concentrate" ? "TIN" : "RTIN";
  return `NMEX-${prefix}-${year}-${pad(nextCounter(state, `lot:${kind}:${year}`), 5)}`;
}

export function parentLotId(state: Counters, year: number): string {
  return `NMEX-AGG-TIN-${year}-${pad(nextCounter(state, `parent:${year}`), 4)}`;
}

const REG_PREFIX: Partial<Record<Role, string>> = {
  supplier: "SUP",
  smelter: "SMEL",
  buyer: "BUY",
};

export function regNo(state: Counters, role: Role, year: number): string {
  const prefix = REG_PREFIX[role] ?? "PART";
  return `NMEX-${prefix}-${year}-${pad(nextCounter(state, `reg:${prefix}:${year}`), 5)}`;
}

export function simpleId(state: Counters, prefix: string): string {
  return `${prefix}-${pad(nextCounter(state, `simple:${prefix}`), 6)}`;
}
