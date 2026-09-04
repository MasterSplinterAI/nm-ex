import { placeFromAddress } from "./facilities";
import type { Acceptance, DemoState, Inspection, Lot, Offer, Participant, PurchaseEntry } from "./types";
import { referenceValueNgn } from "./valuation";

export const VARIANCE_LIMIT_PCT = 0.5;

export type LotBundle = {
  lot: Lot;
  supplier: Participant;
  inspection: Inspection | null;
  offer: Offer | null;
  acceptance: Acceptance | null;
  buyer: Participant | null;
  purchases: PurchaseEntry[];
  purchaseCostNgn: number;
};

export function lotBundle(s: DemoState, lotId: string): LotBundle | null {
  const lot = s.lots.find((l) => l.id === lotId);
  if (!lot) return null;
  const supplier = s.participants.find((p) => p.id === lot.ownerId);
  if (!supplier) return null;
  const inspection = s.inspections.find((i) => i.lotId === lot.id) ?? null;
  const offers = s.offers.filter((o) => o.lotId === lot.id);
  const offer = offers.length ? offers[offers.length - 1] : null;
  const acceptance = offer?.acceptanceId ? s.acceptances.find((a) => a.id === offer.acceptanceId) ?? null : null;
  const buyer = acceptance ? s.participants.find((p) => p.id === acceptance.acceptorId) ?? null : null;
  const purchases = s.purchases.filter((p) => lot.purchaseIds.includes(p.id));
  const purchaseCostNgn = purchases.reduce((n, p) => n + p.valueNgn, 0);
  return { lot, supplier, inspection, offer, acceptance, buyer, purchases, purchaseCostNgn };
}

export function variance(declared: number, verified: number | null) {
  if (verified == null || declared === 0) return { diff: null, pct: null, within: false };
  const diff = verified - declared;
  const pct = (diff / declared) * 100;
  return { diff, pct, within: Math.abs(pct) <= VARIANCE_LIMIT_PCT };
}

export function lotEconomics(lot: Lot, policy: DemoState["policy"], lmeUsd: number, fxRate: number) {
  const kg = lot.verifiedKg ?? lot.declaredKg;
  const grade = lot.verifiedGradePct ?? lot.declaredGradePct;
  const reference = referenceValueNgn(kg / 1000, grade, lmeUsd, fxRate);
  const coef = lot.kind === "concentrate" ? policy.coefToSmelter : 1;
  const listing = reference * coef;
  const vat = listing * (policy.vatPct / 100);
  const royalty = reference * (policy.royaltyPct / 100);
  const containedKg = kg * (grade / 100);
  return { kg, grade, containedKg, reference, coef, listing, vat, royalty, lmeUsd, fxRate };
}

export function originLine(p: Participant): string {
  return placeFromAddress(p.address);
}

export type AssayStep = { id: string; label: string; at: string | null; done: boolean; current: boolean };

export function assaySteps(b: LotBundle): AssayStep[] {
  const { lot, inspection, offer } = b;
  const received = inspection?.sampleReceivedAt ?? (inspection && inspection.status !== "awaiting_sample" ? inspection.createdAt : null);
  const weighed = lot.verifiedAt;
  const assayed = lot.verifiedAt;
  const published = lot.verifiedAt;
  const posted = offer != null;
  const steps: Omit<AssayStep, "current">[] = [
    { id: "received", label: `Received at NM-EX${inspection ? ` (${shortFacility(inspection.warehouse)})` : ""}`, at: received ?? inspection?.createdAt ?? lot.createdAt, done: inspection != null },
    { id: "weigh", label: "Weighing (verified)", at: weighed, done: weighed != null },
    { id: "assay", label: "Sampling & assay", at: assayed, done: assayed != null },
    { id: "published", label: "Results published", at: published, done: published != null },
    { id: "pool", label: posted ? (offer?.status === "open" ? "Posted to National Pool" : "National Pool") : "Posted to National Pool", at: offer?.opensAt ?? null, done: posted },
  ];
  const firstOpen = steps.findIndex((s) => !s.done);
  return steps.map((s, i) => ({ ...s, current: i === (firstOpen === -1 ? steps.length - 1 : firstOpen) }));
}

function shortFacility(warehouse: string): string {
  const dash = warehouse.lastIndexOf("—");
  return dash >= 0 ? warehouse.slice(dash + 1).trim() : warehouse;
}
