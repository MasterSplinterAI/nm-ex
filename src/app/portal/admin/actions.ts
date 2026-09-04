"use server";

import { guarded, num, str, type ActionResult } from "@/lib/dmo/action-utils";
import { requireSession } from "@/lib/dmo/session";
import { mutate, resetState } from "@/lib/dmo/store";
import type { CertificateStatus, DmoPolicy } from "@/lib/dmo/types";
import {
  advanceClock,
  defaultAcceptance,
  expireOffer,
  markSampleReceived,
  recordCollection,
  recordPayment,
  reviewRegistration,
  setCertificateStatus,
  updatePolicy,
  verifyLot,
  type RegistrationDecision,
} from "@/lib/dmo/workflow";

async function officer() {
  return (await requireSession("officer")).participantId;
}

export async function reviewRegistrationAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const actor = await officer();
    const decision = str(fd, "decision") as RegistrationDecision;
    const p = await mutate(actor, (s, ctx) =>
      reviewRegistration(s, ctx, { participantId: str(fd, "participantId"), decision, note: str(fd, "note") || null }),
    );
    return decision === "approved" ? `${p.legalName} approved as ${p.regNo}.` : `${p.legalName}: ${decision.replace("_", " ")}.`;
  });
}

export async function sampleReceivedAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const actor = await officer();
    await mutate(actor, (s, ctx) => markSampleReceived(s, ctx, { inspectionId: str(fd, "inspectionId") }));
    return "Sample received. Enter the assay result to verify the lot.";
  });
}

export async function verifyLotAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const actor = await officer();
    const lot = await mutate(actor, (s, ctx) =>
      verifyLot(s, ctx, {
        inspectionId: str(fd, "inspectionId"),
        verifiedKg: num(fd, "verifiedKg"),
        verifiedGradePct: num(fd, "verifiedGradePct"),
      }),
    );
    return `${lot.id} verified. Assay locked and domestic offer opened.`;
  });
}

export async function forceExpireAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const actor = await officer();
    const cert = await mutate(actor, (s, ctx) => expireOffer(s, ctx, { offerId: str(fd, "offerId"), force: true }));
    return `Offer closed with no acceptance. ${cert.certNo} issued.`;
  });
}

export async function officerPaymentAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const actor = await officer();
    await mutate(actor, (s, ctx) => recordPayment(s, ctx, { acceptanceId: str(fd, "acceptanceId") }));
    return "Payment recorded.";
  });
}

export async function officerCollectionAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const actor = await officer();
    await mutate(actor, (s, ctx) => recordCollection(s, ctx, { acceptanceId: str(fd, "acceptanceId") }));
    return "Collection recorded.";
  });
}

export async function defaultAcceptanceAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const actor = await officer();
    await mutate(actor, (s, ctx) => defaultAcceptance(s, ctx, { acceptanceId: str(fd, "acceptanceId") }));
    return "Acceptance defaulted; certificate cancelled and lot re-offered.";
  });
}

export async function certificateStatusAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const session = await requireSession("officer", "verifier");
    const status = str(fd, "status") as CertificateStatus;
    const cert = await mutate(session.participantId, (s, ctx) =>
      setCertificateStatus(s, ctx, { certNo: str(fd, "certNo"), status, note: str(fd, "note") || null }),
    );
    return `${cert.certNo} is now ${status}.`;
  });
}

export async function updatePolicyAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const actor = await officer();
    const omp = str(fd, "ompCoefficient");
    const patch: Partial<DmoPolicy> = {
      coefMinerToAggregator: num(fd, "coefMinerToAggregator"),
      coefToSmelter: num(fd, "coefToSmelter"),
      ompCoefficient: omp ? Number.parseFloat(omp) : null,
      royaltyPct: num(fd, "royaltyPct"),
      vatPct: num(fd, "vatPct"),
      recoveryPct: num(fd, "recoveryPct"),
      mmlTier1Kg: num(fd, "mmlTier1Kg"),
      mmlTier2Kg: num(fd, "mmlTier2Kg"),
      tier1MinGradePct: num(fd, "tier1MinGradePct"),
      sampleWindowHours: num(fd, "sampleWindowHours"),
      offerPeriodDays: num(fd, "offerPeriodDays"),
      paymentWindowDays: num(fd, "paymentWindowDays"),
    };
    await mutate(actor, (s, ctx) => updatePolicy(s, ctx, patch));
    return "Policy updated. New lots and certificates use these parameters; issued certificates are unchanged.";
  });
}

export async function advanceClockAction(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const actor = await officer();
    const hours = num(fd, "hours");
    const issued = await mutate(actor, (s, ctx) => advanceClock(s, ctx, { hours }));
    return issued.length
      ? `Clock advanced ${hours} h. ${issued.length} offer(s) expired: ${issued.map((c) => c.certNo).join(", ")}.`
      : `Clock advanced ${hours} h.`;
  });
}

export async function resetScenarioAction(): Promise<ActionResult> {
  return guarded(async () => {
    await officer();
    await resetState();
    return "Scenario reset to the seeded starting point.";
  });
}
