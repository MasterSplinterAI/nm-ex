import { record } from "./audit";
import { addDays, addHours, yearOf } from "./clock";
import { certificateNumber, lotId, parentLotId, purchaseId, regNo, simpleId } from "./ids";
import { kgToMt, round2 } from "./money";
import { FACILITY_WAREHOUSES } from "./facilities";
import { DEFAULT_DMO_POLICY, mmlKgForTier, tierForGrade } from "./policy";
import {
  WorkflowError,
  type Acceptance,
  type Campaign,
  type Certificate,
  type CertificateStatus,
  type DemoState,
  type DmoPolicy,
  type Inspection,
  type Lot,
  type Offer,
  type ParentLot,
  type Participant,
  type ParticipantCategory,
  type PriceRef,
  type PurchaseEntry,
  type Role,
  type UploadedDoc,
} from "./types";
import { valueAcceptance, valueExportClearance } from "./valuation";

export type Ctx = {
  actorId: string;
  nowIso: string;
  priceRef: () => PriceRef;
};

export function emptyState(nowIso: string): DemoState {
  return {
    version: 1,
    seededAt: nowIso,
    clockOffsetMs: 0,
    policy: structuredClone(DEFAULT_DMO_POLICY),
    participants: [],
    purchases: [],
    lots: [],
    inspections: [],
    offers: [],
    acceptances: [],
    certificates: [],
    parentLots: [],
    campaigns: [],
    audit: [],
    counters: {},
  };
}

function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new WorkflowError(`${what} not found.`);
  return value;
}

export const findParticipant = (s: DemoState, id: string) =>
  must(s.participants.find((p) => p.id === id), "Participant");
export const findLot = (s: DemoState, id: string) =>
  must(s.lots.find((l) => l.id === id), "Lot");
export const findOffer = (s: DemoState, id: string) =>
  must(s.offers.find((o) => o.id === id), "Offer");
export const findAcceptance = (s: DemoState, id: string) =>
  must(s.acceptances.find((a) => a.id === id), "Acceptance");
export const findInspection = (s: DemoState, id: string) =>
  must(s.inspections.find((i) => i.id === id), "Inspection");
export const findCertificate = (s: DemoState, no: string) =>
  must(s.certificates.find((c) => c.certNo === no), "Certificate");
export const findParentLot = (s: DemoState, id: string) =>
  must(s.parentLots.find((p) => p.id === id), "Parent lot");

function requireApproved(p: Participant, role?: Role) {
  if (p.status !== "approved") {
    throw new WorkflowError(`${p.legalName} is not an approved participant.`);
  }
  if (role && p.role !== role) {
    throw new WorkflowError(`${p.legalName} is not a ${role}.`);
  }
}

function isOfficer(s: DemoState, actorId: string): boolean {
  if (actorId === "system" || actorId.startsWith("officer")) return true;
  const actor = s.participants.find((p) => p.id === actorId);
  return actor?.role === "officer";
}

function requireOfficer(s: DemoState, ctx: Ctx) {
  if (!isOfficer(s, ctx.actorId)) {
    throw new WorkflowError("Only an NM-EX officer may do this.");
  }
}

function pickWarehouse(s: DemoState, requested?: string): string {
  const allowed = new Set([...s.policy.warehouses, ...FACILITY_WAREHOUSES]);
  if (requested && allowed.has(requested)) return requested;
  return s.policy.warehouses[0] ?? FACILITY_WAREHOUSES[0] ?? "NM-EX Approved Warehouse";
}

function log(
  s: DemoState,
  ctx: Ctx,
  action: string,
  subjectType: string,
  subjectId: string,
  detail: string,
) {
  const actor = s.participants.find((p) => p.id === ctx.actorId);
  record(s, ctx.nowIso, {
    actorId: ctx.actorId,
    actorLabel:
      actor?.legalName ??
      (ctx.actorId === "system"
        ? "NM-EX system"
        : ctx.actorId === "anon"
          ? "Public applicant"
          : ctx.actorId),
    action,
    subjectType,
    subjectId,
    detail,
  });
}

