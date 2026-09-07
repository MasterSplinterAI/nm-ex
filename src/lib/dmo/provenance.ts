import { participantById, purchasesForLot } from "./queries";
import type {
  Acceptance,
  Campaign,
  Certificate,
  DemoState,
  Lot,
  ParentLot,
  Participant,
  PurchaseEntry,
} from "./types";

/** One parcel as it was bought or raised, at the bottom of the chain. */
export type SourceParcel = {
  purchase: PurchaseEntry;
  containedKg: number;
};

/** Parcels rolled up by the pit or cooperative they came from. */
export type SourceTotal = {
  source: string;
  ownerId: string;
  owner: string;
  parcels: number;
  kg: number;
  containedKg: number;
  valueNgn: number;
};

/**
 * A concentrate lot as it entered the chain, with whoever owned it and the
 * parcels inside it.
 */
export type OriginLot = {
  lot: Lot;
  owner: Participant;
  /** The DMO-A that moved this lot — and its royalty — to a smelter. */
  acceptance: Acceptance | null;
  dmoA: Certificate | null;
  buyer: Participant | null;
  kg: number;
  gradePct: number;
  containedKg: number;
  parcels: SourceParcel[];
  /** Declared weight of the parcels, before NM-EX verified the lot. */
  declaredParcelKg: number;
};

export type ParentNode = {
  parentLot: ParentLot;
  children: OriginLot[];
  containedKg: number;
};

export type MassBalance = {
  /** Contained tin in the parcels as declared by the supplier. */
  declaredContainedKg: number;
  /** Contained tin after NM-EX verified each concentrate lot. */
  verifiedContainedKg: number;
  /** What the furnace was charged with. Null when nothing has been smelted. */
  inputContainedKg: number | null;
  recoveredKg: number | null;
  recoveryPct: number | null;
};

export type ProvenanceTree = {
  certificate: Certificate | null;
  /** The lot the certificate sits on — refined for a DMO-ER, concentrate otherwise. */
  lot: Lot;
  campaign: Campaign | null;
  smelter: Participant | null;
  /** Populated only when tracing back from refined metal. */
  parents: ParentNode[];
  /** Every concentrate lot at the base of the chain, however it was reached. */
  origins: OriginLot[];
  sources: SourceTotal[];
  massBalance: MassBalance;
  /** Everyone named anywhere in the chain, for a quick "who touched this". */
  participants: Participant[];
};

function containedOf(lot: Lot): number {
  const kg = lot.verifiedKg ?? lot.declaredKg;
  const grade = lot.verifiedGradePct ?? lot.declaredGradePct;
  return kg * (grade / 100);
}

function buildOrigin(s: DemoState, lot: Lot): OriginLot {
  const owner = participantById(s, lot.ownerId)!;
  const acceptance = s.acceptances.find((a) => a.lotId === lot.id) ?? null;
  const dmoA = acceptance ? s.certificates.find((c) => c.certNo === acceptance.certNo) ?? null : null;
  const parcels = purchasesForLot(s, lot.id).map((purchase) => ({
    purchase,
    containedKg: purchase.kg * (purchase.gradePct / 100),
  }));
  return {
    lot,
    owner,
    acceptance,
    dmoA,
    buyer: acceptance ? participantById(s, acceptance.acceptorId) : null,
    kg: lot.verifiedKg ?? lot.declaredKg,
    gradePct: lot.verifiedGradePct ?? lot.declaredGradePct,
    containedKg: containedOf(lot),
    parcels,
    declaredParcelKg: parcels.reduce((n, p) => n + p.purchase.kg, 0),
  };
}

function rollUpSources(origins: OriginLot[]): SourceTotal[] {
  const map = new Map<string, SourceTotal>();
  for (const origin of origins) {
    for (const { purchase, containedKg } of origin.parcels) {
      const key = `${origin.owner.id}::${purchase.source}`;
      const row =
        map.get(key) ??
        {
          source: purchase.source,
          ownerId: origin.owner.id,
          owner: origin.owner.legalName,
          parcels: 0,
          kg: 0,
          containedKg: 0,
          valueNgn: 0,
        };
      row.parcels += 1;
      row.kg += purchase.kg;
      row.containedKg += containedKg;
      row.valueNgn += purchase.valueNgn;
      map.set(key, row);
    }
  }
  return [...map.values()].sort((a, b) => b.containedKg - a.containedKg);
}

