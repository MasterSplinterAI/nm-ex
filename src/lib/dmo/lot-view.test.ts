import { test } from "node:test";
import assert from "node:assert/strict";
import { lotEconomics, lotFormulas, poolFormulas, VARIANCE_LIMIT_PCT, variance } from "./lot-view";
import { DEFAULT_DMO_POLICY } from "./policy";
import type { Lot } from "./types";

test("variance is within ±0.5% for the mockup lot", () => {
  const weight = variance(1_082, 1_078.75);
  const grade = variance(71.2, 70.9864);
  assert.equal(VARIANCE_LIMIT_PCT, 0.5);
  assert.ok(weight.within);
  assert.ok(grade.within);
  assert.ok(weight.pct != null && Math.abs(weight.pct - -0.3) < 0.01);
  assert.ok(grade.pct != null && Math.abs(grade.pct - -0.3) < 0.01);
});

const MOCKUP_LOT = {
  kind: "concentrate",
  declaredKg: 1_082,
  declaredGradePct: 71.2,
  verifiedKg: 1_078.75,
  verifiedGradePct: 70.9864,
} as Lot;

test("listing price uses the smelter coefficient on concentrate", () => {
  const e = lotEconomics(MOCKUP_LOT, DEFAULT_DMO_POLICY, 55_225, 1_322);
  assert.equal(e.coef, DEFAULT_DMO_POLICY.coefToSmelter);
  assert.ok(e.listing > 0);
  assert.ok(e.listing < e.reference);
  assert.ok(Math.abs(e.vat - e.listing * (DEFAULT_DMO_POLICY.vatPct / 100)) < 0.02);
  assert.ok(Math.abs(e.royalty - e.reference * (DEFAULT_DMO_POLICY.royaltyPct / 100)) < 0.02);
});

test("every money figure is published with the arithmetic behind it", () => {
  const e = lotEconomics(MOCKUP_LOT, DEFAULT_DMO_POLICY, 55_225, 1_322);
  const f = lotFormulas(e, DEFAULT_DMO_POLICY);

  assert.equal(f.listing.expression, "72.5% × $55,225 × 70.9864% × 1.07875 t × ₦1,322");
  assert.equal(f.royalty.expression, "7.5% × $55,225 × 70.9864% × 1.07875 t × ₦1,322");
  assert.equal(f.reference.expression, "$55,225 × 70.9864% × 1.07875 t × ₦1,322");
  assert.equal(f.vat.expression, `7.5% × ${f.listing.result}`);
});

test("the pool board states the same three rules without a specific lot", () => {
  const rows = poolFormulas(DEFAULT_DMO_POLICY, 55_225, 1_322);
  assert.deepEqual(
    rows.map((r) => r.label),
    ["Listing price", "Royalty (7.5%)", "VAT (7.5%)"],
  );
  assert.equal(rows[0].expression, "72.5% × $55,225 × grade × (weight ÷ 1,000) × ₦1,322");
  assert.equal(rows[2].expression, "7.5% of the listing price");
});