// ---------------------------------------------------------------- registration

export function submitRegistration(
  s: DemoState,
  ctx: Ctx,
  input: {
    role: Role;
    category: ParticipantCategory | null;
    legalName: string;
    address: string;
    contactName: string;
    phone: string;
    email: string;
    documents: UploadedDoc[];
  },
): Participant {
  if (!input.legalName.trim()) throw new WorkflowError("Legal name is required.");
  const participant: Participant = {
    id: simpleId(s, "part"),
    regNo: null,
    role: input.role,
    category: input.category,
    legalName: input.legalName.trim(),
    address: input.address.trim(),
    contactName: input.contactName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    status: "pending",
    documents: input.documents,
    reviewNote: null,
    createdAt: ctx.nowIso,
  };
  s.participants.push(participant);
  log(
    s,
    ctx,
    "registration.submitted",
    "participant",
    participant.id,
    `${participant.legalName} applied as ${input.role}${
      input.category ? ` (${input.category})` : ""
    } with ${input.documents.length} document(s).`,
  );
  return participant;
}

export type RegistrationDecision =
  | "approved"
  | "rejected"
  | "more_info"
  | "under_review"
  | "suspended";

export function reviewRegistration(
  s: DemoState,
  ctx: Ctx,
  input: { participantId: string; decision: RegistrationDecision; note: string | null },
): Participant {
  requireOfficer(s, ctx);
  const p = findParticipant(s, input.participantId);
  p.status = input.decision;
  p.reviewNote = input.note;
  if (input.decision === "approved" && p.regNo == null) {
    p.regNo = regNo(s, p.role, yearOf(ctx.nowIso));
  }
  log(
    s,
    ctx,
    `registration.${input.decision}`,
    "participant",
    p.id,
    `${p.legalName}: ${input.decision}${p.regNo ? ` · ${p.regNo}` : ""}${
      input.note ? ` — ${input.note}` : ""
    }`,
  );
  return p;
}

// ---------------------------------------------------------------- ledger

export function addPurchase(
  s: DemoState,
  ctx: Ctx,
  input: {
    supplierId: string;
    date: string;
    source: string;
    kg: number;
    gradePct: number;
    valueNgn: number;
    reference: string;
  },
): PurchaseEntry {
  const supplier = findParticipant(s, input.supplierId);
  requireApproved(supplier, "supplier");
  if (!(input.kg > 0)) throw new WorkflowError("Weight must be greater than zero.");
  if (!(input.gradePct > 0 && input.gradePct <= 100)) {
    throw new WorkflowError("Grade must be between 0 and 100%.");
  }
  const entry: PurchaseEntry = {
    id: purchaseId(s, yearOf(input.date || ctx.nowIso)),
    supplierId: supplier.id,
    date: input.date,
    source: input.source.trim() || "Unregistered supplier",
    kg: input.kg,
    gradePct: input.gradePct,
    valueNgn: input.valueNgn,
    reference: input.reference.trim(),
    lotId: null,
    createdAt: ctx.nowIso,
  };
  s.purchases.push(entry);
  log(
    s,
    ctx,
    "purchase.added",
    "participant",
    supplier.id,
    `${input.kg} kg @ ${input.gradePct}% Sn from ${entry.source}.`,
  );
  return entry;
}

export type Inventory = {
  tier1Kg: number;
  tier2Kg: number;
  entries: PurchaseEntry[];
};

export function eligibleInventory(s: DemoState, supplierId: string): Inventory {
  const entries = s.purchases.filter(
    (p) => p.supplierId === supplierId && p.lotId === null,
  );
  let tier1Kg = 0;
  let tier2Kg = 0;
  for (const e of entries) {
    if (tierForGrade(e.gradePct, s.policy) === 1) tier1Kg += e.kg;
    else tier2Kg += e.kg;
  }
  return { tier1Kg, tier2Kg, entries };
}

