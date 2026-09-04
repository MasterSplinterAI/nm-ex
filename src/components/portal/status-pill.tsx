import type { ReactNode } from "react";
import type { CertificateStatus, LotStatus, ParticipantStatus } from "@/lib/dmo/types";
import { CERT_STATUS_LABEL, LOT_STATUS_LABEL, PARTICIPANT_STATUS_LABEL } from "@/lib/dmo/labels";

export type Tone = "ok" | "warn" | "bad" | "muted" | "info";

const TONE: Record<Tone, string> = {
  ok: "bg-[var(--forest)]/10 text-[var(--forest)] border-[var(--forest)]/30",
  warn: "bg-[var(--copper)]/10 text-[var(--copper)] border-[var(--copper)]/30",
  bad: "bg-[#9b2c2c]/10 text-[#9b2c2c] border-[#9b2c2c]/30",
  muted: "bg-[var(--ink)]/5 text-[var(--ink-muted)] border-[var(--line)]",
  info: "bg-[#1f4b6b]/10 text-[#1f4b6b] border-[#1f4b6b]/30",
};

export function StatusPill({ tone, children, big = false }: { tone: Tone; children: ReactNode; big?: boolean }) {
  return (
    <span
      className={`inline-flex items-center border font-semibold uppercase tracking-[0.12em] ${TONE[tone]} ${
        big ? "px-3 py-1.5 text-xs" : "px-2 py-0.5 text-[10px]"
      }`}
    >
      {children}
    </span>
  );
}

export function certTone(status: CertificateStatus): Tone {
  switch (status) {
    case "VALID":
      return "ok";
    case "UTILIZED":
      return "info";
    case "UNDER_REVIEW":
    case "SUSPENDED":
      return "warn";
    default:
      return "bad";
  }
}

export function CertStatusPill({ status, big = false }: { status: CertificateStatus; big?: boolean }) {
  return (
    <StatusPill tone={certTone(status)} big={big}>
      {CERT_STATUS_LABEL[status]}
    </StatusPill>
  );
}

export function lotTone(status: LotStatus): Tone {
  switch (status) {
    case "offered":
    case "verified":
      return "ok";
    case "payment_pending":
    case "collection_pending":
    case "submitted_for_inspection":
    case "sample_received":
      return "warn";
    case "export_cleared":
    case "utilized":
    case "expired":
      return "info";
    case "sold_domestic":
    case "collected":
    case "paid":
    case "aggregated":
    case "smelted":
      return "muted";
    default:
      return "muted";
  }
}

export function LotStatusPill({ status }: { status: LotStatus }) {
  return <StatusPill tone={lotTone(status)}>{LOT_STATUS_LABEL[status]}</StatusPill>;
}

export function participantTone(status: ParticipantStatus): Tone {
  switch (status) {
    case "approved":
      return "ok";
    case "rejected":
    case "suspended":
      return "bad";
    default:
      return "warn";
  }
}

export function ParticipantStatusPill({ status }: { status: ParticipantStatus }) {
  return <StatusPill tone={participantTone(status)}>{PARTICIPANT_STATUS_LABEL[status]}</StatusPill>;
}