/**
 * Walk a certificate back to the ground it came out of.
 *
 * A refined export clearance resolves through its smelting campaign and parent
 * lots to every concentrate lot that was charged, and from there to the parcels
 * and the pits. A concentrate certificate resolves straight to its own parcels.
 */
export function provenanceTree(s: DemoState, ref: string): ProvenanceTree | null {
  const needle = ref.trim().toUpperCase();
  const certificate = s.certificates.find((c) => c.certNo === needle) ?? null;
  const lot = certificate
    ? s.lots.find((l) => l.id === certificate.lotId) ?? null
    : s.lots.find((l) => l.id === needle) ?? null;
  if (!lot) return null;

  const campaign = lot.campaignId ? s.campaigns.find((c) => c.id === lot.campaignId) ?? null : null;

  let parents: ParentNode[] = [];
  let origins: OriginLot[] = [];

  if (campaign) {
    parents = campaign.parentLotIds
      .map((id) => s.parentLots.find((p) => p.id === id))
      .filter((p): p is ParentLot => p != null)
      .map((parentLot) => {
        const children = parentLot.childLotIds
          .map((id) => s.lots.find((l) => l.id === id))
          .filter((l): l is Lot => l != null)
          .map((child) => buildOrigin(s, child));
        return {
          parentLot,
          children,
          containedKg: children.reduce((n, c) => n + c.containedKg, 0),
        };
      });
    origins = parents.flatMap((p) => p.children);
  } else if (lot.kind === "concentrate") {
    origins = [buildOrigin(s, lot)];
  }

  const sources = rollUpSources(origins);
  const smelter = campaign ? participantById(s, campaign.smelterId) : null;

  const seen = new Map<string, Participant>();
  for (const o of origins) {
    seen.set(o.owner.id, o.owner);
    if (o.buyer) seen.set(o.buyer.id, o.buyer);
  }
  if (smelter) seen.set(smelter.id, smelter);

  return {
    certificate,
    lot,
    campaign,
    smelter,
    parents,
    origins,
    sources,
    massBalance: {
      declaredContainedKg: origins.reduce(
        (n, o) => n + o.parcels.reduce((m, p) => m + p.containedKg, 0),
        0,
      ),
      verifiedContainedKg: origins.reduce((n, o) => n + o.containedKg, 0),
      inputContainedKg: campaign?.inputContainedKg ?? null,
      recoveredKg: campaign?.recoveredKg ?? null,
      recoveryPct: campaign?.recoveryPct ?? null,
    },
    participants: [...seen.values()],
  };
}

/**
 * The forward view: given a purchase, where did that parcel end up? Returns the
 * concentrate lot it was locked into and any certificate downstream of it.
 */
export function purchaseDestiny(
  s: DemoState,
  purchaseId: string,
): { lot: Lot; certificates: Certificate[]; refinedLot: Lot | null } | null {
  const purchase = s.purchases.find((p) => p.id === purchaseId);
  if (!purchase?.lotId) return null;
  const lot = s.lots.find((l) => l.id === purchase.lotId);
  if (!lot) return null;

  const certificates = s.certificates.filter((c) => c.lotId === lot.id);
  const parent = s.parentLots.find((p) => p.childLotIds.includes(lot.id)) ?? null;
  const campaign = parent?.campaignId ? s.campaigns.find((c) => c.id === parent.campaignId) ?? null : null;
  const refinedLot = campaign ? s.lots.find((l) => l.id === campaign.refinedLotId) ?? null : null;
  if (refinedLot) {
    certificates.push(...s.certificates.filter((c) => c.lotId === refinedLot.id));
  }
  return { lot, certificates, refinedLot };
}
