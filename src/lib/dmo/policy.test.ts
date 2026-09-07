import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_DMO_POLICY, mmlKgFor, tierForGrade } from "./policy";

test("grade above 50% is tier 1, at or below is tier 2", () => {
  assert.equal(tierForGrade(72, DEFAULT_DMO_POLICY), 1);
  assert.equal(tierForGrade(50, DEFAULT_DMO_POLICY), 2);
  assert.equal(tierForGrade(35, DEFAULT_DMO_POLICY), 2);
});

test("the MML is a quantity of contained tin, by tier", () => {
  assert.equal(mmlKgFor(72, DEFAULT_DMO_POLICY), 700);
  assert.equal(mmlKgFor(40, DEFAULT_DMO_POLICY), 900);

  // The bar sits where the old gross thresholds sat at typical grades:
  // 1,000 kg of 72% concentrate, and 2,000 kg of 45% ore.
  assert.ok(1000 * 0.72 >= DEFAULT_DMO_POLICY.mmlTier1Kg);
  assert.ok(2000 * 0.45 >= DEFAULT_DMO_POLICY.mmlTier2Kg);
});

test("default coefficients match the policy note", () => {
  assert.equal(DEFAULT_DMO_POLICY.coefMinerToAggregator, 0.7);
  assert.equal(DEFAULT_DMO_POLICY.coefToSmelter, 0.725);
  assert.equal(DEFAULT_DMO_POLICY.ompCoefficient, null);
  assert.equal(DEFAULT_DMO_POLICY.royaltyPct, 7.5);
  assert.equal(DEFAULT_DMO_POLICY.vatPct, 7.5);
  assert.equal(DEFAULT_DMO_POLICY.recoveryPct, 95);
});