export function canSubmitLot(s: DemoState, supplierId: string, tier: 1 | 2): boolean {
  const inv = eligibleInventory(s, supplierId);
  const kg = tier === 1 ? inv.tier1Kg : inv.tier2Kg;
  return kg >= mmlKgForTier(tier, s.policy);
}

export function submitForInspection(
  s: DemoState,
  ctx: Ctx,
  input: { supplierId: string; tier: 1 | 2; kg: number; warehouse?: string },
): { lot: Lot; inspection: Inspection } {
  const supplier = findParticipant(s, input.supplierId);
  requireApproved(supplier, "supplier");
  const inv = eligibleInventory(s, supplier.id);
  const eligibleKg = input.tier === 1 ? inv.tier1Kg : inv.tier2Kg;
  const mml = mmlKgForTier(input.tier, s.policy);
  if (eligibleKg < mml) {
    throw new WorkflowError(
      `Eligible inventory (${eligibleKg} kg) is below the ${mml} kg minimum marketable lot.`,
    );
  }
  if (input.kg > eligibleKg) {
    throw new WorkflowError(`Only ${eligibleKg} kg is eligible in this tier.`);
  }
  if (input.kg < mml) {
    throw new WorkflowError(`A lot must be at least ${mml} kg.`);
  }

  const candidates = inv.entries
    .filter((e) => tierForGrade(e.gradePct, s.policy) === input.tier)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  const taken: PurchaseEntry[] = [];
  let sum = 0;
  for (const e of candidates) {
    if (sum >= input.kg) break;
    taken.push(e);
    sum += e.kg;
  }
  const weightedGrade =
    taken.reduce((acc, e) => acc + e.kg * e.gradePct, 0) / Math.max(sum, 1);

  const lot: Lot = {
    id: lotId(s, "concentrate", yearOf(ctx.nowIso)),
    kind: "concentrate",
    ownerId: supplier.id,
    status: "submitted_for_inspection",
    declaredKg: sum,
    declaredGradePct: round2(weightedGrade),
    verifiedKg: null,
    verifiedGradePct: null,
    verifiedAt: null,
    verifiedBy: null,
    assayPriceRef: null,
    parentLotId: null,
    campaignId: null,
    purchaseIds: taken.map((e) => e.id),
    createdAt: ctx.nowIso,
  };
  for (const e of taken) e.lotId = lot.id;
  s.lots.push(lot);

  const inspection: Inspection = {
    id: simpleId(s, "insp"),
    lotId: lot.id,
    submittedKg: sum,
    warehouse: pickWarehouse(s, input.warehouse),
    windowEndsAt: addHours(ctx.nowIso, s.policy.sampleWindowHours),
    status: "awaiting_sample",
    sampleReceivedAt: null,
    createdAt: ctx.nowIso,
  };
  s.inspections.push(inspection);
  log(
    s,
    ctx,
    "inspection.requested",
    "lot",
    lot.id,
    `${supplier.legalName} submitted ${sum} kg (${taken.length} purchases, declared ${lot.declaredGradePct}% Sn) to ${inspection.warehouse}; sample due by ${inspection.windowEndsAt}.`,
  );
  return { lot, inspection };
}

export function markSampleReceived(
  s: DemoState,
  ctx: Ctx,
  input: { inspectionId: string },
): Inspection {
  requireOfficer(s, ctx);
  const insp = findInspection(s, input.inspectionId);
  if (insp.status !== "awaiting_sample") {
    throw new WorkflowError("Sample has already been received.");
  }
  insp.status = "sample_received";
  insp.sampleReceivedAt = ctx.nowIso;
  const lot = findLot(s, insp.lotId);
  lot.status = "sample_received";
  log(s, ctx, "inspection.sample_received", "lot", lot.id, `Sample received at ${insp.warehouse}.`);
  return insp;
}

