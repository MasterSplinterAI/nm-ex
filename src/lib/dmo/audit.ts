import { simpleId } from "./ids";
import type { AuditEvent, DemoState } from "./types";

export function record(
  state: DemoState,
  atIso: string,
  event: Omit<AuditEvent, "id" | "at">,
): AuditEvent {
  const entry: AuditEvent = { id: simpleId(state, "evt"), at: atIso, ...event };
  state.audit.push(entry);
  return entry;
}

export function actorLabel(state: DemoState, actorId: string): string {
  if (actorId === "system") return "NM-EX system";
  if (actorId === "anon") return "Public applicant";
  return state.participants.find((p) => p.id === actorId)?.legalName ?? actorId;
}
