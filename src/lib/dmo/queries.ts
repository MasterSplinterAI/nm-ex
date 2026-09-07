import { certClassTitle, commodityLabel } from "./labels";
import type {
  Acceptance,
  AuditEvent,
  Certificate,
  CertificateClass,
  CertificateStatus,
  DemoState,
  Inspection,
  Lot,
  Offer,
  OfferAudience,
  ParentLot,
  Participant,
  PriceRef,
  PurchaseEntry,
  StatusChange,
  Valuation,
} from "./types";
import { eligibleInventory } from "./workflow";

export function participantById(s: DemoState, id: string | null): Participant | null {
  if (!id) return null;
  return s.participants.find((p) => p.id === id) ?? null;
}

export function participantName(s: DemoState, id: string | null): string {
  return participantById(s, id)?.legalName ?? "—";
}

export function lotsFor(s: DemoState, ownerId: string): Lot[] {
  return s.lots
    .filter((l) => l.ownerId === ownerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function inventoryFor(s: DemoState, supplierId: string) {
  return eligibleInventory(s, supplierId);
}

/** Every purchase this supplier recorded, allocated to a lot or not. */
export function purchasesFor(s: DemoState, supplierId: string): PurchaseEntry[] {
  return s.purchases
    .filter((p) => p.supplierId === supplierId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

/** The parcels locked into a lot — the reverse of `PurchaseEntry.lotId`. */
export function purchasesForLot(s: DemoState, lotId: string): PurchaseEntry[] {
  return s.purchases
    .filter((p) => p.lotId === lotId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

export function purchaseById(s: DemoState, id: string): PurchaseEntry | null {
  return s.purchases.find((p) => p.id === id) ?? null;
}

/**
 * Parcels this participant sold to someone else's shed. The mirror image of
 * `purchasesFor`, so a registered miner sees its own side of the trade.
 */
export function salesToShedsFor(s: DemoState, minerId: string): PurchaseEntry[] {
  return s.purchases
    .filter((p) => p.sourceParticipantId === minerId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

/** Approved participants a shed may record a purchase against. */
export function registeredSellers(s: DemoState, exceptId: string): Participant[] {
  return s.participants
    .filter((p) => p.role === "supplier" && p.status === "approved" && p.id !== exceptId)
    .sort((a, b) => a.legalName.localeCompare(b.legalName));
}

export function inspectionsFor(s: DemoState, supplierId: string): Inspection[] {
  const owned = new Set(lotsFor(s, supplierId).map((l) => l.id));
  return s.inspections.filter((i) => owned.has(i.lotId));
}

export function parentLotsFor(s: DemoState, smelterId: string): ParentLot[] {
  return s.parentLots
    .filter((p) => p.smelterId === smelterId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Offers on lots this participant owns — the sell side, not the buy side. */
export function offersForOwner(s: DemoState, ownerId: string): Offer[] {
  const owned = new Set(lotsFor(s, ownerId).map((l) => l.id));
  return s.offers.filter((o) => owned.has(o.lotId)).sort((a, b) => b.opensAt.localeCompare(a.opensAt));
}

/** Acceptances of this participant's lots — who bought from them. */
export function acceptancesOfOwner(s: DemoState, ownerId: string): Acceptance[] {
  const owned = new Set(lotsFor(s, ownerId).map((l) => l.id));
  return s.acceptances.filter((a) => owned.has(a.lotId)).sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt));
}

/**
 * Everything the registry holds on one participant: what they did, what was
 * done to them, and every record that names them. Backs the officer dossier.
 */
export type ParticipantDossier = {
  participant: Participant;
  purchases: PurchaseEntry[];
  lots: Lot[];
  inspections: Inspection[];
  offers: Offer[];
  soldTo: Acceptance[];
  boughtLots: Acceptance[];
  parentLots: ParentLot[];
  certificates: Certificate[];
  audit: AuditEvent[];
};

export function participantDossier(s: DemoState, id: string): ParticipantDossier | null {
  const participant = participantById(s, id);
  if (!participant) return null;
  const audit = s.audit
    .filter((e) => e.actorId === id || e.subjectId === id)
    .sort((a, b) => b.at.localeCompare(a.at));
  return {
    participant,
    purchases: purchasesFor(s, id),
    lots: lotsFor(s, id),
    inspections: inspectionsFor(s, id),
    offers: offersForOwner(s, id),
    soldTo: acceptancesOfOwner(s, id),
    boughtLots: acceptancesFor(s, id),
    parentLots: parentLotsFor(s, id),
    certificates: certificatesFor(s, id),
    audit,
  };
}

export type PoolEntry = { offer: Offer; lot: Lot; supplier: Participant };

export function poolFor(s: DemoState, audience: OfferAudience): PoolEntry[] {
  return s.offers
    .filter((o) => o.status === "open" && o.audience === audience)
    .map((offer) => {
      const lot = s.lots.find((l) => l.id === offer.lotId)!;
      const supplier = s.participants.find((p) => p.id === lot.ownerId)!;
      return { offer, lot, supplier };
    })
    .sort((a, b) => a.offer.closesAt.localeCompare(b.offer.closesAt));
}

export function offerForLot(s: DemoState, lotId: string): Offer | null {
  const offers = s.offers.filter((o) => o.lotId === lotId);
  return offers.length ? offers[offers.length - 1] : null;
}

export function inspectionForLot(s: DemoState, lotId: string): Inspection | null {
  return s.inspections.find((i) => i.lotId === lotId) ?? null;
}

export function acceptancesFor(s: DemoState, acceptorId: string): Acceptance[] {
  return s.acceptances
    .filter((a) => a.acceptorId === acceptorId)
    .sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt));
}

export function certificatesFor(s: DemoState, participantId: string): Certificate[] {
  return s.certificates
    .filter((c) => c.supplierId === participantId || c.counterpartyId === participantId)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export function certificatesForLot(s: DemoState, lotId: string): Certificate[] {
  return s.certificates.filter((c) => c.lotId === lotId);
}

export function auditFor(s: DemoState, subjectId: string): AuditEvent[] {
  return s.audit.filter((e) => e.subjectId === subjectId);
}

export function auditTail(s: DemoState, n: number): AuditEvent[] {
  return s.audit.slice(-n).reverse();
}

export function pendingRegistrations(s: DemoState): Participant[] {
  return s.participants
    .filter((p) => p.status === "pending" || p.status === "under_review" || p.status === "more_info")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function inspectionQueue(s: DemoState): { inspection: Inspection; lot: Lot; supplier: Participant }[] {
  return s.inspections
    .filter((i) => i.status === "awaiting_sample" || i.status === "sample_received")
    .map((inspection) => {
      const lot = s.lots.find((l) => l.id === inspection.lotId)!;
      const supplier = s.participants.find((p) => p.id === lot.ownerId)!;
      return { inspection, lot, supplier };
    })
    .sort((a, b) => a.inspection.createdAt.localeCompare(b.inspection.createdAt));
}

export function openOffers(s: DemoState): PoolEntry[] {
  return [...poolFor(s, "smelters"), ...poolFor(s, "buyers")];
}

export function pendingAcceptances(s: DemoState): { acceptance: Acceptance; lot: Lot; acceptor: Participant }[] {
  return s.acceptances
    .filter((a) => a.paymentStatus === "pending" || a.collectionStatus === "pending")
    .map((acceptance) => ({
      acceptance,
      lot: s.lots.find((l) => l.id === acceptance.lotId)!,
      acceptor: s.participants.find((p) => p.id === acceptance.acceptorId)!,
    }))
    .filter(({ lot }) => lot.kind === "concentrate")
    .sort((a, b) => a.acceptance.deadlineAt.localeCompare(b.acceptance.deadlineAt));
}

export type CertificatePublicView = {
  certNo: string;
  cls: CertificateClass;
  title: string;
  subtitle: string;
  status: CertificateStatus;
  commodity: string;
  verifiedMt: number;
  verifiedGradePct: number;
  containedTinMt: number;
  lotId: string;
  parentLotId: string | null;
  issuedAt: string;
  utilized: boolean;
};

export type CertificateFullView = CertificatePublicView & {
  certificate: Certificate;
  lot: Lot;
  supplier: Participant;
  counterparty: Participant | null;
  valuation: Valuation;
  priceRef: PriceRef;
  offer: Offer;
  acceptance: Acceptance | null;
  history: StatusChange[];
  audit: AuditEvent[];
};

export function certificatePublicView(s: DemoState, certNo: string): CertificatePublicView | null {
  const c = s.certificates.find((x) => x.certNo === certNo.trim().toUpperCase());
  if (!c) return null;
  const lot = s.lots.find((l) => l.id === c.lotId)!;
  const heading = certClassTitle(c.cls, lot.kind);
  return {
    certNo: c.certNo,
    cls: c.cls,
    title: heading.title,
    subtitle: heading.subtitle,
    status: c.status,
    commodity: commodityLabel(lot.kind),
    verifiedMt: c.valuation.weightMt,
    verifiedGradePct: c.valuation.gradePct,
    containedTinMt: c.valuation.containedTinMt,
    lotId: lot.id,
    parentLotId: lot.parentLotId,
    issuedAt: c.issuedAt,
    utilized: c.status === "UTILIZED",
  };
}

export function certificateFullView(s: DemoState, certNo: string): CertificateFullView | null {
  const pub = certificatePublicView(s, certNo);
  if (!pub) return null;
  const c = s.certificates.find((x) => x.certNo === pub.certNo)!;
  const lot = s.lots.find((l) => l.id === c.lotId)!;
  return {
    ...pub,
    certificate: c,
    lot,
    supplier: s.participants.find((p) => p.id === c.supplierId)!,
    counterparty: participantById(s, c.counterpartyId),
    valuation: c.valuation,
    priceRef: c.priceRef,
    offer: s.offers.find((o) => o.id === c.offerId)!,
    acceptance: c.acceptanceId ? s.acceptances.find((a) => a.id === c.acceptanceId) ?? null : null,
    history: c.history,
    audit: [...auditFor(s, lot.id), ...auditFor(s, c.certNo)].sort((a, b) => a.at.localeCompare(b.at)),
  };
}

/**
 * One royalty liability: what was assessed, who carries it, whether it falls due
 * now or was transferred onward, and whether NM-EX has been paid.
 */
export type RoyaltyPosition = {
  certNo: string;
  cls: CertificateClass;
  lotId: string;
  /** Who owes it now. */
  holderId: string;
  holder: string;
  /** Who the lot came from, so an officer can trace the liability back. */
  supplierId: string;
  supplier: string;
  assessedNgn: number;
  /** Zero on a DMO-A: the liability moved to the smelter rather than falling due. */
  dueNowNgn: number;
  transferred: boolean;
  settled: boolean;
  settledAt: string | null;
  settlementRef: string | null;
  certStatus: CertificateStatus;
  issuedAt: string;
};

export function royaltyPositions(s: DemoState): RoyaltyPosition[] {
  return s.certificates
    .filter((c) => c.status !== "CANCELLED" && c.valuation.royaltyNgn > 0)
    .map((c) => {
      const holderId = c.valuation.royaltyLiabilityHolderId;
      const settlement = c.royaltySettlement ?? null;
      return {
        certNo: c.certNo,
        cls: c.cls,
        lotId: c.lotId,
        holderId,
        holder: participantName(s, holderId),
        supplierId: c.supplierId,
        supplier: participantName(s, c.supplierId),
        assessedNgn: c.valuation.royaltyNgn,
        dueNowNgn: c.valuation.royaltyAtTransferNgn,
        transferred: c.cls === "DMO-A",
        settled: settlement != null,
        settledAt: settlement?.at ?? null,
        settlementRef: settlement?.reference ?? null,
        certStatus: c.status,
        issuedAt: c.issuedAt,
      };
    })
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export type RoyaltyTotals = {
  assessed: number;
  settled: number;
  outstanding: number;
  /** Sitting with smelters because a DMO-A moved it there. */
  heldBySmelters: number;
  /** Falls due from an exporter before the clearance can be used. */
  dueAtExport: number;
};

export function royaltyTotals(rows: RoyaltyPosition[]): RoyaltyTotals {
  const assessed = rows.reduce((n, r) => n + r.assessedNgn, 0);
  const settled = rows.filter((r) => r.settled).reduce((n, r) => n + r.assessedNgn, 0);
  return {
    assessed,
    settled,
    outstanding: assessed - settled,
    heldBySmelters: rows.filter((r) => r.transferred && !r.settled).reduce((n, r) => n + r.assessedNgn, 0),
    dueAtExport: rows.filter((r) => !r.transferred && !r.settled).reduce((n, r) => n + r.dueNowNgn, 0),
  };
}

/** Royalty liabilities currently held by a smelter (transferred on acceptance, not yet reconciled). */
export function royaltyLedgerFor(s: DemoState, smelterId: string): { total: number; rows: { certNo: string; lotId: string; royaltyNgn: number; at: string }[] } {
  const rows = s.certificates
    .filter((c) => c.cls === "DMO-A" && c.counterpartyId === smelterId && c.status !== "CANCELLED")
    .map((c) => ({ certNo: c.certNo, lotId: c.lotId, royaltyNgn: c.valuation.royaltyNgn, at: c.issuedAt }));
  return { total: rows.reduce((a, r) => a + r.royaltyNgn, 0), rows };
}