export function verifyLot(
  s: DemoState,
  ctx: Ctx,
  input: { inspectionId: string; verifiedKg: number; verifiedGradePct: number },
): Lot {
  requireOfficer(s, ctx);
  const insp = findInspection(s, input.inspectionId);
  if (insp.status !== "sample_received") {
    throw new WorkflowError("Mark the sample as received before verifying.");
  }
  if (!(input.verifiedKg > 0) || input.verifiedKg > insp.submittedKg) {
    throw new WorkflowError(
      `Verified weight must be between 0 and the submitted ${insp.submittedKg} kg.`,
    );
  }
  if (!(input.verifiedGradePct > 0 && input.verifiedGradePct <= 100)) {
    throw new WorkflowError("Verified grade must be between 0 and 100%.");
  }
  const lot = findLot(s, insp.lotId);
  lot.verifiedKg = input.verifiedKg;
  lot.verifiedGradePct = input.verifiedGradePct;
  lot.verifiedAt = ctx.nowIso;
  lot.verifiedBy = ctx.actorId;
  lot.assayPriceRef = ctx.priceRef();
  lot.status = "verified";
  insp.status = "verified";
  const contained = round2(input.verifiedKg * (input.verifiedGradePct / 100));
  log(
    s,
    ctx,
    "assay.verified",
    "lot",
    lot.id,
    `Verified ${input.verifiedKg} kg @ ${input.verifiedGradePct}% Sn = ${contained} kg contained tin. Assay locked to lot; LME US$${lot.assayPriceRef.lmeUsd}/MT, FX ₦${lot.assayPriceRef.fxRate}.`,
  );
  openOffer(s, ctx, { lotId: lot.id });
  return lot;
}

// ---------------------------------------------------------------- offers

export function openOffer(s: DemoState, ctx: Ctx, input: { lotId: string }): Offer {
  const lot = findLot(s, input.lotId);
  if (lot.status !== "verified") {
    throw new WorkflowError("Only a verified lot can be offered.");
  }
  const offer: Offer = {
    id: simpleId(s, "off"),
    lotId: lot.id,
    audience: lot.kind === "concentrate" ? "smelters" : "buyers",
    opensAt: ctx.nowIso,
    closesAt: addDays(ctx.nowIso, s.policy.offerPeriodDays),
    status: "open",
    acceptanceId: null,
    certNo: null,
  };
  s.offers.push(offer);
  lot.status = "offered";
  log(
    s,
    ctx,
    "offer.opened",
    "lot",
    lot.id,
    `Domestic market offer opened to qualified ${offer.audience}; closes ${offer.closesAt}.`,
  );
  return offer;
}

