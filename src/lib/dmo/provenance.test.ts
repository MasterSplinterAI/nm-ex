import { test } from "node:test";
import assert from "node:assert/strict";
import { provenanceTree, purchaseDestiny } from "./provenance";
import { buildSeed, SEED_IDS } from "./seed";
import { seedBoard } from "../store";

const NOW = "2026-09-04T08:00:00.000Z";

function seeded() {
  return buildSeed(seedBoard(), NOW);
}

test("a refined export clearance traces back to the pits the tin came from", () => {
  const s = seeded();
  const dmoER = s.certificates.find((c) => c.cls === "DMO-ER")!;
  const tree = provenanceTree(s, dmoER.certNo)!;

  assert.ok(tree, "the clearance resolves to a chain");
  assert.equal(tree.lot.kind, "refined");
  assert.ok(tree.campaign, "refined metal came out of a smelting campaign");
  assert.equal(tree.smelter!.id, SEED_IDS.united);

  // Campaign → parent lots → concentrate lots that were actually charged.
  assert.ok(tree.parents.length > 0, "the campaign consumed at least one parent lot");
  assert.ok(tree.origins.length > 0, "the parent lots resolve to concentrate lots");
  for (const origin of tree.origins) {
    assert.equal(origin.lot.kind, "concentrate");
    assert.ok(origin.parcels.length > 0, `${origin.lot.id} carries its parcels`);
  }

  // The bottom of the chain is a named source, not an id.
  assert.ok(tree.sources.length > 0);
  for (const src of tree.sources) {
    assert.ok(src.source.length > 0);
    assert.ok(src.kg > 0);
  }

  // Nothing is invented between stages: what the furnace was charged with
  // matches the verified contained tin of the lots that went into it.
  const mb = tree.massBalance;
  assert.ok(mb.inputContainedKg != null);
  assert.ok(
    Math.abs(mb.verifiedContainedKg - mb.inputContainedKg!) < 1,
    `charged ${mb.inputContainedKg} kg against ${mb.verifiedContainedKg} kg verified`,
  );
  // And the refined output cannot exceed what went in.
  assert.ok(mb.recoveredKg! <= mb.inputContainedKg!);
});

test("the chain names the supplier and the DMO-A that moved each lot", () => {
  const s = seeded();
  const dmoER = s.certificates.find((c) => c.cls === "DMO-ER")!;
  const tree = provenanceTree(s, dmoER.certNo)!;

  for (const origin of tree.origins) {
    assert.ok(origin.owner.legalName.length > 0);
    assert.ok(origin.dmoA, `${origin.lot.id} was bought under a DMO-A`);
    assert.equal(origin.dmoA!.cls, "DMO-A");
    assert.equal(origin.buyer!.id, SEED_IDS.united);
  }
  assert.ok(tree.participants.some((p) => p.id === SEED_IDS.united));
});

test("a concentrate clearance resolves straight to its own parcels", () => {
  const s = seeded();
  const dmoEC = s.certificates.find((c) => c.cls === "DMO-EC")!;
  const tree = provenanceTree(s, dmoEC.certNo)!;

  assert.equal(tree.lot.kind, "concentrate");
  assert.equal(tree.campaign, null);
  assert.equal(tree.parents.length, 0);
  assert.equal(tree.origins.length, 1);
  assert.equal(tree.origins[0].lot.id, dmoEC.lotId);
  assert.ok(tree.sources.length > 0);
});

test("a lot number traces without needing a certificate", () => {
  const s = seeded();
  const lot = s.lots.find((l) => l.kind === "concentrate" && l.purchaseIds.length > 0)!;
  const tree = provenanceTree(s, lot.id)!;
  assert.equal(tree.certificate, null);
  assert.equal(tree.lot.id, lot.id);
  assert.equal(tree.origins[0].parcels.length, lot.purchaseIds.length);
});

test("an unknown reference resolves to nothing rather than throwing", () => {
  const s = seeded();
  assert.equal(provenanceTree(s, "NMEX-DMO-ER-TIN-2026-99999"), null);
});

test("a purchase can be followed forward to the metal it became", () => {
  const s = seeded();
  const allocated = s.purchases.find((p) => p.lotId != null)!;
  const destiny = purchaseDestiny(s, allocated.id)!;

  assert.equal(destiny.lot.id, allocated.lotId);
  assert.ok(destiny.certificates.length > 0, "the lot carries at least one certificate");

  // A parcel that reached the furnace names the refined lot it ended up in.
  const smelted = s.purchases.find((p) => {
    if (!p.lotId) return false;
    const parent = s.parentLots.find((x) => x.childLotIds.includes(p.lotId!));
    return parent?.campaignId != null;
  });
  if (smelted) {
    const d = purchaseDestiny(s, smelted.id)!;
    assert.ok(d.refinedLot, "a smelted parcel resolves to refined metal");
    assert.equal(d.refinedLot!.kind, "refined");
  }
});
