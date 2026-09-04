import { test } from "node:test";
import assert from "node:assert/strict";
import {
  containedTinMt,
  recoveredTinMt,
  valueAcceptance,
  valueExportClearance,
} from "./valuation";

const LME = 55_225;
const FX = 1_322;

test("contained tin = weight × grade", () => {
  assert.equal(containedTinMt(25, 78), 19.5);
});

test("recovered tin at 95% of 19.5 MT is 18.525 MT", () => {
  assert.equal(recoveredTinMt(19.5, 95), 18.525);
});

test("DMO-EC: concentrate export clearance matches handbook scenario B", () => {
  const v = valueExportClearance({
    weightMt: 25,
    gradePct: 78,
    lmeUsd: LME,
    fxRate: FX,
    royaltyPct: 7.5,
    vatPct: 7.5,
    liabilityHolderId: "solex",
  });
  assert.equal(v.containedTinMt, 19.5);
  assert.equal(v.referenceValueNgn, 1_423_645_275.0);
  assert.equal(v.royaltyNgn, 106_773_395.63);
  assert.equal(v.vatNgn, 0);
  assert.equal(v.purchaseValueNgn, null);
  assert.equal(v.procurementCoef, null);
  assert.equal(v.royaltyAtTransferNgn, 106_773_395.63);
  assert.equal(v.royaltyLiabilityHolderId, "solex");
});

test("DMO-ER: refined tin export clearance matches handbook scenario A", () => {
  const v = valueExportClearance({
    weightMt: 25,
    gradePct: 99.95,
    lmeUsd: LME,
    fxRate: FX,
    royaltyPct: 7.5,
    vatPct: 7.5,
    liabilityHolderId: "united",
  });
  assert.equal(v.referenceValueNgn, 1_824_273_656.88);
  assert.equal(v.royaltyNgn, 136_820_524.27);
});

test("DMO-A: domestic acceptance matches handbook scenario C", () => {
  const v = valueAcceptance({
    weightMt: 25,
    gradePct: 78,
    lmeUsd: LME,
    fxRate: FX,
    procurementCoef: 0.725,
    royaltyPct: 7.5,
    vatPct: 7.5,
    smelterId: "united",
  });
  assert.equal(v.referenceValueNgn, 1_423_645_275.0);
  assert.equal(v.purchaseValueNgn, 1_032_142_824.38);
  assert.equal(v.vatNgn, 77_410_711.83);
  assert.equal(v.totalPayableNgn, 1_109_553_536.21);
  assert.equal(v.royaltyNgn, 106_773_395.63);
  assert.equal(v.royaltyAtTransferNgn, 0);
  assert.equal(v.royaltyLiabilityHolderId, "united");
});
