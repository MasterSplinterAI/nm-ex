import type {
  CertificateClass,
  CertificateStatus,
  InspectionStatus,
  LotKind,
  LotStatus,
  ParticipantCategory,
  ParticipantStatus,
  Role,
} from "./types";

export const LOT_STATUS_LABEL: Record<LotStatus, string> = {
  in_ledger: "In ledger",
  submitted_for_inspection: "Submitted for inspection",
  sample_received: "Sample received",
  verified: "Verified",
  offered: "Offer open",
  accepted: "Offer accepted",
  payment_pending: "Payment pending",
  paid: "Paid",
  collection_pending: "Collection pending",
  collected: "Collected",
  aggregated: "Aggregated",
  smelted: "Smelted",
  expired: "No domestic offer",
  export_cleared: "Cleared for export",
  utilized: "Utilized — export completed",
  sold_domestic: "Sold — domestic",
};

export const INSPECTION_STATUS_LABEL: Record<InspectionStatus, string> = {
  awaiting_sample: "Awaiting sample",
  sample_received: "Sample received",
  verified: "Verified",
  rejected: "Rejected",
};

export const CERT_STATUS_LABEL: Record<CertificateStatus, string> = {
  VALID: "Valid",
  EXPIRED: "Expired",
  UTILIZED: "Utilized — export completed",
  CANCELLED: "Cancelled",
  SUSPENDED: "Suspended",
  UNDER_REVIEW: "Under review",
  SUPERSEDED: "Superseded",
};

export const CERT_CLASS_LABEL: Record<CertificateClass, string> = {
  "DMO-A": "DMO Acceptance",
  "DMO-EC": "DMO Export Clearance — Concentrate",
  "DMO-ER": "DMO Export Clearance — Refined Metal",
};

export function certClassTitle(
  cls: CertificateClass,
  kind: LotKind,
): { title: string; subtitle: string; banner: string } {
  switch (cls) {
    case "DMO-A":
      return {
        title: "Domestic-Offer-First Acceptance Certificate",
        subtitle: kind === "concentrate" ? "Tin Concentrate" : "Refined Tin / Tin Ingot",
        banner:
          kind === "concentrate"
            ? "SOLD TO QUALIFIED DOMESTIC SMELTER"
            : "SOLD TO QUALIFIED DOMESTIC BUYER",
      };
    case "DMO-EC":
      return {
        title: "Domestic-Offer-First Export Clearance Certificate",
        subtitle: "Tin Concentrate",
        banner: "NO DOMESTIC SMELTER OFFER — EXPORT BOUND",
      };
    case "DMO-ER":
      return {
        title: "Domestic-Offer-First Export Clearance Certificate",
        subtitle: "Refined Tin / Tin Ingot",
        banner: "NO DOMESTIC OFFER — EXPORT BOUND",
      };
  }
}

export const ROLE_LABEL: Record<Role, string> = {
  supplier: "Supplier (tin shed / aggregator)",
  smelter: "Qualified domestic smelter",
  buyer: "Domestic end user",
  officer: "NM-EX officer",
  verifier: "NESS / Customs verifier",
};

export const ROLE_SHORT: Record<Role, string> = {
  supplier: "Supplier",
  smelter: "Smelter",
  buyer: "Domestic buyer",
  officer: "NM-EX officer",
  verifier: "Verifier",
};

export const CATEGORY_LABEL: Record<ParticipantCategory, string> = {
  tin_shed: "Tin Shed / Mineral Buying Centre",
  mining_company: "Mining Company / Direct Producer",
  aggregator: "Licensed Aggregator",
  smelter: "Mineral Processor / Smelter",
  end_user: "Domestic End User (refined metal)",
};

export const CATEGORY_ROLE: Record<ParticipantCategory, Role> = {
  tin_shed: "supplier",
  mining_company: "supplier",
  aggregator: "supplier",
  smelter: "smelter",
  end_user: "buyer",
};

export const PARTICIPANT_STATUS_LABEL: Record<ParticipantStatus, string> = {
  pending: "Application received",
  under_review: "Under review",
  more_info: "Further information requested",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

export function commodityLabel(kind: LotKind): string {
  return kind === "concentrate" ? "Tin Concentrate" : "Refined Tin / Tin Ingot";
}