export function acceptOffer(
  s: DemoState,
  ctx: Ctx,
  input: { offerId: string; acceptorId: string },
): { acceptance: Acceptance; certificate: Certificate } {
  const offer = findOffer(s, input.offerId);
  if (offer.status !== "open") throw new WorkflowError("Offer is not open.");
  if (ctx.nowIso >= offer.closesAt) throw new WorkflowError("Offer period has closed.");
  const acceptor = findParticipant(s, input.acceptorId);
  requireApproved(acceptor, offer.audience === "smelters" ? "smelter" : "buyer");
  const lot = findLot(s, offer.lotId);
  if (lot.verifiedKg == null || lot.verifiedGradePct == null) {
    throw new WorkflowError("Lot has no verified assay.");
  }
  const price = ctx.priceRef();
  const valuation = valueAcceptance({
    weightMt: kgToMt(lot.verifiedKg),
    gradePct: lot.verifiedGradePct,
    lmeUsd: price.lmeUsd,
    fxRate: price.fxRate,
    procurementCoef: lot.kind === "concentrate" ? s.policy.coefToSmelter : 1,
    royaltyPct: s.policy.royaltyPct,
    vatPct: s.policy.vatPct,
    smelterId: acceptor.id,
  });
  const certNo = certificateNumber(s, "DMO-A", lot.kind, yearOf(ctx.nowIso));
  const acceptance: Acceptance = {
    id: simpleId(s, "acc"),
    offerId: offer.id,
    lotId: lot.id,
    acceptorId: acceptor.id,
    acceptedAt: ctx.nowIso,
    deadlineAt: addDays(ctx.nowIso, s.policy.paymentWindowDays),
    paymentStatus: "pending",
    paidAt: null,
    collectionStatus: "pending",
    collectedAt: null,
    priceRef: price,
    valuation,
    certNo,
  };
  const certificate: Certificate = {
    certNo,
    cls: "DMO-A",
    lotId: lot.id,
    offerId: offer.id,
    acceptanceId: acceptance.id,
    supplierId: lot.ownerId,
    counterpartyId: acceptor.id,
    issuedAt: ctx.nowIso,
    status: "VALID",
    priceRef: price,
    valuation,
    supersedes: null,
    history: [{ at: ctx.nowIso, status: "VALID", byId: "system", note: "Issued on acceptance" }],
  };
  s.acceptances.push(acceptance);
  s.certificates.push(certificate);
  offer.status = "accepted";
  offer.acceptanceId = acceptance.id;
  offer.certNo = certNo;
  lot.status = lot.kind === "concentrate" ? "payment_pending" : "sold_domestic";
  log(
    s,
    ctx,
    "offer.accepted",
    "lot",
    lot.id,
    `${acceptor.legalName} accepted ${lot.id}; ${certNo} issued; royalty liability for ${valuation.containedTinMt} MT contained tin transferred to ${acceptor.legalName}.`,
  );
  return { acceptance, certificate };
}

export function expireOffer(
  s: DemoState,
  ctx: Ctx,
  input: { offerId: string; force?: boolean },
): Certificate {
  const offer = findOffer(s, input.offerId);
  if (offer.status !== "open") throw new WorkflowError("Offer is not open.");
  if (!input.force && ctx.nowIso < offer.closesAt) {
    throw new WorkflowError("Offer period has not ended.");
  }
  if (input.force) requireOfficer(s, ctx);
  const lot = findLot(s, offer.lotId);
  if (lot.verifiedKg == null || lot.verifiedGradePct == null) {
    throw new WorkflowError("Lot has no verified assay.");
  }
  const price = ctx.priceRef();
  const cls = lot.kind === "concentrate" ? "DMO-EC" : "DMO-ER";
  const valuation = valueExportClearance({
    weightMt: kgToMt(lot.verifiedKg),
    gradePct: lot.verifiedGradePct,
    lmeUsd: price.lmeUsd,
    fxRate: price.fxRate,
    royaltyPct: s.policy.royaltyPct,
    vatPct: s.policy.vatPct,
    liabilityHolderId: lot.ownerId,
  });
  const certNo = certificateNumber(s, cls, lot.kind, yearOf(ctx.nowIso));
  const certificate: Certificate = {
    certNo,
    cls,
    lotId: lot.id,
    offerId: offer.id,
    acceptanceId: null,
    supplierId: lot.ownerId,
    counterpartyId: null,
    issuedAt: ctx.nowIso,
    status: "VALID",
    priceRef: price,
    valuation,
    supersedes: null,
    history: [
      {
        at: ctx.nowIso,
        status: "VALID",
        byId: "system",
        note: input.force
          ? "Issued — offer closed by NM-EX officer with no acceptance"
          : "Issued on offer expiry",
      },
    ],
  };
  s.certificates.push(certificate);
  offer.status = "expired";
  offer.certNo = certNo;
  lot.status = "export_cleared";
  log(
    s,
    ctx,
    "offer.expired",
    "lot",
    lot.id,
    `No domestic acceptance for ${lot.id}; ${certNo} issued. Royalty ₦${valuation.royaltyNgn.toLocaleString("en-NG")} due from ${findParticipant(s, lot.ownerId).legalName}.`,
  );
  return certificate;
}

