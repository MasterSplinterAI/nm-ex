import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSeed, SEED_IDS } from "./seed";
import { seedBoard } from "../store";

const NOW = "2026-09-04T08:00:00.000Z";

test("seed contains the scripted scenario", () => {
  const s = buildSeed(seedBoard(), NOW);
  const solex = s.participants.find((p) => p.id === SEED_IDS.solex)!;
  assert.equal(solex.legalName, "Musa & Son Ltd");
  assert.equal(solex.regNo, "NMEX-SUP-2026-00456");
  assert.equal(s.participants.find((p) => p.id === SEED_IDS.united)!.regNo, "NMEX-SMEL-2026-00015");
  assert.equal(s.participants.find((p) => p.id === SEED_IDS.solder)!.regNo, "NMEX-BUY-2026-00102");
  assert.equal(s.participants.find((p) => p.id === SEED_IDS.wamba)!.status, "pending");

  const free = s.purchases.filter((p) => p.supplierId === SEED_IDS.solex && p.lotId === null);
  assert.equal(free.reduce((a, p) => a + p.kg, 0), 980);

  assert.ok(s.inspections.some((i) => i.status === "awaiting_sample"));
  const open = s.offers.filter((o) => o.status === "open");
  assert.equal(open.filter((o) => o.audience === "smelters").length, 1);
  assert.equal(open.filter((o) => o.audience === "buyers").length, 1);
  for (const o of open) assert.ok(o.closesAt > NOW, `open offer ${o.id} closes in the future`);

  const by = (cls: string) => s.certificates.filter((c) => c.cls === cls);
  assert.equal(by("DMO-EC").length, 1);
  assert.equal(by("DMO-EC")[0].certNo, "NMEX-DMO-EC-TINC-2026-00021");
  assert.equal(by("DMO-ER").length, 1);
  assert.equal(by("DMO-ER")[0].certNo, "NMEX-DMO-ER-TIN-2026-00001");
  assert.equal(by("DMO-A").length, 5);
  assert.deepEqual(
    by("DMO-A").map((c) => c.certNo).slice(2),
    ["NMEX-DMO-A-TINC-2026-00029", "NMEX-DMO-A-TINC-2026-00030", "NMEX-DMO-A-TINC-2026-00031"],
  );

  assert.equal(s.lots.filter((l) => l.status === "collected").length, 3);
  assert.equal(s.parentLots.length, 2);
  assert.equal(s.parentLots[0].id, "NMEX-AGG-TIN-2026-0041");
  assert.equal(s.campaigns.length, 2);
  assert.ok(s.audit.length > 100);
  for (let i = 1; i < s.audit.length; i++) assert.ok(s.audit[i - 1].at <= s.audit[i].at);
});
