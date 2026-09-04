import { test } from "node:test";
import assert from "node:assert/strict";
import { certificateNumber, lotId, parentLotId, purchaseId, regNo } from "./ids";
import type { DemoState } from "./types";

function state(): Pick<DemoState, "counters"> {
  return { counters: {} };
}

test("certificate numbers carry class, commodity, year and 5-digit sequence", () => {
  const s = state();
  assert.equal(certificateNumber(s, "DMO-EC", "concentrate", 2026), "NMEX-DMO-EC-TINC-2026-00001");
  assert.equal(certificateNumber(s, "DMO-EC", "concentrate", 2026), "NMEX-DMO-EC-TINC-2026-00002");
  assert.equal(certificateNumber(s, "DMO-ER", "refined", 2026), "NMEX-DMO-ER-TIN-2026-00001");
  assert.equal(certificateNumber(s, "DMO-A", "concentrate", 2026), "NMEX-DMO-A-TINC-2026-00001");
});

test("lot, parent lot and registration numbers", () => {
  const s = state();
  assert.equal(lotId(s, "concentrate", 2026), "NMEX-TIN-2026-00001");
  assert.equal(lotId(s, "refined", 2026), "NMEX-RTIN-2026-00001");
  assert.equal(parentLotId(s, 2026), "NMEX-AGG-TIN-2026-0001");
  assert.equal(regNo(s, "supplier", 2026), "NMEX-SUP-2026-00001");
  assert.equal(regNo(s, "smelter", 2026), "NMEX-SMEL-2026-00001");
  assert.equal(regNo(s, "buyer", 2026), "NMEX-BUY-2026-00001");
  assert.equal(purchaseId(s, 2026), "NMEX-PUR-2026-00001");
  assert.equal(purchaseId(s, 2026), "NMEX-PUR-2026-00002");
});
