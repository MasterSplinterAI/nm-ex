import type { Role } from "./types";
import {
  inspectionQueue,
  openOffers,
  pendingAcceptances,
  pendingRegistrations,
  poolFor,
} from "./queries";
import type { DemoState } from "./types";
import { eligibleInventory } from "./workflow";

export type NavItem = {
  id: string;
  href: string;
  label: string;
  badge?: number;
  group?: string;
};

export type NavCounts = Record<string, number>;

export function navCounts(state: DemoState, participantId: string, role: Role): NavCounts {
  if (role === "officer") {
    return {
      registrations: pendingRegistrations(state).length,
      inspections: inspectionQueue(state).length,
      offers: openOffers(state).length,
      settlements: pendingAcceptances(state).length,
      certificates: state.certificates.length,
    };
  }
  if (role === "smelter") {
    const acceptances = state.acceptances.filter((a) => a.acceptorId === participantId);
    const pendingSettle = acceptances.filter((a) => {
      const cert = state.certificates.find((c) => c.certNo === a.certNo);
      return a.collectionStatus !== "collected" && cert?.status !== "CANCELLED";
    }).length;
    const collected = state.lots.filter(
      (l) => l.status === "collected" && acceptances.some((a) => a.lotId === l.id),
    ).length;
    const unsmelted = state.parentLots.filter((p) => p.smelterId === participantId && !p.campaignId).length;
    return {
      pool: poolFor(state, "smelters").length,
      acceptances: pendingSettle,
      inventory: collected,
      refined: unsmelted,
      certificates: state.certificates.filter((c) => c.supplierId === participantId || c.counterpartyId === participantId).length,
    };
  }
  if (role === "supplier") {
    const inv = eligibleInventory(state, participantId);
    const lots = state.lots.filter((l) => l.ownerId === participantId);
    const activeLots = lots.filter(
      (l) => !["utilized", "sold_domestic", "smelted", "aggregated", "collected"].includes(l.status),
    ).length;
    const ready = inv.tier1Kg >= state.policy.mmlTier1Kg || inv.tier2Kg >= state.policy.mmlTier2Kg;
    const listed = lots.filter((l) => state.offers.some((o) => o.lotId === l.id)).length;
    return {
      ledger: inv.entries.length,
      consolidate: ready ? 1 : 0,
      lots: activeLots,
      listing: listed,
      certificates: state.certificates.filter((c) => c.supplierId === participantId).length,
    };
  }
  if (role === "buyer") {
    return {
      pool: poolFor(state, "buyers").length,
      purchases: state.acceptances.filter((a) => a.acceptorId === participantId).length,
    };
  }
  return {
    clearances: state.certificates.filter((c) => c.cls !== "DMO-A").length,
  };
}

export function navFor(role: Role, counts: NavCounts): NavItem[] {
  switch (role) {
    case "officer":
      return [
        { id: "home", href: "/portal/admin", label: "Dashboard" },
        { id: "registrations", href: "/portal/admin?tab=registrations", label: "Registrations", badge: counts.registrations, group: "Operations" },
        { id: "inspections", href: "/portal/admin?tab=inspections", label: "Inspections", badge: counts.inspections, group: "Operations" },
        { id: "offers", href: "/portal/admin?tab=offers", label: "National Pool", badge: counts.offers, group: "Operations" },
        { id: "settlements", href: "/portal/admin?tab=settlements", label: "Settlements", badge: counts.settlements, group: "Operations" },
        { id: "certificates", href: "/portal/admin?tab=certificates", label: "Certificates", badge: counts.certificates, group: "Register" },
        { id: "reports", href: "/portal/admin?tab=reports", label: "Traceability report", group: "Register" },
        { id: "audit", href: "/portal/admin?tab=audit", label: "Audit trail", group: "Register" },
        { id: "policy", href: "/portal/admin?tab=policy", label: "Policy", group: "Control" },
        { id: "demo", href: "/portal/admin?tab=demo", label: "Demo controls", group: "Control" },
      ];
    case "smelter":
      return [
        { id: "home", href: "/portal/smelter", label: "Dashboard" },
        { id: "pool", href: "/portal/smelter?tab=pool", label: "National Pool", badge: counts.pool, group: "Market" },
        { id: "acceptances", href: "/portal/smelter?tab=acceptances", label: "Acceptances", badge: counts.acceptances, group: "Market" },
        { id: "inventory", href: "/portal/smelter?tab=inventory", label: "Inventory", badge: counts.inventory, group: "Plant" },
        { id: "refined", href: "/portal/smelter?tab=refined", label: "Refined output", badge: counts.refined, group: "Plant" },
        { id: "certificates", href: "/portal/smelter?tab=certificates", label: "Certificates & royalty", badge: counts.certificates, group: "Compliance" },
      ];
    case "supplier":
      return [
        { id: "home", href: "/portal/supplier", label: "Dashboard" },
        { id: "ledger", href: "/portal/supplier?tab=ledger", label: "Purchase logs", badge: counts.ledger },
        { id: "consolidate", href: "/portal/supplier?tab=consolidate", label: "Lot consolidation", badge: counts.consolidate },
        { id: "lots", href: "/portal/supplier?tab=lots", label: "Assay & inspection", badge: counts.lots },
        { id: "listing", href: "/portal/supplier?tab=listing", label: "National Pool", badge: counts.listing },
        { id: "certificates", href: "/portal/supplier?tab=certificates", label: "Certificates", badge: counts.certificates },
      ];
    case "buyer":
      return [
        { id: "home", href: "/portal/buyer", label: "Dashboard" },
        { id: "pool", href: "/portal/buyer?tab=pool", label: "Refined tin offered", badge: counts.pool },
        { id: "purchases", href: "/portal/buyer?tab=purchases", label: "My purchases", badge: counts.purchases },
      ];
    case "verifier":
      return [
        { id: "home", href: "/portal/verify", label: "Scan station" },
        { id: "register", href: "/portal/verify?tab=register", label: "Clearance register", badge: counts.clearances },
      ];
  }
}

export function tabFromSearch(tab: string | undefined): string {
  return tab && tab !== "overview" ? tab : "home";
}
