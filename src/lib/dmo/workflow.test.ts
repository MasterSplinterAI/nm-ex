import { test } from "node:test";
import assert from "node:assert/strict";
import {
  acceptOffer,
  addPurchase,
  canSubmitLot,
  createParentLot,
  emptyState,
  expireOffer,
  markSampleReceived,
  recordCollection,
  recordPayment,
  registerRefinedLot,
  reviewRegistration,
  setCertificateStatus,
  submitForInspection,
  submitRegistration,
  verifyLot,
} from "./workflow";
import { WorkflowError, type DemoState, type PriceRef } from "./types";

const NOW = "2026-09-01T09:00:00.000Z";
const PRICE: PriceRef = { lmeUsd: 55_225, fxRate: 1_322, at: NOW };
const officer = { actorId: "officer-1", nowIso: NOW, priceRef: () => PRICE };

function approvedSupplier(state: DemoState) {
  const p = submitRegistration(state, { ...officer, actorId: "anon" }, {
    role: "supplier",
    category: "tin_shed",
    legalName: "Solex Tin Ltd",
    address: "7 Oladipo Street, GRA, Jos",
    contactName: "Tunde Oladipo",
    phone: "+234 803 555 7788",
    email: "info@solextin.com",
    documents: [{ name: "mbc-licence.pdf", type: "application/pdf" }],
  });
  reviewRegistration(state, officer, { participantId: p.id, decision: "approved", note: null });
  return p;
}

function approvedSmelter(state: DemoState) {
  const p = submitRegistration(state, { ...officer, actorId: "anon" }, {
    role: "smelter",
    category: "smelter",
    legalName: "United Smelters Ltd",
    address: "12 Industrial Way, Jos Road, Plateau State",
    contactName: "John A. Adewale",
    phone: "+234 801 234 5678",
    email: "info@unitedsmelters.ng",
    documents: [],
  });
  reviewRegistration(state, officer, { participantId: p.id, decision: "approved", note: null });
  return p;
}

function verified25t(state: DemoState, supplierId: string) {
  for (let i = 0; i < 25; i++) {
    addPurchase(state, { ...officer, actorId: supplierId }, {
      supplierId, date: "2026-08-20", source: "Artisanal miner", kg: 1000,
      gradePct: 78, valueNgn: 40_000_000, reference: `RCPT-${i}`,
    });
  }
  const { inspection } = submitForInspection(state, { ...officer, actorId: supplierId }, { supplierId, tier: 1, kg: 25_000 });
  markSampleReceived(state, officer, { inspectionId: inspection.id });
  return verifyLot(state, officer, { inspectionId: inspection.id, verifiedKg: 25_000, verifiedGradePct: 78 });
}

test("registration starts pending and approval assigns a registration number", () => {
  const s = emptyState(NOW);
  const p = submitRegistration(s, { ...officer, actorId: "anon" }, {
    role: "supplier", category: "tin_shed", legalName: "Wamba Tin Shed", address: "Wamba",
    contactName: "A", phone: "0", email: "a@b.c", documents: [],
  });
  assert.equal(p.status, "pending");
  assert.equal(p.regNo, null);
  reviewRegistration(s, officer, { participantId: p.id, decision: "approved", note: null });
  assert.equal(p.status, "approved");
  assert.match(p.regNo!, /^NMEX-SUP-2026-\d{5}$/);
  assert.ok(s.audit.some((e) => e.action === "registration.approved"));
});

test("MML trigger: 980 kg cannot submit, 1,030 kg can", () => {
  const s = emptyState(NOW);
  const sup = approvedSupplier(s);
  const ctx = { ...officer, actorId: sup.id };
  for (let i = 0; i < 19; i++) {
    addPurchase(s, ctx, { supplierId: sup.id, date: "2026-08-20", source: "Miner", kg: i < 18 ? 50 : 80, gradePct: 72, valueNgn: 1, reference: "" });
  }
  assert.equal(canSubmitLot(s, sup.id, 1), false);
  addPurchase(s, ctx, { supplierId: sup.id, date: "2026-08-21", source: "Miner", kg: 50, gradePct: 72, valueNgn: 1, reference: "" });
  assert.equal(canSubmitLot(s, sup.id, 1), true);
  assert.throws(() => submitForInspection(s, ctx, { supplierId: sup.id, tier: 1, kg: 5000 }), WorkflowError);
});

test("verification locks assay, snapshots price and opens a 5-day offer to smelters", () => {
  const s = emptyState(NOW);
  const sup = approvedSupplier(s);
  const lot = verified25t(s, sup.id);
  assert.equal(lot.status, "offered");
  assert.equal(lot.verifiedGradePct, 78);
  assert.deepEqual(lot.assayPriceRef, PRICE);
  const offer = s.offers.find((o) => o.lotId === lot.id)!;
  assert.equal(offer.audience, "smelters");
  assert.equal(offer.closesAt, "2026-09-06T09:00:00.000Z");
});