export function expireDueOffers(s: DemoState, ctx: Ctx): Certificate[] {
  const due = s.offers.filter((o) => o.status === "open" && o.closesAt <= ctx.nowIso);
  return due.map((o) => expireOffer(s, ctx, { offerId: o.id }));
}

// ---------------------------------------------------------------- settlement

function requireAcceptorOrOfficer(s: DemoState, ctx: Ctx, acceptance: Acceptance) {
  if (ctx.actorId !== acceptance.acceptorId && !isOfficer(s, ctx.actorId)) {
    throw new WorkflowError("Only the accepting party or an NM-EX officer may do this.");
  }
}

export function recordPayment(
  s: DemoState,
  ctx: Ctx,
  input: { acceptanceId: string },
): Acceptance {
  const acc = findAcceptance(s, input.acceptanceId);
  requireAcceptorOrOfficer(s, ctx, acc);
  if (acc.paymentStatus === "paid") throw new WorkflowError("Already paid.");
  acc.paymentStatus = "paid";
  acc.paidAt = ctx.nowIso;
  const lot = findLot(s, acc.lotId);
  if (lot.kind === "concentrate") lot.status = "collection_pending";
  log(
    s,
    ctx,
    "acceptance.paid",
    "lot",
    lot.id,
    `Payment of ₦${(acc.valuation.totalPayableNgn ?? 0).toLocaleString("en-NG")} recorded for ${acc.certNo}.`,
  );
  return acc;
}

export function recordCollection(
  s: DemoState,
  ctx: Ctx,
  input: { acceptanceId: string },
): Acceptance {
  const acc = findAcceptance(s, input.acceptanceId);
  requireAcceptorOrOfficer(s, ctx, acc);
  if (acc.paymentStatus !== "paid") throw new WorkflowError("Record payment before collection.");
  if (acc.collectionStatus === "collected") throw new WorkflowError("Already collected.");
  acc.collectionStatus = "collected";
  acc.collectedAt = ctx.nowIso;
  const lot = findLot(s, acc.lotId);
  lot.status = "collected";
  log(s, ctx, "acceptance.collected", "lot", lot.id, `Material collected under ${acc.certNo}.`);
  return acc;
}

export function defaultAcceptance(
  s: DemoState,
  ctx: Ctx,
  input: { acceptanceId: string },
): Offer {
  requireOfficer(s, ctx);
  const acc = findAcceptance(s, input.acceptanceId);
  if (acc.paymentStatus === "paid") {
    throw new WorkflowError("Paid acceptances cannot be defaulted.");
  }
  const cert = findCertificate(s, acc.certNo);
  cert.status = "CANCELLED";
  cert.history.push({
    at: ctx.nowIso,
    status: "CANCELLED",
    byId: ctx.actorId,
    note: "Buyer default — material returned to the domestic market",
  });
  const lot = findLot(s, acc.lotId);
  lot.status = "verified";
  const acceptor = findParticipant(s, acc.acceptorId);
  log(
    s,
    ctx,
    "acceptance.defaulted",
    "lot",
    lot.id,
    `${acceptor.legalName} defaulted on ${acc.certNo}; certificate cancelled and lot re-offered.`,
  );
  return openOffer(s, ctx, { lotId: lot.id });
}

// ---------------------------------------------------------------- aggregation

