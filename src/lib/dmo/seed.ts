import type { SpotBoard } from "@/lib/types";
import { addDays } from "./clock";
import { priceRefFromBoard } from "./prices";
import type { DemoState, Participant, ParticipantCategory, Role, UploadedDoc } from "./types";
import {
  acceptOffer,
  addPurchase,
  createParentLot,
  emptyState,
  expireOffer,
  markSampleReceived,
  recordCollection,
  recordPayment,
  registerRefinedLot,
  reviewRegistration,
  submitForInspection,
  submitRegistration,
  verifyLot,
  type Ctx,
} from "./workflow";

export const SEED_IDS = {
  officer: "part-officer",
  verifier: "part-verifier",
  solex: "part-solex",
  united: "part-united",
  solder: "part-solder",
  wamba: "part-wamba",
} as const;

export const DEMO_PASSWORD_DEFAULT = "nmex-demo";

type SeedParticipant = {
  id: string;
  role: Role;
  category: ParticipantCategory | null;
  legalName: string;
  address: string;
  contactName: string;
  phone: string;
  email: string;
  documents: UploadedDoc[];
  approve: boolean;
};

const PARTICIPANTS: SeedParticipant[] = [
  {
    id: SEED_IDS.officer,
    role: "officer",
    category: null,
    legalName: "NM-EX Compliance & Market Operations",
    address: "Nigerian Metals Exchange, Abuja",
    contactName: "Director, Compliance & Market Operations",
    phone: "+234 809 000 0001",
    email: "compliance@nm-ex.com",
    documents: [],
    approve: true,
  },
  {
    id: SEED_IDS.verifier,
    role: "verifier",
    category: null,
    legalName: "Neroli Inspection Services (PIA)",
    address: "Apapa, Lagos",
    contactName: "Pre-Shipment Inspection Desk",
    phone: "+234 809 000 0002",
    email: "pia@neroli.example",
    documents: [],
    approve: true,
  },
  {
    id: SEED_IDS.solex,
    role: "supplier",
    category: "tin_shed",
    legalName: "Solex Tin Ltd",
    address: "7 Oladipo Street, GRA, Jos, Plateau State, Nigeria",
    contactName: "Mr. Tunde Oladipo",
    phone: "+234 803 555 7788",
    email: "info@solextin.com",
    documents: [
      { name: "MBC-Licence-2026.pdf", type: "application/pdf" },
      { name: "Tax-Clearance-2025.pdf", type: "application/pdf" },
      { name: "CAC-Certificate.pdf", type: "application/pdf" },
    ],
    approve: true,
  },
  {
    id: SEED_IDS.united,
    role: "smelter",
    category: "smelter",
    legalName: "United Smelters Ltd",
    address: "12 Industrial Way, Jos Road, Plateau State, Nigeria",
    contactName: "John A. Adewale",
    phone: "+234 801 234 5678",
    email: "info@unitedsmelters.ng",
    documents: [
      { name: "Mineral-Processing-Licence.pdf", type: "application/pdf" },
      { name: "Tax-Clearance-2025.pdf", type: "application/pdf" },
    ],
    approve: true,
  },
  {
    id: SEED_IDS.solder,
    role: "buyer",
    category: "end_user",
    legalName: "Lagos Solder Works Ltd",
    address: "Plot 14, Oba Akran Avenue, Ikeja, Lagos",
    contactName: "Mrs. Ngozi Eze",
    phone: "+234 802 777 1010",
    email: "procurement@lagossolder.ng",
    documents: [
      { name: "CAC-Certificate.pdf", type: "application/pdf" },
      { name: "Industrial-Use-Statement.pdf", type: "application/pdf" },
    ],
    approve: true,
  },
  {
    id: SEED_IDS.wamba,
    role: "supplier",
    category: "tin_shed",
    legalName: "Wamba Tin Shed",
    address: "Wamba, Nasarawa State",
    contactName: "Alhaji Musa Dauda",
    phone: "+234 806 411 2200",
    email: "wambatinshed@gmail.com",
    documents: [
      { name: "MBC-Licence-Wamba.pdf", type: "application/pdf" },
      { name: "Tax-Clearance-2025.jpg", type: "image/jpeg" },
    ],
    approve: false,
  },
];

