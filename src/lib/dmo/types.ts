export type Role = "supplier" | "smelter" | "buyer" | "officer" | "verifier";

export type ParticipantCategory =
  | "tin_shed"
  | "mining_company"
  | "aggregator"
  | "smelter"
  | "end_user";

export type ParticipantStatus =
  | "pending"
  | "under_review"
  | "more_info"
  | "approved"
  | "rejected"
  | "suspended";

export type UploadedDoc = { name: string; type: string };

export type Participant = {
  id: string;
  regNo: string | null;
  role: Role;
  category: ParticipantCategory | null;
  legalName: string;
  address: string;
  contactName: string;
  phone: string;
  email: string;
  status: ParticipantStatus;
  documents: UploadedDoc[];
  reviewNote: string | null;
  createdAt: string;
};

export type PurchaseEntry = {
  id: string;
  supplierId: string;
  date: string;
  source: string;
  kg: number;
  gradePct: number;
  valueNgn: number;
  reference: string;
  lotId: string | null;
  createdAt: string;
};

export type PriceRef = { lmeUsd: number; fxRate: number; at: string };

export type LotKind = "concentrate" | "refined";

export type LotStatus =
  | "in_ledger"
  | "submitted_for_inspection"
  | "sample_received"
  | "verified"
  | "offered"
  | "accepted"
  | "payment_pending"
  | "paid"
  | "collection_pending"
  | "collected"
  | "aggregated"
  | "smelted"
  | "expired"
  | "export_cleared"
  | "utilized"
  | "sold_domestic";

export type Lot = {
  id: string;
  kind: LotKind;
  ownerId: string;
  status: LotStatus;
  declaredKg: number;
  declaredGradePct: number;
  verifiedKg: number | null;
  verifiedGradePct: number | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  assayPriceRef: PriceRef | null;
  parentLotId: string | null;
  campaignId: string | null;
  purchaseIds: string[];
  createdAt: string;
};

export type InspectionStatus =
  | "awaiting_sample"
  | "sample_received"
  | "verified"
  | "rejected";

export type Inspection = {
  id: string;
  lotId: string;
  submittedKg: number;
  warehouse: string;
  windowEndsAt: string;
  status: InspectionStatus;
  sampleReceivedAt: string | null;
  createdAt: string;
};

export type OfferAudience = "smelters" | "buyers";
export type OfferStatus = "open" | "accepted" | "expired" | "withdrawn";

export type Offer = {
  id: string;
  lotId: string;
  audience: OfferAudience;
  opensAt: string;
  closesAt: string;
  status: OfferStatus;
  acceptanceId: string | null;
  certNo: string | null;
};

export type Acceptance = {
  id: string;
  offerId: string;
  lotId: string;
  acceptorId: string;
  acceptedAt: string;
  deadlineAt: string;
  paymentStatus: "pending" | "paid";
  paidAt: string | null;
  collectionStatus: "pending" | "collected";
  collectedAt: string | null;
  priceRef: PriceRef;
  valuation: Valuation;
  certNo: string;
};

export type CertificateClass = "DMO-A" | "DMO-EC" | "DMO-ER";

export type CertificateStatus =
  | "VALID"
  | "EXPIRED"
  | "UTILIZED"
  | "CANCELLED"
  | "SUSPENDED"
  | "UNDER_REVIEW"
  | "SUPERSEDED";

export type StatusChange = {
  at: string;
  status: CertificateStatus;
  byId: string;
  note: string | null;
};

export type Certificate = {
  certNo: string;
  cls: CertificateClass;
  lotId: string;
  offerId: string;
  acceptanceId: string | null;
  supplierId: string;
  counterpartyId: string | null;
  issuedAt: string;
  status: CertificateStatus;
  priceRef: PriceRef;
  valuation: Valuation;
  supersedes: string | null;
  history: StatusChange[];
};

export type Valuation = {
  weightMt: number;
  gradePct: number;
  containedTinMt: number;
  lmeUsd: number;
  fxRate: number;
  referenceValueNgn: number;
  procurementCoef: number | null;
  purchaseValueNgn: number | null;
  vatPct: number;
  vatNgn: number | null;
  totalPayableNgn: number | null;
  royaltyPct: number;
  royaltyNgn: number;
  royaltyAtTransferNgn: number;
  royaltyLiabilityHolderId: string;
};

export type ParentLot = {
  id: string;
  smelterId: string;
  childLotIds: string[];
  totalKg: number;
  containedTinKg: number;
  avgGradePct: number;
  campaignId: string | null;
  createdAt: string;
};

export type Campaign = {
  id: string;
  smelterId: string;
  parentLotIds: string[];
  inputContainedKg: number;
  recoveredKg: number;
  recoveryPct: number;
  refinedLotId: string;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  actorId: string;
  actorLabel: string;
  action: string;
  subjectType: string;
  subjectId: string;
  detail: string;
};

export type DmoPolicy = {
  coefMinerToAggregator: number;
  coefToSmelter: number;
  ompCoefficient: number | null;
  royaltyPct: number;
  vatPct: number;
  recoveryPct: number;
  mmlTier1Kg: number;
  mmlTier2Kg: number;
  tier1MinGradePct: number;
  sampleWindowHours: number;
  offerPeriodDays: number;
  paymentWindowDays: number;
  requiredDocuments: Record<ParticipantCategory, string[]>;
  warehouses: string[];
};

export type DemoState = {
  version: 1;
  seededAt: string;
  clockOffsetMs: number;
  policy: DmoPolicy;
  participants: Participant[];
  purchases: PurchaseEntry[];
  lots: Lot[];
  inspections: Inspection[];
  offers: Offer[];
  acceptances: Acceptance[];
  certificates: Certificate[];
  parentLots: ParentLot[];
  campaigns: Campaign[];
  audit: AuditEvent[];
  counters: Record<string, number>;
};

export class WorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowError";
  }
}