export function createParentLot(
  s: DemoState,
  ctx: Ctx,
  input: { smelterId: string; childLotIds: string[] },
): ParentLot {
  const smelter = findParticipant(s, input.smelterId);
  requireApproved(smelter, "smelter");
  if (ctx.actorId !== smelter.id && !isOfficer(s, ctx.actorId)) {
    throw new WorkflowError("Only the smelter may aggregate its own lots.");
  }
  if (input.childLotIds.length === 0) throw new WorkflowError("Select at least one lot.");
  const children = input.childLotIds.map((id) => findLot(s, id));
  let totalKg = 0;
  let containedKg = 0;
  for (const child of children) {
    if (child.kind !== "concentrate") throw new WorkflowError(`${child.id} is not concentrate.`);
    if (child.status !== "collected") {
      throw new WorkflowError(`${child.id} has not been collected.`);
    }
    const acc = s.acceptances.find((a) => a.lotId === child.id && a.acceptorId === smelter.id);
    if (!acc) throw new WorkflowError(`${child.id} was not accepted by ${smelter.legalName}.`);
    totalKg += child.verifiedKg!;
    containedKg += child.verifiedKg! * (child.verifiedGradePct! / 100);
  }
  const parent: ParentLot = {
    id: parentLotId(s, yearOf(ctx.nowIso)),
    smelterId: smelter.id,
    childLotIds: children.map((c) => c.id),
    totalKg,
    containedTinKg: round2(containedKg),
    avgGradePct: round2((containedKg / totalKg) * 100),
    campaignId: null,
    createdAt: ctx.nowIso,
  };
  for (const child of children) {
    child.status = "aggregated";
    child.parentLotId = parent.id;
  }
  s.parentLots.push(parent);
  log(
    s,
    ctx,
    "parent_lot.created",
    "parent_lot",
    parent.id,
    `${smelter.legalName} aggregated ${children.length} child lot(s): ${totalKg} kg, ${parent.containedTinKg} kg Sn, ${parent.avgGradePct}% weighted grade. Royalty liabilities already transferred on acceptance.`,
  );
  return parent;
}

export function registerRefinedLot(
  s: DemoState,
  ctx: Ctx,
  input: { smelterId: string; parentLotIds: string[]; recoveredKg: number; purityPct: number },
): { campaign: Campaign; lot: Lot } {
  const smelter = findParticipant(s, input.smelterId);
  requireApproved(smelter, "smelter");
  if (ctx.actorId !== smelter.id && !isOfficer(s, ctx.actorId)) {
    throw new WorkflowError("Only the smelter may register its own refined output.");
  }
  if (input.parentLotIds.length === 0) throw new WorkflowError("Select at least one parent lot.");
  if (!(input.recoveredKg > 0)) throw new WorkflowError("Recovered weight must be positive.");
  if (!(input.purityPct > 0 && input.purityPct <= 100)) {
    throw new WorkflowError("Purity must be between 0 and 100%.");
  }
  const parents = input.parentLotIds.map((id) => findParentLot(s, id));
  let inputContainedKg = 0;
  for (const parent of parents) {
    if (parent.smelterId !== smelter.id) throw new WorkflowError(`${parent.id} is not yours.`);
    if (parent.campaignId) throw new WorkflowError(`${parent.id} is already smelted.`);
    inputContainedKg += parent.containedTinKg;
  }
  if (input.recoveredKg > inputContainedKg) {
    throw new WorkflowError(
      `Recovered tin (${input.recoveredKg} kg) cannot exceed contained tin (${inputContainedKg} kg).`,
    );
  }
  const campaignId = simpleId(s, "camp");
  const lot: Lot = {
    id: lotId(s, "refined", yearOf(ctx.nowIso)),
    kind: "refined",
    ownerId: smelter.id,
    status: "verified",
    declaredKg: input.recoveredKg,
    declaredGradePct: input.purityPct,
    verifiedKg: input.recoveredKg,
    verifiedGradePct: input.purityPct,
    verifiedAt: ctx.nowIso,
    verifiedBy: ctx.actorId,
    assayPriceRef: ctx.priceRef(),
    parentLotId: parents.length === 1 ? parents[0].id : null,
    campaignId,
    purchaseIds: [],
    createdAt: ctx.nowIso,
  };
  const campaign: Campaign = {
    id: campaignId,
    smelterId: smelter.id,
    parentLotIds: parents.map((p) => p.id),
    inputContainedKg: round2(inputContainedKg),
    recoveredKg: input.recoveredKg,
    recoveryPct: round2((input.recoveredKg / inputContainedKg) * 100),
    refinedLotId: lot.id,
    createdAt: ctx.nowIso,
  };
  for (const parent of parents) {
    parent.campaignId = campaignId;
    for (const childId of parent.childLotIds) findLot(s, childId).status = "smelted";
  }
  s.campaigns.push(campaign);
  s.lots.push(lot);
  log(
    s,
    ctx,
    "refined.registered",
    "lot",
    lot.id,
    `${smelter.legalName} registered ${input.recoveredKg} kg refined tin @ ${input.purityPct}% from ${campaign.inputContainedKg} kg contained (${campaign.recoveryPct}% recovery) across ${parents.map((p) => p.id).join(", ")}.`,
  );
  openOffer(s, ctx, { lotId: lot.id });
  return { campaign, lot };
}

