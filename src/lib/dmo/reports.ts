import { kgToMt, round2 } from "./money";
import type { DemoState, Lot, LotStatus } from "./types";

export type PipelineStage = {
  id: string;
  label: string;
  lots: number;
  kg: number;
  containedKg: number;
};

function containedOf(lot: Lot): number {
  const kg = lot.verifiedKg ?? lot.declaredKg;
  const grade = lot.verifiedGradePct ?? lot.declaredGradePct;
  return kg * (grade / 100);
}

function weightOf(lot: Lot): number {
  return lot.verifiedKg ?? lot.declaredKg;
}

function stage(id: string, label: string, lots: Lot[]): PipelineStage {
  return {
    id,
    label,
    lots: lots.length,
    kg: round2(lots.reduce((a, l) => a + weightOf(l), 0)),
    containedKg: round2(lots.reduce((a, l) => a + containedOf(l), 0)),
  };
}

const SETTLEMENT: LotStatus[] = ["accepted", "payment_pending", "paid", "collection_pending"];

/** National physical position of every concentrate and refined lot. */
export function nationalPipeline(s: DemoState): PipelineStage[] {
  const unallocatedKg = s.purchases.filter((p) => p.lotId == null).reduce((a, p) => a + p.kg, 0);
  const ledger: PipelineStage = {
    id: "ledger",
    label: "In shed ledgers",
    lots: 0,
    kg: round2(unallocatedKg),
    containedKg: round2(
      s.purchases.filter((p) => p.lotId == null).reduce((a, p) => a + p.kg * (p.gradePct / 100), 0),
    ),
  };
  return [
    ledger,
    stage(
      "inspection",
      "At warehouse / assay",
      s.lots.filter((l) => l.status === "submitted_for_inspection" || l.status === "sample_received"),
    ),
    stage("offered", "National Pool (open offer)", s.lots.filter((l) => l.status === "offered")),
    stage("settlement", "Accepted · settlement", s.lots.filter((l) => SETTLEMENT.includes(l.status))),
    stage("inventory", "Collected at smelter", s.lots.filter((l) => l.status === "collected")),
    stage("aggregated", "Parent lots / in furnace", s.lots.filter((l) => l.status === "aggregated" || l.status === "smelted")),
    stage(
      "refined",
      "Refined metal",
      s.lots.filter((l) => l.kind === "refined" && (l.status === "offered" || l.status === "verified")),
    ),
    stage("domestic", "Sold domestically", s.lots.filter((l) => l.status === "sold_domestic")),
    stage("cleared", "Export cleared (unused)", s.lots.filter((l) => l.status === "export_cleared")),
    stage("utilized", "Exported (utilized)", s.lots.filter((l) => l.status === "utilized")),
  ];
}

export type RoyaltyRow = {
  holderId: string;
  holder: string;
  kind: "exporter" | "smelter";
  certs: number;
  royaltyNgn: number;
  atTransferNgn: number;
};

export function royaltyByHolder(s: DemoState): RoyaltyRow[] {
  const map = new Map<string, RoyaltyRow>();
  for (const c of s.certificates) {
    if (c.status === "CANCELLED") continue;
    const holderId = c.valuation.royaltyLiabilityHolderId;
    const holder = s.participants.find((p) => p.id === holderId)?.legalName ?? holderId;
    const kind = c.cls === "DMO-A" ? "smelter" : "exporter";
    const row = map.get(holderId) ?? { holderId, holder, kind, certs: 0, royaltyNgn: 0, atTransferNgn: 0 };
    row.certs += 1;
    row.royaltyNgn += c.valuation.royaltyNgn;
    row.atTransferNgn += c.valuation.royaltyAtTransferNgn;
    map.set(holderId, row);
  }
  return [...map.values()].sort((a, b) => b.royaltyNgn - a.royaltyNgn);
}

export function certificateTally(s: DemoState) {
  const byClass = { "DMO-A": 0, "DMO-EC": 0, "DMO-ER": 0 };
  const byStatus: Record<string, number> = {};
  for (const c of s.certificates) {
    byClass[c.cls] += 1;
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
  }
  return { byClass, byStatus, total: s.certificates.length };
}

export function containedTinMt(s: DemoState): { inSystem: number; exported: number; domestic: number } {
  const pipe = nationalPipeline(s);
  const exported = pipe.find((p) => p.id === "utilized")?.containedKg ?? 0;
  const domestic = pipe.find((p) => p.id === "domestic")?.containedKg ?? 0;
  const inSystem = pipe
    .filter((p) => p.id !== "utilized" && p.id !== "domestic")
    .reduce((a, p) => a + p.containedKg, 0);
  return { inSystem: kgToMt(inSystem), exported: kgToMt(exported), domestic: kgToMt(domestic) };
}

export type SmelterVisibility = {
  poolLots: number;
  pendingPayment: number;
  pendingCollection: number;
  inventoryKg: number;
  inventoryContainedKg: number;
  parentLots: number;
  unsmeltedContainedKg: number;
  refinedKg: number;
  recoveryWeighted: number | null;
  royaltyHeldNgn: number;
  childLots: { id: string; kg: number; gradePct: number; status: LotStatus; certNo: string | null; parentLotId: string | null }[];
};

export function smelterVisibility(s: DemoState, smelterId: string): SmelterVisibility {
  const acceptances = s.acceptances.filter((a) => a.acceptorId === smelterId);
  const childLots = acceptances.map((a) => {
    const lot = s.lots.find((l) => l.id === a.lotId)!;
    return {
      id: lot.id,
      kg: lot.verifiedKg ?? 0,
      gradePct: lot.verifiedGradePct ?? 0,
      status: lot.status,
      certNo: a.certNo,
      parentLotId: lot.parentLotId,
    };
  });
  const inventory = s.lots.filter((l) => l.status === "collected" && acceptances.some((a) => a.lotId === l.id));
  const parents = s.parentLots.filter((p) => p.smelterId === smelterId);
  const unsmelted = parents.filter((p) => !p.campaignId);
  const campaigns = s.campaigns.filter((c) => c.smelterId === smelterId);
  const refined = s.lots.filter((l) => l.kind === "refined" && l.ownerId === smelterId);
  const royaltyHeldNgn = s.certificates
    .filter((c) => c.cls === "DMO-A" && c.counterpartyId === smelterId && c.status !== "CANCELLED")
    .reduce((a, c) => a + c.valuation.royaltyNgn, 0);
  const input = campaigns.reduce((a, c) => a + c.inputContainedKg, 0);
  const recovered = campaigns.reduce((a, c) => a + c.recoveredKg, 0);
  return {
    poolLots: s.offers.filter((o) => o.status === "open" && o.audience === "smelters").length,
    pendingPayment: acceptances.filter((a) => a.paymentStatus === "pending" && s.certificates.find((c) => c.certNo === a.certNo)?.status !== "CANCELLED").length,
    pendingCollection: acceptances.filter((a) => a.paymentStatus === "paid" && a.collectionStatus === "pending").length,
    inventoryKg: inventory.reduce((a, l) => a + (l.verifiedKg ?? 0), 0),
    inventoryContainedKg: inventory.reduce((a, l) => a + containedOf(l), 0),
    parentLots: parents.length,
    unsmeltedContainedKg: unsmelted.reduce((a, p) => a + p.containedTinKg, 0),
    refinedKg: refined.reduce((a, l) => a + (l.verifiedKg ?? 0), 0),
    recoveryWeighted: input > 0 ? round2((recovered / input) * 100) : null,
    royaltyHeldNgn,
    childLots,
  };
}
