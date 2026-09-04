"use server";

import { guarded, num, str, type ActionResult } from "@/lib/dmo/action-utils";
import { requireSession } from "@/lib/dmo/session";
import { mutate } from "@/lib/dmo/store";
import { addPurchase, submitForInspection } from "@/lib/dmo/workflow";

export async function addPurchaseAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const session = await requireSession("supplier");
    const entry = await mutate(session.participantId, (s, ctx) =>
      addPurchase(s, ctx, {
        supplierId: session.participantId,
        date: str(fd, "date") || ctx.nowIso.slice(0, 10),
        source: str(fd, "source"),
        kg: num(fd, "kg"),
        gradePct: num(fd, "gradePct"),
        valueNgn: num(fd, "valueNgn", 0),
        reference: str(fd, "reference"),
      }),
    );
    return `Recorded ${entry.kg} kg @ ${entry.gradePct}% Sn.`;
  });
}

export async function submitLotAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const session = await requireSession("supplier");
    const tier = num(fd, "tier") === 2 ? 2 : 1;
    const { lot, inspection } = await mutate(session.participantId, (s, ctx) =>
      submitForInspection(s, ctx, { supplierId: session.participantId, tier, kg: num(fd, "kg") }),
    );
    return `${lot.id} submitted to ${inspection.warehouse}. Deliver the sample within 48 hours.`;
  });
}
