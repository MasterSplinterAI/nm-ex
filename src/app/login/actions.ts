"use server";

import { redirect } from "next/navigation";
import { readState } from "@/lib/dmo/store";
import { createSession, roleHome, verifyDemoPassword } from "@/lib/dmo/session";
import type { ActionResult } from "@/lib/dmo/action-utils";

export async function loginAs(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const participantId = String(formData.get("participantId") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!verifyDemoPassword(password)) {
    return { error: "That password is not recognised." };
  }
  const state = await readState();
  const participant = state.participants.find((p) => p.id === participantId);
  if (!participant) return { error: "No such participant." };
  if (participant.status !== "approved") {
    return {
      error:
        "This application is still under review. Sign in as the NM-EX officer to approve it, then try again.",
    };
  }
  await createSession(participant.id, participant.role);
  const next = String(formData.get("next") ?? "");
  if (next.startsWith("/") && !next.startsWith("//")) redirect(next);
  redirect(roleHome(participant.role));
}