// ---------------------------------------------------------------- certificates

const TERMINAL: CertificateStatus[] = ["UTILIZED", "CANCELLED", "SUPERSEDED"];

export function setCertificateStatus(
  s: DemoState,
  ctx: Ctx,
  input: { certNo: string; status: CertificateStatus; note: string | null },
): Certificate {
  const actor = s.participants.find((p) => p.id === ctx.actorId);
  const allowed =
    isOfficer(s, ctx.actorId) ||
    actor?.role === "verifier" ||
    ctx.actorId.startsWith("verifier");
  if (!allowed) throw new WorkflowError("Only NM-EX officers or appointed verifiers may do this.");
  if (!isOfficer(s, ctx.actorId) && input.status !== "UTILIZED" && input.status !== "UNDER_REVIEW") {
    throw new WorkflowError("Verifiers may only mark a certificate utilized or under review.");
  }
  const cert = findCertificate(s, input.certNo);
  if (cert.status === input.status) throw new WorkflowError(`Certificate is already ${input.status}.`);
  if (TERMINAL.includes(cert.status)) {
    throw new WorkflowError(`A ${cert.status} certificate cannot change status.`);
  }
  if (input.status === "UTILIZED" && cert.cls === "DMO-A") {
    throw new WorkflowError("Only export clearance certificates can be utilized for export.");
  }
  cert.status = input.status;
  cert.history.push({ at: ctx.nowIso, status: input.status, byId: ctx.actorId, note: input.note });
  if (input.status === "UTILIZED") findLot(s, cert.lotId).status = "utilized";
  log(
    s,
    ctx,
    `certificate.${input.status.toLowerCase()}`,
    "certificate",
    cert.certNo,
    `${cert.certNo} → ${input.status}${input.note ? ` — ${input.note}` : ""}`,
  );
  return cert;
}

// ---------------------------------------------------------------- policy & clock

export function updatePolicy(s: DemoState, ctx: Ctx, patch: Partial<DmoPolicy>): DmoPolicy {
  requireOfficer(s, ctx);
  const changed = Object.keys(patch).filter(
    (k) =>
      JSON.stringify(patch[k as keyof DmoPolicy]) !==
      JSON.stringify(s.policy[k as keyof DmoPolicy]),
  );
  Object.assign(s.policy, patch);
  log(s, ctx, "policy.updated", "policy", "policy", changed.length ? `Changed: ${changed.join(", ")}.` : "No changes.");
  return s.policy;
}

export function advanceClock(s: DemoState, ctx: Ctx, input: { hours: number }): Certificate[] {
  requireOfficer(s, ctx);
  s.clockOffsetMs += input.hours * 3_600_000;
  const nowIso = addHours(ctx.nowIso, input.hours);
  log(s, { ...ctx, nowIso }, "demo.clock_advanced", "demo", "clock", `Demo clock advanced ${input.hours} h.`);
  return expireDueOffers(s, { ...ctx, actorId: "system", nowIso });
}