function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

export function buildSeed(board: SpotBoard, nowIso: string): DemoState {
  const s = emptyState(nowIso);
  const at = (daysAgo: number, hourOffset = 0): string =>
    addDays(new Date(new Date(nowIso).getTime() + hourOffset * 3_600_000).toISOString(), -daysAgo);
  const ctx = (actorId: string, when: string): Ctx => ({
    actorId,
    nowIso: when,
    priceRef: () => priceRefFromBoard(board, when),
  });

  // Counters so seeded numbers line up with the sample certificates.
  s.counters["reg:SUP:2026"] = 455;
  s.counters["reg:SMEL:2026"] = 14;
  s.counters["reg:BUY:2026"] = 101;
  s.counters["cert:DMO-EC:concentrate:2026"] = 20;
  s.counters["cert:DMO-A:concentrate:2026"] = 26;
  s.counters["parent:2026"] = 40;
  s.counters["lot:concentrate:2026"] = 100;

  // 1–5. Participants.
  const byId: Record<string, Participant> = {};
  PARTICIPANTS.forEach((sp, index) => {
    const when = at(45 - index, 1);
    const p = submitRegistration(s, ctx("anon", when), sp);
    const oldId = p.id;
    p.id = sp.id;
    for (const e of s.audit) if (e.subjectId === oldId) e.subjectId = sp.id;
    if (sp.approve) {
      reviewRegistration(s, ctx(SEED_IDS.officer, addDays(when, 1)), {
        participantId: p.id,
        decision: "approved",
        note: sp.role === "officer" || sp.role === "verifier" ? "Authorised agency user" : "Documents verified",
      });
    }
    byId[sp.id] = p;
  });
  // Wamba stays pending, but the officer has opened the file.
  reviewRegistration(s, ctx(SEED_IDS.officer, at(1, 2)), {
    participantId: SEED_IDS.wamba,
    decision: "under_review",
    note: "Awaiting Mines Inspectorate cross-check of MBC licence",
  });
  byId[SEED_IDS.wamba].status = "pending";

  const solex = SEED_IDS.solex;
  const united = SEED_IDS.united;

  function seedLot(kg: number, gradePct: number, parcels: number, daysAgo: number) {
    const parcelKg = kg / parcels;
    for (let i = 0; i < parcels; i++) {
      addPurchase(s, ctx(solex, at(daysAgo + 2, i)), {
        supplierId: solex,
        date: dateOnly(at(daysAgo + 2)),
        source: i % 3 === 0 ? "Artisanal cooperative, Rayfield" : i % 3 === 1 ? "Barkin Ladi diggings" : "Bukuru washing site",
        kg: parcelKg,
        gradePct,
        valueNgn: Math.round(parcelKg * 43_500),
        reference: `RCPT-${String(daysAgo).padStart(2, "0")}${String(i).padStart(2, "0")}`,
      });
    }
    const { inspection } = submitForInspection(s, ctx(solex, at(daysAgo + 1)), {
      supplierId: solex,
      tier: 1,
      kg,
    });
    markSampleReceived(s, ctx(SEED_IDS.officer, at(daysAgo, 6)), { inspectionId: inspection.id });
    return verifyLot(s, ctx(SEED_IDS.officer, at(daysAgo, 10)), {
      inspectionId: inspection.id,
      verifiedKg: kg,
      verifiedGradePct: gradePct,
    });
  }

  function acceptPayCollect(lotIdValue: string, daysAgo: number) {
    const offer = s.offers.find((o) => o.lotId === lotIdValue && o.status === "open")!;
    const { acceptance } = acceptOffer(s, ctx(united, at(daysAgo)), { offerId: offer.id, acceptorId: united });
    recordPayment(s, ctx(united, at(daysAgo - 1)), { acceptanceId: acceptance.id });
    recordCollection(s, ctx(united, at(daysAgo - 2)), { acceptanceId: acceptance.id });
    return acceptance;
  }

  // 11. Refined lot with no domestic buyer → DMO-ER.
  const lotForRefined = seedLot(25_000, 78, 25, 30);
  acceptPayCollect(lotForRefined.id, 29);
  const parentA = createParentLot(s, ctx(united, at(26)), { smelterId: united, childLotIds: [lotForRefined.id] });
  registerRefinedLot(s, ctx(united, at(7)), {
    smelterId: united,
    parentLotIds: [parentA.id],
    recoveredKg: 18_525,
    purityPct: 99.95,
  });
  const refinedOfferA = s.offers.find((o) => o.audience === "buyers" && o.status === "open")!;
  expireOffer(s, ctx("system", refinedOfferA.closesAt), { offerId: refinedOfferA.id });

  // 12. Second refined lot, offer open to buyers (live domestic-sale moment).
  const lotForRefinedB = seedLot(8_000, 75, 8, 25);
  acceptPayCollect(lotForRefinedB.id, 24);
  const parentB = createParentLot(s, ctx(united, at(21)), { smelterId: united, childLotIds: [lotForRefinedB.id] });
  registerRefinedLot(s, ctx(united, at(1, 3)), {
    smelterId: united,
    parentLotIds: [parentB.id],
    recoveredKg: 5_700,
    purityPct: 99.95,
  });

  // 6. Concentrate offer expired naturally → DMO-EC (…-00021).
  const lotEC = seedLot(25_000, 78, 25, 6);
  const offerEC = s.offers.find((o) => o.lotId === lotEC.id)!;
  expireOffer(s, ctx("system", offerEC.closesAt), { offerId: offerEC.id });

  // 7. Three 1 MT child lots accepted, paid, collected → DMO-A 00029–00031.
  for (const grade of [72, 75, 78]) {
    const child = seedLot(1_000, grade, 1, 10);
    acceptPayCollect(child.id, 9);
  }

  // 8. 25 MT verified, offer open to smelters — the live acceptance moment.
  seedLot(25_000, 78, 25, 2);

  // 9. 1,200 kg submitted, awaiting sample (48 h window running).
  for (let i = 0; i < 12; i++) {
    addPurchase(s, ctx(solex, at(3, i)), {
      supplierId: solex,
      date: dateOnly(at(3)),
      source: "Kuru artisanal miners",
      kg: 100,
      gradePct: 72,
      valueNgn: 4_000_000,
      reference: `RCPT-K${String(i + 1).padStart(2, "0")}`,
    });
  }
  submitForInspection(s, ctx(solex, at(1, 1)), { supplierId: solex, tier: 1, kg: 1_200 });

  // 10. Ledger at 980 kg — the MML button is disabled until one more purchase.
  const sources = ["Rayfield cooperative", "Barkin Ladi diggings", "Bukuru washing site", "Kuru artisanal miners"];
  for (let i = 0; i < 19; i++) {
    const daysAgo = 5 - Math.floor(i / 4);
    addPurchase(s, ctx(solex, at(daysAgo, 9 + (i % 4))), {
      supplierId: solex,
      date: dateOnly(at(daysAgo)),
      source: sources[i % sources.length],
      kg: i === 18 ? 80 : 50,
      gradePct: 72,
      valueNgn: (i === 18 ? 80 : 50) * 43_500,
      reference: `RCPT-L${String(i + 1).padStart(2, "0")}`,
    });
  }

  s.audit.sort((a, b) => a.at.localeCompare(b.at));
  return s;
}
