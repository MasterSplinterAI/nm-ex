import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_DMO_POLICY, mmlKgFor, tierForGrade } from "./policy";

test("grade above 50% is tier 1, at or below is tier 2", () => {
  assert.equal(tierForGrade(72, DEFAULT_DMO_POLICY), 1);
  assert.equal(tierForGrade(50, DEFAULT_DMO_POLICY), 2);
  assert.equal(tierForGrade(35, DEFAULT_DMO_POLICY), 2);
});

test("MML is 1,000 kg for tier 1 and 2,000 kg for tier 2", () => {
  assert.equal(mmlKgFor(72, DEFAULT_DMO_POLICY), 1000);
  assert.equal(mmlKgFor(40, DEFAULT_DMO_POLICY), 2000);
});

test("default coefficients match the policy note", () => {
  assert.equal(DEFAULT_DMO_POLICY.coefMinerToAggregator, 0.7);
  assert.equal(DEFAULT_DMO_POLICY.coefToSmelter, 0.725);
  assert.equal(DEFAULT_DMO_POLICY.ompCoefficient, null);
  assert.equal(DEFAULT_DMO_POLICY.royaltyPct, 7.5);
  assert.equal(DEFAULT_DMO_POLICY.vatPct, 7.5);
  assert.equal(DEFAULT_DMO_POLICY.recoveryPct, 95);
});
