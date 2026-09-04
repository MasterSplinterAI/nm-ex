import type { DemoState } from "./types";

export function demoNow(state: Pick<DemoState, "clockOffsetMs">): Date {
  return new Date(Date.now() + state.clockOffsetMs);
}

export function demoNowIso(state: Pick<DemoState, "clockOffsetMs">): string {
  return demoNow(state).toISOString();
}

export function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString();
}

export function addDays(iso: string, days: number): string {
  return addHours(iso, days * 24);
}

export function yearOf(iso: string): number {
  return new Date(iso).getUTCFullYear();
}
