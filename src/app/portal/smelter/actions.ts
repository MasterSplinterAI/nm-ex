"use server";

import { guarded, num, str, strList, type ActionResult } from "@/lib/dmo/action-utils";
import { requireSession } from "@/lib/dmo/session";
import { mutate } from "@/lib/dmo/store";
import {
  acceptOffer,
  createParentLot,
  recordCollection,
  recordPayment,
  registerRefinedLot,
} from "@/lib/dmo/workflow";

export async function acceptOfferAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const session = await requireSession("smelter", "buyer");
    const { certificate } = await mutate(session.participantId, (s, ctx) =>
      acceptOffer(s, ctx, { offerId: str(fd, "offerId"), acceptorId: session.participantId }),
    );
    return `Accepted. ${certificate.certNo} issued at LME US$${certificate.priceRef.lmeUsd.toLocaleString("en-US")} / ₦${certificate.priceRef.fxRate.toLocaleString("en-NG")}.`;
  });
}

export async function payAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const session = await requireSession("smelter", "buyer");
    await mutate(session.participantId, (s, ctx) => recordPayment(s, ctx, { acceptanceId: str(fd, "acceptanceId") }));
    return "Payment confirmed. Collect from the approved warehouse.";
  });
}

export async function collectAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const session = await requireSession("smelter", "buyer");
    await mutate(session.participantId, (s, ctx) => recordCollection(s, ctx, { acceptanceId: str(fd, "acceptanceId") }));
    return "Collection confirmed. The lot is now in your inventory.";
  });
}

export async function createParentLotAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const session = await requireSession("smelter");
    const parent = await mutate(session.participantId, (s, ctx) =>
      createParentLot(s, ctx, { smelterId: session.participantId, childLotIds: strList(fd, "childLotIds") }),
    );
    return `${parent.id} created: ${parent.totalKg.toLocaleString("en-NG")} kg, ${parent.containedTinKg.toLocaleString("en-NG")} kg contained tin.`;
  });
}

export async function registerRefinedAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const session = await requireSession("smelter");
    const { lot, campaign } = await mutate(session.participantId, (s, ctx) =>
      registerRefinedLot(s, ctx, {
        smelterId: session.participantId,
        parentLotIds: strList(fd, "parentLotIds"),
        recoveredKg: num(fd, "recoveredKg"),
        purityPct: num(fd, "purityPct"),
      }),
    );
    return `${lot.id} registered (${campaign.recoveryPct}% recovery) and offered to domestic buyers for ${5} days.`;
  });
}
