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
  Participant,
  PriceRef,
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

/** Royalty liabilities currently held by a smelter (transferred on acceptance, not yet reconciled). */
export function royaltyLedgerFor(s: DemoState, smelterId: string): { total: number; rows: { certNo: string; lotId: string; royaltyNgn: number; at: string }[] } {
  const rows = s.certificates
    .filter((c) => c.cls === "DMO-A" && c.counterpartyId === smelterId && c.status !== "CANCELLED")
    .map((c) => ({ certNo: c.certNo, lotId: c.lotId, royaltyNgn: c.valuation.royaltyNgn, at: c.issuedAt }));
  return { total: rows.reduce((a, r) => a + r.royaltyNgn, 0), rows };
}