test("smelter acceptance issues DMO-A with royalty transferred at ₦0", () => {
  const s = emptyState(NOW);
  const sup = approvedSupplier(s);
  const sm = approvedSmelter(s);
  const lot = verified25t(s, sup.id);
  const offer = s.offers.find((o) => o.lotId === lot.id)!;
  const { certificate, acceptance } = acceptOffer(s, { ...officer, actorId: sm.id }, { offerId: offer.id, acceptorId: sm.id });
  assert.equal(certificate.cls, "DMO-A");
  assert.match(certificate.certNo, /^NMEX-DMO-A-TINC-2026-00001$/);
  assert.equal(certificate.valuation.purchaseValueNgn, 1_032_142_824.38);
  assert.equal(certificate.valuation.royaltyAtTransferNgn, 0);
  assert.equal(certificate.valuation.royaltyLiabilityHolderId, sm.id);
  assert.equal(acceptance.deadlineAt, "2026-09-06T09:00:00.000Z");
  assert.equal(lot.status, "payment_pending");
  assert.throws(() => acceptOffer(s, { ...officer, actorId: sm.id }, { offerId: offer.id, acceptorId: sm.id }), WorkflowError);
});

test("supplier cannot accept a smelter offer", () => {
  const s = emptyState(NOW);
  const sup = approvedSupplier(s);
  const lot = verified25t(s, sup.id);
  const offer = s.offers.find((o) => o.lotId === lot.id)!;
  assert.throws(() => acceptOffer(s, { ...officer, actorId: sup.id }, { offerId: offer.id, acceptorId: sup.id }), WorkflowError);
});

test("expired concentrate offer issues DMO-EC on full reference value", () => {
  const s = emptyState(NOW);
  const sup = approvedSupplier(s);
  const lot = verified25t(s, sup.id);
  const offer = s.offers.find((o) => o.lotId === lot.id)!;
  assert.throws(() => expireOffer(s, officer, { offerId: offer.id }), WorkflowError);
  const cert = expireOffer(s, { ...officer, nowIso: "2026-09-06T09:00:00.000Z" }, { offerId: offer.id });
  assert.equal(cert.cls, "DMO-EC");
  assert.equal(cert.valuation.royaltyNgn, 106_773_395.63);
  assert.equal(cert.valuation.royaltyLiabilityHolderId, sup.id);
  assert.equal(cert.status, "VALID");
  assert.equal(lot.status, "export_cleared");
});

test("forced expiry is allowed for demo controls", () => {
  const s = emptyState(NOW);
  const sup = approvedSupplier(s);
  const lot = verified25t(s, sup.id);
  const offer = s.offers.find((o) => o.lotId === lot.id)!;
  const cert = expireOffer(s, officer, { offerId: offer.id, force: true });
  assert.equal(cert.cls, "DMO-EC");
});

test("pay → collect → parent lot → refined lot → offer to buyers → DMO-ER", () => {
  const s = emptyState(NOW);
  const sup = approvedSupplier(s);
  const sm = approvedSmelter(s);
  const lot = verified25t(s, sup.id);
  const offer = s.offers.find((o) => o.lotId === lot.id)!;
  const smCtx = { ...officer, actorId: sm.id };
  const { acceptance } = acceptOffer(s, smCtx, { offerId: offer.id, acceptorId: sm.id });
  recordPayment(s, smCtx, { acceptanceId: acceptance.id });
  assert.equal(lot.status, "collection_pending");
  recordCollection(s, smCtx, { acceptanceId: acceptance.id });
  assert.equal(lot.status, "collected");
  const parent = createParentLot(s, smCtx, { smelterId: sm.id, childLotIds: [lot.id] });
  assert.equal(parent.containedTinKg, 19_500);
  assert.equal(parent.avgGradePct, 78);
  assert.equal(lot.status, "aggregated");
  const { campaign, lot: refined } = registerRefinedLot(s, smCtx, { smelterId: sm.id, parentLotIds: [parent.id], recoveredKg: 18_525, purityPct: 99.95 });
  assert.equal(campaign.recoveryPct, 95);
  assert.equal(refined.kind, "refined");
  assert.equal(refined.status, "offered");
  assert.equal(lot.status, "smelted");
  const refinedOffer = s.offers.find((o) => o.lotId === refined.id)!;
  assert.equal(refinedOffer.audience, "buyers");
  const cert = expireOffer(s, officer, { offerId: refinedOffer.id, force: true });
  assert.equal(cert.cls, "DMO-ER");
  assert.match(cert.certNo, /^NMEX-DMO-ER-TIN-2026-00001$/);
});

test("submit records the chosen warehouse", () => {
  const s = emptyState(NOW);
  const sup = approvedSupplier(s);
  const ctx = { ...officer, actorId: sup.id };
  for (let i = 0; i < 20; i++) {
    addPurchase(s, ctx, {
      supplierId: sup.id,
      date: "2026-08-20",
      source: "Miner",
      kg: 50,
      gradePct: 72,
      valueNgn: 1,
      reference: "",
    });
  }
  const warehouse = "NM-EX Approved Warehouse & Assay Centre — Lagos";
  const { inspection } = submitForInspection(s, ctx, { supplierId: sup.id, tier: 1, kg: 1000, warehouse });
  assert.equal(inspection.warehouse, warehouse);
});

test("certificate status changes append history and UTILIZED closes the lot", () => {
  const s = emptyState(NOW);
  const sup = approvedSupplier(s);
  const lot = verified25t(s, sup.id);
  const offer = s.offers.find((o) => o.lotId === lot.id)!;
  const cert = expireOffer(s, officer, { offerId: offer.id, force: true });
  setCertificateStatus(s, { ...officer, actorId: "verifier-1" }, { certNo: cert.certNo, status: "UTILIZED", note: "NXP 1234" });
  assert.equal(cert.status, "UTILIZED");
  assert.equal(cert.history.length, 2);
  assert.equal(lot.status, "utilized");
  assert.throws(() => setCertificateStatus(s, officer, { certNo: cert.certNo, status: "UTILIZED", note: null }), WorkflowError);
});
