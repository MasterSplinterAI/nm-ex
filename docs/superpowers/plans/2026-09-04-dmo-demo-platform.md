# NM-EX DMO Demo Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A clickable, server-persisted demonstration of the NM-EX Domestic Market Offer (DMO) tin pilot — registration, assay verification, National Pool, acceptance / export clearance certificates, parent lots, refined-metal re-offer and QR verification — for a projector walkthrough with Nigerian officials.

**Architecture:** Pure domain functions (`src/lib/dmo/*`) operate on one `DemoState` object that is persisted as a single JSON file the same way `spot.json` is today. Next.js server components read the state; server actions call workflow functions inside a serialized `mutate()` and revalidate. Roles are signed cookies; every action re-checks the role on the server. Prices are always snapshotted from the live spot board at each fiscal event.

**Tech Stack:** Next.js 16.3 (App Router, server actions), React 19, TypeScript 5, Tailwind 4, Framer Motion 13, `tsx` + `node:test` for unit tests, `qrcode` for SVG QR codes.

Spec: `docs/superpowers/specs/2026-09-04-dmo-demo-platform-design.md`.

## Global Constraints

- Do not modify `src/app/page.tsx`, `src/components/hero.tsx`, `src/components/spot-board.tsx`, `src/components/tin-desk.tsx`, `src/components/trace-desk.tsx`, `src/app/desk/**`. `/` and `/desk` stay exactly as they are.
- Prices come only from `readSpotBoard()` (tin `lastUsd`, `fx.rate`). Never hard-code LME or FX outside tests.
- Every mutation appends an `AuditEvent`. Nothing is deleted; status changes are appended to history.
- Certificate class codes: `DMO-A`, `DMO-EC`, `DMO-ER`. Titles: "Domestic-Offer-First Acceptance Certificate", "Domestic-Offer-First Export Clearance Certificate". Certificate numbers: `NMEX-<CLASS>-<TINC|TIN>-<YYYY>-<NNNNN>`.
- Verify URL base: `https://www.nm-ex.com` (env `NM_EX_PUBLIC_URL` overrides; local default `http://localhost:3000`).
- Signed-in area is `/portal/...`. Public: `/`, `/exchange`, `/register`, `/login`, `/verify`, `/verify/[certNo]`, `/certificates/[certNo]`.
- Money is NGN rounded to 2 dp with `round2()`; totals are sums of rounded parts.
- Read `node_modules/next/dist/docs/` before writing any Next.js route, layout or server-action code (this Next version differs from training data). Do not use `middleware.ts`; gate in `src/app/portal/layout.tsx` and in every action.
- Styling uses existing CSS variables (`--paper`, `--ink`, `--ink-muted`, `--forest`, `--copper`, `--line`) and the existing `font-display` class; square corners, 1px `--line` borders, `bg-white/55` panels, `text-[10px] uppercase tracking-[0.16em]` kickers — copy the patterns in `src/components/tin-desk.tsx` and `src/app/desk/login/*`.
- Node 22: tests run with `npm test` → `tsx --test "src/lib/dmo/**/*.test.ts"`.
- Commit after every task with a one-line imperative message (repo style: "Add …", "Show …").

---

## File structure

Create:

```
src/lib/dmo/types.ts            all domain types + DemoState
src/lib/dmo/money.ts            round2, ngn helpers
src/lib/dmo/valuation.ts        pure valuation formulas (+ .test.ts)
src/lib/dmo/policy.ts           DEFAULT_DMO_POLICY, tierForGrade, mmlKgFor
src/lib/dmo/ids.ts              certificate/lot/parent id generators from counters
src/lib/dmo/prices.ts           priceRefFromBoard(board, at)
src/lib/dmo/clock.ts            demoNow(state)
src/lib/dmo/audit.ts            record(state, event)
src/lib/dmo/workflow.ts         every state transition (+ .test.ts)
src/lib/dmo/queries.ts          read-only selectors for pages
src/lib/dmo/seed.ts             buildSeed(board, nowIso) → DemoState (+ .test.ts)
src/lib/dmo/store.ts            readState, mutate, resetState (file-backed)
src/lib/dmo/session.ts          signed cookie session, requireSession(role)
src/lib/dmo/labels.ts           human labels for statuses/classes/roles
src/app/login/page.tsx, login-cards.tsx, actions.ts
src/app/register/page.tsx, register-form.tsx, actions.ts
src/app/portal/layout.tsx, portal-nav.tsx, actions.ts
src/app/portal/page.tsx         redirect to role home
src/app/portal/supplier/page.tsx, actions.ts, ledger.tsx, inventory.tsx, lots.tsx
src/app/portal/smelter/page.tsx, actions.ts, pool.tsx, pipeline.tsx, parent-lot.tsx, refined.tsx
src/app/portal/buyer/page.tsx, actions.ts
src/app/portal/admin/page.tsx, actions.ts, registrations.tsx, inspections.tsx, offers.tsx, certificates.tsx, policy-form.tsx, audit.tsx, demo-controls.tsx, demo-script.tsx
src/app/portal/verify/page.tsx, actions.ts, verify-form.tsx
src/app/verify/page.tsx, [certNo]/page.tsx
src/app/certificates/[certNo]/page.tsx, certificate-sheet.tsx, certificate.css
src/app/exchange/page.tsx
src/components/exchange/exchange-hero.tsx, metal-carousel.tsx, flow-strip.tsx, spot-strip.tsx
src/components/portal/panel.tsx, status-pill.tsx, field-list.tsx, money.tsx, countdown.tsx, action-button.tsx
```

Modify:

```
package.json                    add "test" script, qrcode dep
src/components/site-header.tsx  add Register / Login / Verify links
README.md                       demo section
.env.example                    DEMO_PASSWORD, NM_EX_DEMO_PATH, NM_EX_PUBLIC_URL
```

---

### Task 1: Domain types, money helpers, policy defaults

**Files:**
- Create: `src/lib/dmo/types.ts`, `src/lib/dmo/money.ts`, `src/lib/dmo/policy.ts`
- Test: `src/lib/dmo/policy.test.ts`
- Modify: `package.json` (scripts.test)

**Interfaces:**
- Produces every type below; all later tasks import from `@/lib/dmo/types`.

- [ ] **Step 1: Add test script and install deps**

```bash
cd /workspace && npm install && npm install qrcode && npm install -D @types/qrcode
```

Edit `package.json` scripts:

```json
"test": "tsx --test \"src/lib/dmo/**/*.test.ts\""
```

- [ ] **Step 2: Write `src/lib/dmo/types.ts`**

```ts
export type Role = "supplier" | "smelter" | "buyer" | "officer" | "verifier";

export type ParticipantCategory =
  | "tin_shed"
  | "mining_company"
  | "aggregator"
  | "smelter"
  | "end_user";

export type ParticipantStatus =
  | "pending"
  | "under_review"
  | "more_info"
  | "approved"
  | "rejected"
  | "suspended";

export type UploadedDoc = { name: string; type: string };

export type Participant = {
  id: string;
  regNo: string | null;
  role: Role;
  category: ParticipantCategory | null;
  legalName: string;
  address: string;
  contactName: string;
  phone: string;
  email: string;
  status: ParticipantStatus;
  documents: UploadedDoc[];
  reviewNote: string | null;
  createdAt: string;
};

export type PurchaseEntry = {
  id: string;
  supplierId: string;
  date: string;
  source: string;
  kg: number;
  gradePct: number;
  valueNgn: number;
  reference: string;
  lotId: string | null;
  createdAt: string;
};

export type PriceRef = { lmeUsd: number; fxRate: number; at: string };

export type LotKind = "concentrate" | "refined";

export type LotStatus =
  | "in_ledger"
  | "submitted_for_inspection"
  | "sample_received"
  | "verified"
  | "offered"
  | "accepted"
  | "payment_pending"
  | "paid"
  | "collection_pending"
  | "collected"
  | "aggregated"
  | "smelted"
  | "expired"
  | "export_cleared"
  | "utilized"
  | "sold_domestic";

export type Lot = {
  id: string;
  kind: LotKind;
  ownerId: string;
  status: LotStatus;
  declaredKg: number;
  declaredGradePct: number;
  verifiedKg: number | null;
  verifiedGradePct: number | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  assayPriceRef: PriceRef | null;
  parentLotId: string | null;
  campaignId: string | null;
  purchaseIds: string[];
  createdAt: string;
};

export type InspectionStatus =
  | "awaiting_sample"
  | "sample_received"
  | "verified"
  | "rejected";

export type Inspection = {
  id: string;
  lotId: string;
  submittedKg: number;
  warehouse: string;
  windowEndsAt: string;
  status: InspectionStatus;
  sampleReceivedAt: string | null;
  createdAt: string;
};

export type OfferAudience = "smelters" | "buyers";
export type OfferStatus = "open" | "accepted" | "expired" | "withdrawn";

export type Offer = {
  id: string;
  lotId: string;
  audience: OfferAudience;
  opensAt: string;
  closesAt: string;
  status: OfferStatus;
  acceptanceId: string | null;
  certNo: string | null;
};

export type Acceptance = {
  id: string;
  offerId: string;
  lotId: string;
  acceptorId: string;
  acceptedAt: string;
  deadlineAt: string;
  paymentStatus: "pending" | "paid";
  paidAt: string | null;
  collectionStatus: "pending" | "collected";
  collectedAt: string | null;
  priceRef: PriceRef;
  valuation: Valuation;
  certNo: string;
};

export type CertificateClass = "DMO-A" | "DMO-EC" | "DMO-ER";

export type CertificateStatus =
  | "VALID"
  | "EXPIRED"
  | "UTILIZED"
  | "CANCELLED"
  | "SUSPENDED"
  | "UNDER_REVIEW"
  | "SUPERSEDED";

export type StatusChange = {
  at: string;
  status: CertificateStatus;
  byId: string;
  note: string | null;
};

export type Certificate = {
  certNo: string;
  cls: CertificateClass;
  lotId: string;
  offerId: string;
  acceptanceId: string | null;
  supplierId: string;
  counterpartyId: string | null;
  issuedAt: string;
  status: CertificateStatus;
  priceRef: PriceRef;
  valuation: Valuation;
  supersedes: string | null;
  history: StatusChange[];
};

export type Valuation = {
  weightMt: number;
  gradePct: number;
  containedTinMt: number;
  lmeUsd: number;
  fxRate: number;
  referenceValueNgn: number;
  procurementCoef: number | null;
  purchaseValueNgn: number | null;
  vatPct: number;
  vatNgn: number | null;
  totalPayableNgn: number | null;
  royaltyPct: number;
  royaltyNgn: number;
  royaltyAtTransferNgn: number;
  royaltyLiabilityHolderId: string;
};

export type ParentLot = {
  id: string;
  smelterId: string;
  childLotIds: string[];
  totalKg: number;
  containedTinKg: number;
  avgGradePct: number;
  createdAt: string;
};

export type Campaign = {
  id: string;
  smelterId: string;
  parentLotIds: string[];
  inputContainedKg: number;
  recoveredKg: number;
  recoveryPct: number;
  refinedLotId: string;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  actorId: string;
  actorLabel: string;
  action: string;
  subjectType: string;
  subjectId: string;
  detail: string;
};

export type DmoPolicy = {
  coefMinerToAggregator: number;
  coefToSmelter: number;
  ompCoefficient: number | null;
  royaltyPct: number;
  vatPct: number;
  recoveryPct: number;
  mmlTier1Kg: number;
  mmlTier2Kg: number;
  tier1MinGradePct: number;
  sampleWindowHours: number;
  offerPeriodDays: number;
  paymentWindowDays: number;
  requiredDocuments: Record<ParticipantCategory, string[]>;
  warehouses: string[];
};

export type DemoState = {
  version: 1;
  seededAt: string;
  clockOffsetMs: number;
  policy: DmoPolicy;
  participants: Participant[];
  purchases: PurchaseEntry[];
  lots: Lot[];
  inspections: Inspection[];
  offers: Offer[];
  acceptances: Acceptance[];
  certificates: Certificate[];
  parentLots: ParentLot[];
  campaigns: Campaign[];
  audit: AuditEvent[];
  counters: Record<string, number>;
};

export class WorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowError";
  }
}
```

- [ ] **Step 3: Write `src/lib/dmo/money.ts`**

```ts
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function kgToMt(kg: number): number {
  return kg / 1000;
}

export function mtToKg(mt: number): number {
  return Math.round(mt * 1000);
}
```

- [ ] **Step 4: Write failing test `src/lib/dmo/policy.test.ts`**

```ts
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
```

- [ ] **Step 5: Run, expect failure**

Run: `npm test`
Expected: FAIL — cannot find module `./policy`.

- [ ] **Step 6: Write `src/lib/dmo/policy.ts`**

```ts
import type { DmoPolicy } from "./types";

export const DEFAULT_DMO_POLICY: DmoPolicy = {
  coefMinerToAggregator: 0.7,
  coefToSmelter: 0.725,
  ompCoefficient: null,
  royaltyPct: 7.5,
  vatPct: 7.5,
  recoveryPct: 95,
  mmlTier1Kg: 1000,
  mmlTier2Kg: 2000,
  tier1MinGradePct: 50,
  sampleWindowHours: 48,
  offerPeriodDays: 5,
  paymentWindowDays: 5,
  requiredDocuments: {
    tin_shed: [
      "Mineral Buying Centre licence / certificate",
      "Approval documentation",
      "Tax Clearance Certificate (current)",
      "CAC registration",
    ],
    mining_company: [
      "Mining title / licence",
      "Minimum work programme documentation",
      "EIA / environmental audit documentation",
      "Mines Inspectorate submissions / letters",
      "Tax Clearance Certificate (current)",
    ],
    aggregator: [
      "Licence / authority to purchase and possess minerals",
      "Tax Clearance Certificate (current)",
      "CAC registration",
    ],
    smelter: [
      "Mineral processing licence",
      "Operating permits",
      "Tax Clearance Certificate (current)",
      "CAC registration",
    ],
    end_user: [
      "CAC registration",
      "Tax Clearance Certificate (current)",
      "Description of industrial use",
    ],
  },
  warehouses: [
    "NM-EX Approved Warehouse & Assay Centre — Jos",
    "NM-EX Approved Warehouse & Assay Centre — Lafia",
  ],
};

export function tierForGrade(gradePct: number, policy: DmoPolicy): 1 | 2 {
  return gradePct > policy.tier1MinGradePct ? 1 : 2;
}

export function mmlKgFor(gradePct: number, policy: DmoPolicy): number {
  return tierForGrade(gradePct, policy) === 1
    ? policy.mmlTier1Kg
    : policy.mmlTier2Kg;
}
```

- [ ] **Step 7: Run, expect pass**

Run: `npm test`
Expected: 3 passing.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/lib/dmo/types.ts src/lib/dmo/money.ts src/lib/dmo/policy.ts src/lib/dmo/policy.test.ts
git commit -m "Add DMO domain types, money helpers and default policy"
```

---

### Task 2: Valuation engine (numbers must match the handbook)

**Files:**
- Create: `src/lib/dmo/valuation.ts`
- Test: `src/lib/dmo/valuation.test.ts`

**Interfaces:**
- Produces:
  - `containedTinMt(weightMt, gradePct): number`
  - `referenceValueNgn(weightMt, gradePct, lmeUsd, fxRate): number` (unrounded)
  - `recoveredTinMt(containedMt, recoveryPct): number`
  - `valueExportClearance(input: ClearanceInput): Valuation`
  - `valueAcceptance(input: AcceptanceInput): Valuation`
  - types `ClearanceInput`, `AcceptanceInput`.

- [ ] **Step 1: Write failing test `src/lib/dmo/valuation.test.ts`**

```ts
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
```

- [ ] **Step 2: Run, expect failure**

Run: `npm test`
Expected: FAIL — cannot find module `./valuation`.

- [ ] **Step 3: Write `src/lib/dmo/valuation.ts`**

```ts
import { round2 } from "./money";
import type { Valuation } from "./types";

export function containedTinMt(weightMt: number, gradePct: number): number {
  return weightMt * (gradePct / 100);
}

/** Weight × grade × LME × FX — the government reference value, unrounded. */
export function referenceValueNgn(
  weightMt: number,
  gradePct: number,
  lmeUsd: number,
  fxRate: number,
): number {
  return containedTinMt(weightMt, gradePct) * lmeUsd * fxRate;
}

export function recoveredTinMt(containedMt: number, recoveryPct: number): number {
  return containedMt * (recoveryPct / 100);
}

export type ClearanceInput = {
  weightMt: number;
  gradePct: number;
  lmeUsd: number;
  fxRate: number;
  royaltyPct: number;
  vatPct: number;
  liabilityHolderId: string;
};

/**
 * DMO-EC / DMO-ER. Royalty on full contained-metal reference value.
 * The procurement coefficient is never applied here (handbook §8).
 * Export is zero-rated for VAT.
 */
export function valueExportClearance(input: ClearanceInput): Valuation {
  const reference = referenceValueNgn(
    input.weightMt,
    input.gradePct,
    input.lmeUsd,
    input.fxRate,
  );
  const royalty = round2(reference * (input.royaltyPct / 100));
  return {
    weightMt: input.weightMt,
    gradePct: input.gradePct,
    containedTinMt: containedTinMt(input.weightMt, input.gradePct),
    lmeUsd: input.lmeUsd,
    fxRate: input.fxRate,
    referenceValueNgn: round2(reference),
    procurementCoef: null,
    purchaseValueNgn: null,
    vatPct: input.vatPct,
    vatNgn: 0,
    totalPayableNgn: null,
    royaltyPct: input.royaltyPct,
    royaltyNgn: royalty,
    royaltyAtTransferNgn: royalty,
    royaltyLiabilityHolderId: input.liabilityHolderId,
  };
}

export type AcceptanceInput = {
  weightMt: number;
  gradePct: number;
  lmeUsd: number;
  fxRate: number;
  procurementCoef: number;
  royaltyPct: number;
  vatPct: number;
  smelterId: string;
};

/**
 * DMO-A. Supplier is paid reference × coefficient plus VAT.
 * Royalty at transfer is ₦0; the liability moves to the smelter immediately.
 */
export function valueAcceptance(input: AcceptanceInput): Valuation {
  const reference = referenceValueNgn(
    input.weightMt,
    input.gradePct,
    input.lmeUsd,
    input.fxRate,
  );
  const purchase = round2(reference * input.procurementCoef);
  const vat = round2(purchase * (input.vatPct / 100));
  return {
    weightMt: input.weightMt,
    gradePct: input.gradePct,
    containedTinMt: containedTinMt(input.weightMt, input.gradePct),
    lmeUsd: input.lmeUsd,
    fxRate: input.fxRate,
    referenceValueNgn: round2(reference),
    procurementCoef: input.procurementCoef,
    purchaseValueNgn: purchase,
    vatPct: input.vatPct,
    vatNgn: vat,
    totalPayableNgn: round2(purchase + vat),
    royaltyPct: input.royaltyPct,
    royaltyNgn: round2(reference * (input.royaltyPct / 100)),
    royaltyAtTransferNgn: 0,
    royaltyLiabilityHolderId: input.smelterId,
  };
}
```

- [ ] **Step 4: Run, expect pass**

Run: `npm test`
Expected: all passing (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/dmo/valuation.ts src/lib/dmo/valuation.test.ts
git commit -m "Add DMO valuation engine pinned to the handbook worked examples"
```

---

### Task 3: IDs, clock, prices, audit, labels

**Files:**
- Create: `src/lib/dmo/ids.ts`, `src/lib/dmo/clock.ts`, `src/lib/dmo/prices.ts`, `src/lib/dmo/audit.ts`, `src/lib/dmo/labels.ts`
- Test: `src/lib/dmo/ids.test.ts`

**Interfaces:**
- Produces:
  - `nextCounter(state, key): number` (mutates `state.counters`)
  - `certificateNumber(state, cls, kind, year): string` → `NMEX-DMO-EC-TINC-2026-00021`
  - `lotId(state, kind, year)` → `NMEX-TIN-2026-00042` / `NMEX-RTIN-2026-00007`
  - `parentLotId(state, year)` → `NMEX-AGG-TIN-2026-0041`
  - `regNo(state, role, year)` → `NMEX-SUP-2026-00456` / `NMEX-SMEL-…` / `NMEX-BUY-…`
  - `simpleId(state, prefix)` → `pur-000123`
  - `demoNow(state): Date`, `demoNowIso(state): string`, `addHours(iso, h)`, `addDays(iso, d)`
  - `priceRefFromBoard(board: SpotBoard, atIso: string): PriceRef` (throws `WorkflowError` when tin last is null)
  - `record(state, e: Omit<AuditEvent,"id"|"at">, atIso)`
  - `labels.ts`: `lotStatusLabel`, `certStatusLabel`, `certClassTitle`, `roleLabel`, `categoryLabel`, `participantStatusLabel`.

- [ ] **Step 1: Write failing test `src/lib/dmo/ids.test.ts`**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { certificateNumber, lotId, parentLotId, regNo } from "./ids";
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
});
```

- [ ] **Step 2: Run, expect failure** — `npm test` → cannot find `./ids`.

- [ ] **Step 3: Write `src/lib/dmo/ids.ts`**

```ts
import type { CertificateClass, DemoState, LotKind, Role } from "./types";

type Counters = Pick<DemoState, "counters">;

export function nextCounter(state: Counters, key: string): number {
  const next = (state.counters[key] ?? 0) + 1;
  state.counters[key] = next;
  return next;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

const COMMODITY: Record<LotKind, string> = { concentrate: "TINC", refined: "TIN" };

export function certificateNumber(
  state: Counters,
  cls: CertificateClass,
  kind: LotKind,
  year: number,
): string {
  const key = `cert:${cls}:${kind}:${year}`;
  return `NMEX-${cls}-${COMMODITY[kind]}-${year}-${pad(nextCounter(state, key), 5)}`;
}

export function lotId(state: Counters, kind: LotKind, year: number): string {
  const prefix = kind === "concentrate" ? "TIN" : "RTIN";
  return `NMEX-${prefix}-${year}-${pad(nextCounter(state, `lot:${kind}:${year}`), 5)}`;
}

export function parentLotId(state: Counters, year: number): string {
  return `NMEX-AGG-TIN-${year}-${pad(nextCounter(state, `parent:${year}`), 4)}`;
}

const REG_PREFIX: Partial<Record<Role, string>> = {
  supplier: "SUP",
  smelter: "SMEL",
  buyer: "BUY",
};

export function regNo(state: Counters, role: Role, year: number): string {
  const prefix = REG_PREFIX[role] ?? "PART";
  return `NMEX-${prefix}-${year}-${pad(nextCounter(state, `reg:${prefix}:${year}`), 5)}`;
}

export function simpleId(state: Counters, prefix: string): string {
  return `${prefix}-${pad(nextCounter(state, `simple:${prefix}`), 6)}`;
}
```

- [ ] **Step 4: Write `src/lib/dmo/clock.ts`**

```ts
import type { DemoState } from "./types";

export function demoNow(state: Pick<DemoState, "clockOffsetMs">): Date {
  return new Date(Date.now() + state.clockOffsetMs);
}

export function demoNowIso(state: Pick<DemoState, "clockOffsetMs">): string {
  return demoNow(state).toISOString();
}

export function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString();
}

export function addDays(iso: string, days: number): string {
  return addHours(iso, days * 24);
}

export function yearOf(iso: string): number {
  return new Date(iso).getUTCFullYear();
}
```

- [ ] **Step 5: Write `src/lib/dmo/prices.ts`**

```ts
import type { SpotBoard } from "@/lib/types";
import { WorkflowError, type PriceRef } from "./types";

export function priceRefFromBoard(board: SpotBoard, atIso: string): PriceRef {
  const tin = board.minerals.find((m) => m.slug === "tin");
  if (tin?.lastUsd == null) {
    throw new WorkflowError("No LME tin reference on the board.");
  }
  return { lmeUsd: tin.lastUsd, fxRate: board.fx.rate, at: atIso };
}
```

- [ ] **Step 6: Write `src/lib/dmo/audit.ts`**

```ts
import { simpleId } from "./ids";
import type { AuditEvent, DemoState } from "./types";

export function record(
  state: DemoState,
  atIso: string,
  event: Omit<AuditEvent, "id" | "at">,
): AuditEvent {
  const entry: AuditEvent = { id: simpleId(state, "evt"), at: atIso, ...event };
  state.audit.push(entry);
  return entry;
}

export function actorLabel(state: DemoState, actorId: string): string {
  if (actorId === "system") return "NM-EX system";
  return state.participants.find((p) => p.id === actorId)?.legalName ?? actorId;
}
```

- [ ] **Step 7: Write `src/lib/dmo/labels.ts`**

```ts
import type {
  CertificateClass,
  CertificateStatus,
  LotKind,
  LotStatus,
  ParticipantCategory,
  ParticipantStatus,
  Role,
} from "./types";

export const LOT_STATUS_LABEL: Record<LotStatus, string> = {
  in_ledger: "In ledger",
  submitted_for_inspection: "Submitted for inspection",
  sample_received: "Sample received",
  verified: "Verified",
  offered: "Offer open",
  accepted: "Offer accepted",
  payment_pending: "Payment pending",
  paid: "Paid",
  collection_pending: "Collection pending",
  collected: "Collected",
  aggregated: "Aggregated",
  smelted: "Smelted",
  expired: "No domestic offer",
  export_cleared: "Cleared for export",
  utilized: "Utilized — export completed",
  sold_domestic: "Sold — domestic",
};

export const CERT_STATUS_LABEL: Record<CertificateStatus, string> = {
  VALID: "Valid",
  EXPIRED: "Expired",
  UTILIZED: "Utilized — export completed",
  CANCELLED: "Cancelled",
  SUSPENDED: "Suspended",
  UNDER_REVIEW: "Under review",
  SUPERSEDED: "Superseded",
};

export function certClassTitle(
  cls: CertificateClass,
  kind: LotKind,
): { title: string; subtitle: string; banner: string } {
  switch (cls) {
    case "DMO-A":
      return {
        title: "Domestic-Offer-First Acceptance Certificate",
        subtitle: kind === "concentrate" ? "Tin Concentrate" : "Refined Tin / Tin Ingot",
        banner: kind === "concentrate"
          ? "SOLD TO QUALIFIED DOMESTIC SMELTER"
          : "SOLD TO QUALIFIED DOMESTIC BUYER",
      };
    case "DMO-EC":
      return {
        title: "Domestic-Offer-First Export Clearance Certificate",
        subtitle: "Tin Concentrate",
        banner: "NO DOMESTIC SMELTER OFFER — EXPORT BOUND",
      };
    case "DMO-ER":
      return {
        title: "Domestic-Offer-First Export Clearance Certificate",
        subtitle: "Refined Tin / Tin Ingot",
        banner: "NO DOMESTIC OFFER — EXPORT BOUND",
      };
  }
}

export const ROLE_LABEL: Record<Role, string> = {
  supplier: "Supplier (tin shed / aggregator)",
  smelter: "Qualified domestic smelter",
  buyer: "Domestic end user",
  officer: "NM-EX officer",
  verifier: "NESS / Customs verifier",
};

export const CATEGORY_LABEL: Record<ParticipantCategory, string> = {
  tin_shed: "Tin Shed / Mineral Buying Centre",
  mining_company: "Mining Company / Direct Producer",
  aggregator: "Licensed Aggregator",
  smelter: "Mineral Processor / Smelter",
  end_user: "Domestic End User (refined metal)",
};

export const PARTICIPANT_STATUS_LABEL: Record<ParticipantStatus, string> = {
  pending: "Application received",
  under_review: "Under review",
  more_info: "Further information requested",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};
```

- [ ] **Step 8: Run tests, expect pass** — `npm test`.

- [ ] **Step 9: Commit**

```bash
git add src/lib/dmo/ids.ts src/lib/dmo/ids.test.ts src/lib/dmo/clock.ts src/lib/dmo/prices.ts src/lib/dmo/audit.ts src/lib/dmo/labels.ts
git commit -m "Add DMO identifiers, demo clock, board price snapshots, audit log and labels"
```

---

### Task 4: Workflow transitions (the state machine)

**Files:**
- Create: `src/lib/dmo/workflow.ts`
- Test: `src/lib/dmo/workflow.test.ts`

**Interfaces:**
- Every function has the shape `fn(state: DemoState, ctx: Ctx, input): Result` where `Ctx = { actorId: string; nowIso: string; priceRef: () => PriceRef }` and throws `WorkflowError` on an illegal transition. Functions mutate `state` in place (the store handles persistence) and always call `record()`.
- Produces (exact names used by later tasks):
  - `emptyState(nowIso): DemoState`
  - `submitRegistration(state, ctx, { role, category, legalName, address, contactName, phone, email, documents }): Participant`
  - `reviewRegistration(state, ctx, { participantId, decision: "approved"|"rejected"|"more_info"|"under_review", note })`
  - `addPurchase(state, ctx, { supplierId, date, source, kg, gradePct, valueNgn, reference }): PurchaseEntry`
  - `eligibleInventory(state, supplierId): { tier1Kg, tier2Kg, entries: PurchaseEntry[] }`
  - `canSubmitLot(state, supplierId, tier: 1|2): boolean`
  - `submitForInspection(state, ctx, { supplierId, tier, kg }): { lot: Lot; inspection: Inspection }`
  - `markSampleReceived(state, ctx, { inspectionId })`
  - `verifyLot(state, ctx, { inspectionId, verifiedKg, verifiedGradePct }): Lot` — locks assay, snapshots `assayPriceRef`, opens the offer (audience by kind)
  - `openOffer(state, ctx, { lotId }): Offer` (used by verifyLot and by refined-lot registration)
  - `acceptOffer(state, ctx, { offerId, acceptorId }): { acceptance: Acceptance; certificate: Certificate }` — issues a DMO-A for both concentrate (lot → `payment_pending`) and refined lots (lot → `sold_domestic`); the certificate subtitle comes from `certClassTitle(cls, kind)`.
  - `expireOffer(state, ctx, { offerId }): Certificate` — DMO-EC or DMO-ER
  - `expireDueOffers(state, ctx): Certificate[]` — all `open` offers whose `closesAt <= nowIso`
  - `recordPayment(state, ctx, { acceptanceId })`, `recordCollection(state, ctx, { acceptanceId })`
  - `createParentLot(state, ctx, { smelterId, childLotIds }): ParentLot` — children must be `collected`, owned acceptances by this smelter; sets children `aggregated`
  - `registerRefinedLot(state, ctx, { smelterId, parentLotIds, recoveredKg, purityPct }): { campaign: Campaign; lot: Lot }` — parents → children `smelted`; new refined lot in `verified` status with `assayPriceRef`, then `openOffer` to `buyers`
  - `setCertificateStatus(state, ctx, { certNo, status, note })` — appends history; `UTILIZED` also sets lot `utilized`
  - `updatePolicy(state, ctx, patch: Partial<DmoPolicy>)`
  - `advanceClock(state, ctx, { hours })` — then `expireDueOffers`
  - `defaultAcceptance(state, ctx, { acceptanceId })` — buyer default: certificate → `CANCELLED`, lot back to `verified`, `openOffer` again (guidelines §23)

Rules to encode (assert in tests):
- Only `approved` participants can act commercially.
- `submitForInspection` requires `eligibleInventory` for the tier ≥ MML and `kg ≤ eligible`; it links the oldest purchases first up to `kg` and sets `lotId` on them.
- `verifyLot` rejects `verifiedKg > submittedKg`.
- `acceptOffer` requires offer `open`, `nowIso < closesAt`, acceptor role matches audience (`smelters` → role `smelter`, `buyers` → role `buyer`), acceptor `approved`. Valuation uses `policy.coefToSmelter` for concentrate, `1` for refined (buyer pays reference; VAT applies).
- `expireOffer` requires `open` and (`nowIso >= closesAt` or `ctx.force === true`). Add `force?: boolean` to the input, not to ctx.
- Certificates freeze `priceRef()` at issue.

- [ ] **Step 1: Write failing tests `src/lib/dmo/workflow.test.ts`**

```ts
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
  const refinedOffer = s.offers.find((o) => o.lotId === refined.id)!;
  assert.equal(refinedOffer.audience, "buyers");
  const cert = expireOffer(s, officer, { offerId: refinedOffer.id, force: true });
  assert.equal(cert.cls, "DMO-ER");
  assert.match(cert.certNo, /^NMEX-DMO-ER-TIN-2026-00001$/);
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
```

- [ ] **Step 2: Run, expect failure** — `npm test` → cannot find `./workflow`.

- [ ] **Step 3: Write `src/lib/dmo/workflow.ts`**

Implement each exported function listed under Interfaces. Skeleton and the two most intricate functions in full; the rest follow the same shape (find → assert → mutate → `record`):

```ts
import { record } from "./audit";
import { addDays, addHours, yearOf } from "./clock";
import { certificateNumber, lotId, parentLotId, regNo, simpleId } from "./ids";
import { kgToMt, round2 } from "./money";
import { DEFAULT_DMO_POLICY, mmlKgFor, tierForGrade } from "./policy";
import {
  WorkflowError,
  type Acceptance, type Certificate, type CertificateStatus, type DemoState,
  type DmoPolicy, type Inspection, type Lot, type Offer, type ParentLot,
  type Participant, type ParticipantCategory, type PriceRef, type PurchaseEntry,
  type Role, type UploadedDoc, type Campaign,
} from "./types";
import { valueAcceptance, valueExportClearance } from "./valuation";

export type Ctx = { actorId: string; nowIso: string; priceRef: () => PriceRef };

export function emptyState(nowIso: string): DemoState {
  return {
    version: 1, seededAt: nowIso, clockOffsetMs: 0,
    policy: structuredClone(DEFAULT_DMO_POLICY),
    participants: [], purchases: [], lots: [], inspections: [], offers: [],
    acceptances: [], certificates: [], parentLots: [], campaigns: [], audit: [], counters: {},
  };
}

function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new WorkflowError(`${what} not found.`);
  return value;
}
const findParticipant = (s: DemoState, id: string) => must(s.participants.find((p) => p.id === id), "Participant");
const findLot = (s: DemoState, id: string) => must(s.lots.find((l) => l.id === id), "Lot");
const findOffer = (s: DemoState, id: string) => must(s.offers.find((o) => o.id === id), "Offer");
const findAcceptance = (s: DemoState, id: string) => must(s.acceptances.find((a) => a.id === id), "Acceptance");
const findInspection = (s: DemoState, id: string) => must(s.inspections.find((i) => i.id === id), "Inspection");
const findCertificate = (s: DemoState, no: string) => must(s.certificates.find((c) => c.certNo === no), "Certificate");

function requireApproved(p: Participant, role?: Role) {
  if (p.status !== "approved") throw new WorkflowError(`${p.legalName} is not an approved participant.`);
  if (role && p.role !== role) throw new WorkflowError(`${p.legalName} is not a ${role}.`);
}

function log(s: DemoState, ctx: Ctx, action: string, subjectType: string, subjectId: string, detail: string) {
  const actor = s.participants.find((p) => p.id === ctx.actorId);
  record(s, ctx.nowIso, {
    actorId: ctx.actorId,
    actorLabel: actor?.legalName ?? (ctx.actorId === "system" ? "NM-EX system" : ctx.actorId),
    action, subjectType, subjectId, detail,
  });
}

// ... submitRegistration, reviewRegistration, addPurchase, eligibleInventory,
//     canSubmitLot, submitForInspection, markSampleReceived, verifyLot, openOffer ...

export function acceptOffer(
  s: DemoState, ctx: Ctx, input: { offerId: string; acceptorId: string },
): { acceptance: Acceptance; certificate: Certificate } {
  const offer = findOffer(s, input.offerId);
  if (offer.status !== "open") throw new WorkflowError("Offer is not open.");
  if (ctx.nowIso >= offer.closesAt) throw new WorkflowError("Offer period has closed.");
  const acceptor = findParticipant(s, input.acceptorId);
  requireApproved(acceptor, offer.audience === "smelters" ? "smelter" : "buyer");
  const lot = findLot(s, offer.lotId);
  const price = ctx.priceRef();
  const valuation = valueAcceptance({
    weightMt: kgToMt(lot.verifiedKg!),
    gradePct: lot.verifiedGradePct!,
    lmeUsd: price.lmeUsd, fxRate: price.fxRate,
    procurementCoef: lot.kind === "concentrate" ? s.policy.coefToSmelter : 1,
    royaltyPct: s.policy.royaltyPct, vatPct: s.policy.vatPct,
    smelterId: acceptor.id,
  });
  const certNo = certificateNumber(s, "DMO-A", lot.kind, yearOf(ctx.nowIso));
  const acceptance: Acceptance = {
    id: simpleId(s, "acc"), offerId: offer.id, lotId: lot.id, acceptorId: acceptor.id,
    acceptedAt: ctx.nowIso, deadlineAt: addDays(ctx.nowIso, s.policy.paymentWindowDays),
    paymentStatus: "pending", paidAt: null, collectionStatus: "pending", collectedAt: null,
    priceRef: price, valuation, certNo,
  };
  const certificate: Certificate = {
    certNo, cls: "DMO-A", lotId: lot.id, offerId: offer.id, acceptanceId: acceptance.id,
    supplierId: lot.ownerId, counterpartyId: acceptor.id, issuedAt: ctx.nowIso, status: "VALID",
    priceRef: price, valuation, supersedes: null,
    history: [{ at: ctx.nowIso, status: "VALID", byId: "system", note: "Issued on acceptance" }],
  };
  s.acceptances.push(acceptance);
  s.certificates.push(certificate);
  offer.status = "accepted"; offer.acceptanceId = acceptance.id; offer.certNo = certNo;
  lot.status = lot.kind === "concentrate" ? "payment_pending" : "sold_domestic";
  log(s, ctx, "offer.accepted", "lot", lot.id, `${acceptor.legalName} accepted ${lot.id}; ${certNo} issued; royalty liability transferred to ${acceptor.legalName}.`);
  return { acceptance, certificate };
}

export function expireOffer(
  s: DemoState, ctx: Ctx, input: { offerId: string; force?: boolean },
): Certificate {
  const offer = findOffer(s, input.offerId);
  if (offer.status !== "open") throw new WorkflowError("Offer is not open.");
  if (!input.force && ctx.nowIso < offer.closesAt) throw new WorkflowError("Offer period has not ended.");
  const lot = findLot(s, offer.lotId);
  const price = ctx.priceRef();
  const cls = lot.kind === "concentrate" ? "DMO-EC" : "DMO-ER";
  const valuation = valueExportClearance({
    weightMt: kgToMt(lot.verifiedKg!), gradePct: lot.verifiedGradePct!,
    lmeUsd: price.lmeUsd, fxRate: price.fxRate,
    royaltyPct: s.policy.royaltyPct, vatPct: s.policy.vatPct, liabilityHolderId: lot.ownerId,
  });
  const certNo = certificateNumber(s, cls, lot.kind, yearOf(ctx.nowIso));
  const certificate: Certificate = {
    certNo, cls, lotId: lot.id, offerId: offer.id, acceptanceId: null,
    supplierId: lot.ownerId, counterpartyId: null, issuedAt: ctx.nowIso, status: "VALID",
    priceRef: price, valuation, supersedes: null,
    history: [{ at: ctx.nowIso, status: "VALID", byId: "system", note: input.force ? "Issued (offer closed by NM-EX officer)" : "Issued on offer expiry" }],
  };
  s.certificates.push(certificate);
  offer.status = "expired"; offer.certNo = certNo;
  lot.status = "export_cleared";
  log(s, ctx, "offer.expired", "lot", lot.id, `No domestic acceptance for ${lot.id}; ${certNo} issued.`);
  return certificate;
}
```

Remaining functions — required behaviour:

- `submitRegistration`: `id = simpleId(s,"part")`, `regNo: null`, `status: "pending"`, push, log `registration.submitted`.
- `reviewRegistration`: officer only (ctx.actorId must be a participant with role `officer` **or** the literal `"officer-1"` used in tests — implement as: actor is `officer` role, or actor id starts with `officer`). On `approved` assign `regNo(s, p.role, year)` if null. Log `registration.<decision>`.
- `addPurchase`: supplier must be approved supplier; `kg > 0`, `0 < gradePct <= 100`; `lotId: null`; log `purchase.added`.
- `eligibleInventory`: purchases with `lotId === null`, grouped by `tierForGrade`.
- `canSubmitLot`: `eligible[tier] >= mmlKgFor(tierGrade)` where tier 1 uses `policy.tier1MinGradePct + 1`, tier 2 uses `policy.tier1MinGradePct`.
- `submitForInspection`: assert `canSubmitLot`, `kg <= eligible`, `kg >= MML`. Consume oldest-first purchases until cumulative ≥ kg (whole entries; overshoot is fine — the officer verifies actual weight). Weighted average declared grade. Create `Lot` (`status: "submitted_for_inspection"`, `declaredKg: kg`), `Inspection` (`warehouse: policy.warehouses[0]`, `windowEndsAt: addHours(now, sampleWindowHours)`, `status: "awaiting_sample"`). Log `inspection.requested`.
- `markSampleReceived`: officer; inspection `awaiting_sample` → `sample_received`; lot → `sample_received`. Log.
- `verifyLot`: officer; inspection `sample_received`; `verifiedKg <= submittedKg`; set lot verified fields, `assayPriceRef = ctx.priceRef()`, inspection `verified`, lot `verified`; log `assay.verified`; then `openOffer`.
- `openOffer`: lot `verified`; `audience = kind === "concentrate" ? "smelters" : "buyers"`; `closesAt = addDays(now, offerPeriodDays)`; lot → `offered`; log `offer.opened`.
- `expireDueOffers`: map over open offers with `closesAt <= now` → `expireOffer`.
- `recordPayment`: acceptor or officer; `paymentStatus` pending → paid; lot → `collection_pending`.
- `recordCollection`: paid required; lot → `collected`.
- `createParentLot`: all children `collected`, `kind concentrate`, accepted by this smelter (via acceptances); totals by `verifiedKg`, `containedTinKg = Σ kg×grade/100`, `avgGradePct = round2(contained/total×100)`; children `aggregated`, `parentLotId` set. Log.
- `registerRefinedLot`: parents belong to smelter and not yet in a campaign; `inputContainedKg = Σ parent.containedTinKg`; `recoveryPct = round2(recovered/input×100)`; refined `Lot` with `declaredKg = verifiedKg = recoveredKg`, `verifiedGradePct = purityPct`, `verifiedAt = now`, `verifiedBy = actorId`, `assayPriceRef`, `campaignId`; children → `smelted`; log `refined.registered`; `openOffer`.
- `setCertificateStatus`: disallow same status twice and any change from `UTILIZED`/`CANCELLED`/`SUPERSEDED`; push history; `UTILIZED` → lot `utilized`; log `certificate.<status lowercased>`.
- `defaultAcceptance`: acceptance pending payment → cert `CANCELLED` (note "Buyer default"), lot → `verified`, `openOffer`. Log `acceptance.defaulted`.
- `updatePolicy`: `Object.assign(s.policy, patch)`; log `policy.updated` with changed keys.
- `advanceClock`: `s.clockOffsetMs += hours×3_600_000`; log; return `expireDueOffers(s, {...ctx, nowIso: new Date(Date.parse(ctx.nowIso) + hours*3_600_000).toISOString()})`.

- [ ] **Step 4: Run, expect pass** — `npm test` → all green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dmo/workflow.ts src/lib/dmo/workflow.test.ts src/lib/dmo/labels.ts
git commit -m "Add DMO workflow state machine with acceptance, expiry, aggregation and refined re-offer"
```

---

### Task 5: Seed scenario and file store

**Files:**
- Create: `src/lib/dmo/seed.ts`, `src/lib/dmo/store.ts`, `src/lib/dmo/queries.ts`
- Test: `src/lib/dmo/seed.test.ts`
- Modify: `.env.example`, `.gitignore` (add `/data/demo.json`)

**Interfaces:**
- `buildSeed(board: SpotBoard, nowIso: string): DemoState` — builds everything through the workflow functions so the audit log is realistic.
- `SEED_IDS` constant exported for the UI/login: `{ solex, united, solder, officer, verifier, wamba }` participant ids (fixed strings: `"part-solex"`, `"part-united"`, `"part-solder"`, `"part-officer"`, `"part-verifier"`, `"part-wamba"`). To get fixed ids, `buildSeed` calls `submitRegistration` then overwrites `p.id` **before** any other reference is created (do it immediately after each submit).
- Store: `readState(): Promise<DemoState>` (seeds on first read), `mutate<T>(fn: (state, ctx) => T, actorId: string): Promise<T>` (serialized via a module-level promise chain; ctx built with `demoNowIso(state)` and `priceRef` from `readSpotBoard()`; calls `expireDueOffers` before `fn`; writes file), `resetState(): Promise<DemoState>`.
- Paths: `NM_EX_DEMO_PATH` || production `/var/lib/nm-ex/demo.json` || `data/demo.json`.
- `queries.ts`: `participantById`, `lotsFor(state, ownerId)`, `inventoryFor(state, supplierId)` (reuse `eligibleInventory`), `poolFor(state, audience)` → `{ offer, lot, supplier }[]` open offers, `acceptancesFor(state, acceptorId)`, `certificatesFor(state, participantId)`, `certificateView(state, certNo, full: boolean)` → limited or full field object for `/verify`, `pendingRegistrations`, `inspectionQueue`, `openOffers`, `auditTail(n)`.

- [ ] **Step 1: Failing test `src/lib/dmo/seed.test.ts`**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSeed, SEED_IDS } from "./seed";
import { seedBoard } from "@/lib/store";

const NOW = "2026-09-04T08:00:00.000Z";

test("seed contains the scripted scenario", () => {
  const s = buildSeed(seedBoard(), NOW);
  const solex = s.participants.find((p) => p.id === SEED_IDS.solex)!;
  assert.equal(solex.regNo, "NMEX-SUP-2026-00456");
  assert.equal(s.participants.find((p) => p.id === SEED_IDS.united)!.regNo, "NMEX-SMEL-2026-00015");
  assert.equal(s.participants.find((p) => p.id === SEED_IDS.wamba)!.status, "pending");

  // 980 kg in the ledger, button disabled
  const free = s.purchases.filter((p) => p.supplierId === SEED_IDS.solex && p.lotId === null);
  assert.equal(free.reduce((a, p) => a + p.kg, 0), 980);

  // one lot awaiting sample, one 25 t offer open to smelters
  assert.ok(s.inspections.some((i) => i.status === "awaiting_sample"));
  const open = s.offers.filter((o) => o.status === "open");
  assert.ok(open.some((o) => o.audience === "smelters"));
  assert.ok(open.some((o) => o.audience === "buyers"));

  // one DMO-EC, one DMO-ER, five DMO-A (three 1 t children + the two lots behind the refined lots)
  const by = (cls: string) => s.certificates.filter((c) => c.cls === cls).length;
  assert.equal(by("DMO-EC"), 1);
  assert.equal(by("DMO-ER"), 1);
  assert.equal(by("DMO-A"), 5);

  // three 1 t child lots collected and ready to aggregate
  const collected = s.lots.filter((l) => l.status === "collected");
  assert.equal(collected.length, 3);
});
```

Note: `@/lib/store` imports `node:fs`, fine under tsx. The `@/` alias must resolve in tests: tsx reads `tsconfig.json` paths — confirm `tsconfig.json` has `"paths": {"@/*": ["./src/*"]}` (it does for Next). If tsx fails to resolve, add `"tsconfig": "tsconfig.json"` is default; otherwise import `../store` relatively in the test.

- [ ] **Step 2: Run, expect failure.**

- [ ] **Step 3: Write `src/lib/dmo/seed.ts`**

Build with workflow functions and a fixed-price ctx from the board. Set counters first so the registration numbers match the sample certificates: `state.counters["reg:SUP:2026"] = 455`, `["reg:SMEL:2026"] = 14`, `["reg:BUY:2026"] = 101`, `["cert:DMO-EC:concentrate:2026"] = 20`, `["cert:DMO-A:concentrate:2026"] = 26`, `["parent:2026"] = 40`. Because items 11 and 12 below are seeded before item 7 in time order but the ids are assigned in call order, run items in this call order: 1–5, 11, 12, 6, 7, 8, 9, 10 — so the DMO-A sequence is 00027, 00028 (refined-path lots), then 00029–00031 (child lots).

Scenario, in this order (times relative to `nowIso`, using `addDays(now, -n)` helper for the past):

1. Officer participant `part-officer` ("NM-EX Compliance & Market Operations", role `officer`, status approved, regNo null). Verifier `part-verifier` ("Neroli Inspection Services (PIA)", role `verifier`, approved).
2. Solex Tin Ltd (`part-solex`, supplier/tin_shed, 7 Oladipo Street, GRA, Jos; Tunde Oladipo; +234 803 555 7788; info@solextin.com) → approved (regNo 00456).
3. United Smelters Ltd (`part-united`, smelter; 12 Industrial Way, Jos Road, Plateau State; John A. Adewale; +234 801 234 5678; info@unitedsmelters.ng) → approved (00015).
4. Lagos Solder Works Ltd (`part-solder`, buyer/end_user; Ikeja, Lagos) → approved (00102).
5. Wamba Tin Shed (`part-wamba`, supplier/tin_shed, Wamba, Nasarawa) → left `pending` with two documents listed.
6. Solex: 25 × 1,000 kg @ 78% purchases (dated −20 d) → submit 25,000 kg → sample received → verified 25,000 kg @ 78% → offer opened at −6 d → `expireOffer` at −1 d (natural expiry) → **DMO-EC `…-00021`**.
7. Solex: 3 × 1,000 kg @ 72 / 75 / 78% → three separate submits/verifies (−10 d) → United accepts each (−9 d) → **DMO-A 00029, 00030, 00031** → pay → collect (all three `collected`).
8. Solex: 25 × 1,000 kg @ 78% → verified (−2 d) → **offer open** (closes +3 d). This is the lot United accepts live.
9. Solex: 1,200 kg (12 × 100 kg @ 72%) → submitted (−1 d), `awaiting_sample`.
10. Solex ledger: 19 purchases totalling 980 kg @ 72% (18 × 50 kg + 1 × 80 kg), dated −5…−1 d, `lotId null`.
11. United refined lot with no buyer: seed a separate Solex 25,000 kg @ 78% lot (−30 d) → accepted by United (−29 d, DMO-A) → paid → collected → parent lot (`…-0041`) → `registerRefinedLot` with `recoveredKg: 18_525`, `purityPct: 99.95` (95% of 19,500 kg contained; mass balance stays honest, so this DMO-ER reads 18.525 MT rather than the handout's 25 MT) → offer opened −7 d → natural `expireOffer` at −2 d → **DMO-ER `…-00001`**.
12. United: second refined lot — seed another Solex 8,000 kg @ 75% lot (−25 d) → accepted (DMO-A) → paid → collected → parent lot → `registerRefinedLot` 5,700 kg @ 99.95% → **offer open to buyers** (closes +4 d) for the live domestic-sale moment. This makes five DMO-A in total; adjust the seed test to `by("DMO-A") === 5`. Counter for DMO-A starts at 26 so the three child-lot certificates are 00029–00031.

Export `SEED_IDS`.

- [ ] **Step 4: Write `src/lib/dmo/store.ts`**

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { readSpotBoard } from "@/lib/store";
import { demoNowIso } from "./clock";
import { priceRefFromBoard } from "./prices";
import { buildSeed } from "./seed";
import type { DemoState } from "./types";
import { expireDueOffers, type Ctx } from "./workflow";

const LOCAL_PATH = path.join(process.cwd(), "data", "demo.json");
const PERSIST_PATH =
  process.env.NM_EX_DEMO_PATH ||
  (process.env.NODE_ENV === "production" ? "/var/lib/nm-ex/demo.json" : LOCAL_PATH);

let chain: Promise<unknown> = Promise.resolve();

async function write(state: DemoState): Promise<void> {
  await fs.mkdir(path.dirname(PERSIST_PATH), { recursive: true });
  await fs.writeFile(PERSIST_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function load(): Promise<DemoState> {
  try {
    const raw = await fs.readFile(/* turbopackIgnore: true */ PERSIST_PATH, "utf8");
    return JSON.parse(raw) as DemoState;
  } catch {
    const board = await readSpotBoard();
    const seeded = buildSeed(board, new Date().toISOString());
    await write(seeded);
    return seeded;
  }
}

export function readState(): Promise<DemoState> {
  return load();
}

export function mutate<T>(
  actorId: string,
  fn: (state: DemoState, ctx: Ctx) => T,
): Promise<T> {
  const run = chain.then(async () => {
    const [state, board] = await Promise.all([load(), readSpotBoard()]);
    const nowIso = demoNowIso(state);
    const ctx: Ctx = { actorId, nowIso, priceRef: () => priceRefFromBoard(board, nowIso) };
    expireDueOffers(state, { ...ctx, actorId: "system" });
    const result = fn(state, ctx);
    await write(state);
    return result;
  });
  chain = run.catch(() => undefined);
  return run;
}

export async function resetState(): Promise<DemoState> {
  return mutate("system", (state) => {
    // replaced below; mutate needs a state to write
    return state;
  }).then(async () => {
    const board = await readSpotBoard();
    const seeded = buildSeed(board, new Date().toISOString());
    await write(seeded);
    return seeded;
  });
}
```

Simplify `resetState` to: `chain = chain.then(async () => { const seeded = buildSeed(await readSpotBoard(), new Date().toISOString()); await write(seeded); return seeded; }); return chain as Promise<DemoState>;`.

- [ ] **Step 5: Write `src/lib/dmo/queries.ts`** with the selectors listed in Interfaces. `certificateView(state, certNo, full)` returns:

```ts
export type CertificatePublicView = {
  certNo: string; cls: CertificateClass; title: string; status: CertificateStatus;
  commodity: string; verifiedMt: number; verifiedGradePct: number;
  lotId: string; parentLotId: string | null; issuedAt: string; utilized: boolean;
};
export type CertificateFullView = CertificatePublicView & {
  supplier: Participant; counterparty: Participant | null; valuation: Valuation;
  priceRef: PriceRef; offer: Offer; acceptance: Acceptance | null; history: StatusChange[];
  audit: AuditEvent[];
};
```

- [ ] **Step 6: Add to `.gitignore`:** `/data/demo.json`. Add to `.env.example`:

```
DEMO_PASSWORD=nmex-demo
NM_EX_DEMO_PATH=
NM_EX_PUBLIC_URL=https://www.nm-ex.com
```

- [ ] **Step 7: Run tests, expect pass. Commit.**

```bash
git add src/lib/dmo/seed.ts src/lib/dmo/seed.test.ts src/lib/dmo/store.ts src/lib/dmo/queries.ts .gitignore .env.example
git commit -m "Seed the scripted DMO scenario and persist demo state as a JSON file"
```

---

### Task 6: Sessions, login, registration

**Files:**
- Create: `src/lib/dmo/session.ts`, `src/app/login/page.tsx`, `src/app/login/login-cards.tsx`, `src/app/login/actions.ts`, `src/app/register/page.tsx`, `src/app/register/register-form.tsx`, `src/app/register/actions.ts`, `src/app/portal/layout.tsx`, `src/app/portal/portal-nav.tsx`, `src/app/portal/page.tsx`, `src/app/portal/actions.ts`
- Modify: `src/components/site-header.tsx`

**Interfaces:**
- `session.ts`: `type Session = { participantId: string; role: Role; exp: number }`; `createSession(participantId, role)`, `getSession(): Promise<Session|null>`, `clearSession()`, `requireSession(...roles: Role[]): Promise<Session>` (throws `WorkflowError("Not signed in")` / `("Not permitted")`). Cookie `nm_ex_portal`, value `base64url(json).hmac`, secret `DEMO_SESSION_SECRET || DEMO_PASSWORD || "nmex-demo"`, 12 h, httpOnly, sameSite lax, secure in production. Pattern: `src/lib/desk-auth.ts`.
- `login/actions.ts`: `loginAs(prev, formData)` — fields `participantId`, `password`; password must equal `DEMO_PASSWORD || "nmex-demo"`; participant must exist and be `approved` (pending Wamba → error "Application still under review — sign in as the NM-EX officer to approve it"); redirect `/portal`.
- `register/actions.ts`: `submitRegistrationAction(prev, formData)` → `mutate("anon", submitRegistration(...))`; documents come from `formData.getAll("documents")` as `File[]` → map to `{ name, type }` (bytes discarded); redirect `/register?submitted=<id>`.
- `portal/actions.ts`: `logout()`.
- `portal/layout.tsx`: `getSession()`; if null `redirect("/login")`; loads participant; renders `PortalNav` (role-specific links, participant name + regNo, Logout) and children. Role home: supplier→`/portal/supplier`, smelter→`/portal/smelter`, buyer→`/portal/buyer`, officer→`/portal/admin`, verifier→`/portal/verify`. `portal/page.tsx` redirects to role home.

- [ ] **Step 1: `session.ts`** per interface (copy `desk-auth.ts` style, `timingSafeEqual` on the HMAC).

- [ ] **Step 2: `/login`** — page: heading "Sign in to NM-EX", six role cards from `readState()` (`SEED_IDS`), each card: role kicker, legal name, regNo or "Application pending", one-line description of what they can do, and a "Sign in" button; the card is a `<form action={loginAs}>` with hidden `participantId` and a prefilled hidden `password` from `DEMO_PASSWORD` **only when** `process.env.DEMO_ONE_CLICK !== "false"`. Below: plain form (participant e-mail select + password) for the "real login" look. Show `state.error` in `--copper`.

- [ ] **Step 3: `/register`** — three-step client form (`useActionState`): (1) participant type radio cards (5 categories from `CATEGORY_LABEL`, map category → role: tin_shed/mining_company/aggregator → supplier, smelter → smelter, end_user → buyer); (2) company details fields; (3) the category's `requiredDocuments` list from `readState().policy`, each with `<input type="file" name="documents">` (multiple accepted, not required — demo). Submit → success panel "Application received. Reference `<id>`. NM-EX will review your documents." with a link to `/login`. Pass the policy `requiredDocuments` from the server page as a prop.

- [ ] **Step 4: `/portal` layout + nav + redirect page.**

- [ ] **Step 5: Site header** — add links `Exchange` (`/exchange`), `Verify` (`/verify`), `Register` (`/register`), `Login` (`/login`) to `src/components/site-header.tsx` nav (keep Spot / Tin). On `<sm` screens show only Login and Register.

- [ ] **Step 6: Manual check** — `npm run dev`; visit `/login`, sign in as each role, confirm redirect to the role home (placeholder pages 404 for now — that's expected until Tasks 7–10; add minimal `page.tsx` stubs that render the role name so the layout can be checked). Sign in as Wamba → error. `/register` → submit → success. Commit.

```bash
git add src/lib/dmo/session.ts src/app/login src/app/register src/app/portal src/components/site-header.tsx
git commit -m "Add role sessions, one-click demo login, role-based registration and the portal shell"
```

---

### Task 7: Shared portal components

**Files:**
- Create: `src/components/portal/panel.tsx`, `status-pill.tsx`, `field-list.tsx`, `money.tsx`, `countdown.tsx`, `action-button.tsx`, `empty.tsx`

**Interfaces:**
- `Panel({ kicker, title, actions?, children })` — bordered white/55 panel matching `tin-desk.tsx` article.
- `StatusPill({ tone: "ok"|"warn"|"bad"|"muted", children })` — `ok` forest, `warn` copper, `bad` `#9b2c2c`, muted grey.
- `FieldList({ rows: { label: string; value: ReactNode; strong?: boolean }[] })` — two-column definition list used by cards and certificates.
- `Money({ ngn: number|null, usd?: number|null })` — NGN with 2 dp using a new `formatNgnPrecise` added to `src/lib/format.ts` (`minimumFractionDigits: 2`); USD underneath when given.
- `Countdown({ untilIso, nowIso, label })` — client component; shows `2d 04h 12m` / "Closed"; ticks each minute; **must** take `nowIso` from the server (demo clock) and compute offset once on mount.
- `ActionButton({ children, pending?, tone? })` — `--ink` filled, `disabled:opacity-60`; and `ActionForm({ action, hidden: Record<string,string>, children, confirm? })` that renders a `<form>` with hidden inputs and uses `useFormStatus` for pending.
- `Empty({ children })` — muted one-liner.

- [ ] Build, then `npm run lint`, commit: `git commit -m "Add shared portal UI primitives"`.

---

### Task 8: Admin console (`/portal/admin`)

**Files:**
- Create: `src/app/portal/admin/page.tsx`, `actions.ts`, `registrations.tsx`, `inspections.tsx`, `offers.tsx`, `certificates.tsx`, `policy-form.tsx`, `audit.tsx`, `demo-controls.tsx`, `demo-script.tsx`
- Route: `page.tsx` reads `?tab=` (`registrations|inspections|offers|certificates|policy|audit|demo`), default `registrations`. Tabs are `<a href>` links (server rendering, no client state).

**Actions (`actions.ts`, all `requireSession("officer")` then `mutate(session.participantId, …)` then `revalidatePath("/portal")`, return `{ error?: string }` on `WorkflowError`):**
- `reviewRegistrationAction(formData: participantId, decision, note)`
- `markSampleReceivedAction(inspectionId)`
- `verifyLotAction(inspectionId, verifiedKg, verifiedGradePct)`
- `closeOfferAction(offerId)` → `expireOffer(…, { force: true })`
- `setCertificateStatusAction(certNo, status, note)`
- `updatePolicyAction(formData → numeric fields)`
- `advanceClockAction(hours)`
- `resetDemoAction()` → `resetState()`
- `defaultAcceptanceAction(acceptanceId)`

**Screens:**
- Registrations: table of `pending|under_review|more_info` applicants: name, category, documents listed, submitted at; per row buttons Approve / Request info / Reject (note field). Below: approved participants list with regNo.
- Inspections: queue by status: awaiting sample (countdown, "Mark sample received"), sample received (form: verified kg, verified grade → "Lock assay & open offer"; show declared values beside inputs and preview contained tin live client-side), verified today.
- Offers: open offers with lot, supplier, audience, closes in (countdown), indicative value from current board (`referenceValueNgn` × coef for smelters), button "Close offer now (no acceptance)" → issues EC/ER. Accepted awaiting payment: deadline countdown, "Record buyer default".
- Certificates: register table: certNo, class, lot, parties, issued, status pill, links View / Print; actions Suspend / Under review / Cancel / Reinstate (VALID) with note; Mark utilized.
- Policy: form with every `DmoPolicy` numeric field (labels from spec §8), OMP coefficient field with helper text "Not yet prescribed by the Ministry — separate from the buying coefficient"; warehouses and required documents as textareas (one per line). Save → `updatePolicy`.
- Audit: last 200 events, newest first: time (Lagos), actor, action, subject, detail. Filter by subject id via `?subject=`.
- Demo: buttons Advance clock +1 h / +1 d / +5 d; Reset scenario (confirm); current demo time; link "Ministry briefing (legacy desk)" → `/desk`. Demo script: the 15 storyboard steps, each with one sentence, the role to be signed in as, and a link to the exact screen (e.g. step 5 → `/portal/smelter?tab=pool`). Steps: 1 mine→NM-EX (register), 2 delivery to warehouse (inspection request), 3 weighing & sampling (mark sample received), 4 assay & verification (lock assay), 5 DMO offer (pool), 6 smelter acceptance → royalty transfer (accept), 7 multiple 1 MT lots (child lots), 8 aggregation → parent lot, 9 transport (manifest), 10 smelting & recovery (register refined), 11 refined production lot, 12 second DMO offer refined, 13 outcome A domestic sale (buyer accepts), 14 outcome B no smelter → DMO-EC (close offer), 15 outcome C refined no buyer → DMO-ER; plus 16 verify by QR.

- [ ] Build each tab, run through all actions in the browser against the seed, `npm run lint`, commit: `git commit -m "Add the NM-EX officer console: approvals, assay lock, offers, certificates, policy, audit and demo controls"`.

---

### Task 9: Supplier dashboard (`/portal/supplier`)

**Files:**
- Create: `src/app/portal/supplier/page.tsx`, `actions.ts`, `ledger.tsx`, `inventory.tsx`, `lots.tsx`
- Tabs `?tab=ledger|lots|certificates`, default `ledger`.

**Actions (`requireSession("supplier")`, actor = session participant):**
- `addPurchaseAction(date, source, kg, gradePct, valueNgn, reference)`
- `submitForInspectionAction(tier, kg)`

**Screens:**
- Ledger: top strip — two inventory cards (Tier 1 > 50% Sn, Tier 2 ≤ 50%): eligible kg, MML, progress bar, and the **Submit lot for inspection** button, `disabled` until `canSubmitLot`; when enabled show a kg input defaulting to the full eligible amount. Below: "Log a purchase" form (date, source, kg, grade %, value ₦, receipt ref) and the ledger table (newest first, with lot link when consumed). Show the indicative procurement benchmark for the supplier's grade: `LME × grade × coefMinerToAggregator × FX` per tonne, labelled "Indicative miner → aggregator benchmark (live board)".
- Lots: cards per lot: id, status pill, declared vs verified weight/grade, contained tin, warehouse + sample-window countdown when awaiting sample, offer window countdown when offered, indicative value while offered, certificate link when issued, timeline of audit events for the lot.
- Certificates: list of own certificates with View / Print links.

- [ ] Build, run the MML flip live (add 50 kg → button activates → submit 1,030 kg → appears in admin inspection queue), lint, commit: `git commit -m "Add the supplier dashboard: purchase ledger, MML trigger, inspection requests and lots"`.

---

### Task 10: Smelter and buyer dashboards

**Files:**
- Create: `src/app/portal/smelter/page.tsx`, `actions.ts`, `pool.tsx`, `pipeline.tsx`, `parent-lot.tsx`, `refined.tsx`; `src/app/portal/buyer/page.tsx`, `actions.ts`
- Smelter tabs `?tab=pool|accepted|parent|refined|certificates`.

**Smelter actions (`requireSession("smelter")`):** `acceptOfferAction(offerId)`, `recordPaymentAction(acceptanceId)`, `recordCollectionAction(acceptanceId)`, `createParentLotAction(childLotIds[])`, `registerRefinedLotAction(parentLotIds[], recoveredKg, purityPct)`.

**Screens:**
- National Pool: cards for open `smelters` offers: lot id, verified weight, verified grade, contained tin, collection point (warehouse), offer closes (countdown), indicative purchase value at `coefToSmelter` from the live board with "indicative — fixed at acceptance", supplier shown as **"Verified NM-EX supplier"** (confidentiality, brief §7) — do not show Solex's name here. Button **Accept & purchase** → confirm dialog text: "Acceptance is binding. Royalty liability for X MT contained tin transfers to you immediately. Payment and collection due within 5 days." → DMO-A issued → redirect to `/certificates/<certNo>`.
- Accepted: pipeline table Accepted → Payment pending → Paid → Collection pending → Collected with deadline countdown, buttons Record payment / Record collection, certificate link, consolidated royalty-liability ledger total (Σ `valuation.royaltyNgn` for held liabilities).
- Parent lot: checklist of `collected` child lots (id, kg, grade, contained), running totals (weight, contained, weighted grade), "Create parent lot & manifest" → parent card with children table and a printable manifest block. Existing parents listed.
- Refined: form — select parents not yet in a campaign, input recovered kg (helper: expected at policy recovery %), purity % → "Register refined lot & offer domestically"; campaign card with mass balance (input contained, recovered, recovery %, variance flag when |actual − policy| > 3 points). Refined lots list with offer status.
- Buyer (`/portal/buyer`): refined pool (open `buyers` offers) with Accept (DMO-A), own acceptances with Record payment.

- [ ] Build; run the full chain in the browser: accept the seeded 25 t → DMO-A → pay → collect → aggregate with the three 1 t children → refined lot → shows in buyer pool → buyer accepts. Lint, commit: `git commit -m "Add smelter and domestic-buyer dashboards: National Pool, acceptance pipeline, parent lots and refined re-offer"`.

---

### Task 11: Certificates, QR and verification

**Files:**
- Create: `src/app/certificates/[certNo]/page.tsx`, `certificate-sheet.tsx`, `certificate.css`; `src/app/verify/page.tsx`, `src/app/verify/[certNo]/page.tsx`; `src/app/portal/verify/page.tsx`, `verify-form.tsx`, `actions.ts`; `src/lib/dmo/qr.ts`

**Interfaces:**
- `qr.ts`: `qrSvg(text: string): Promise<string>` using `QRCode.toString(text, { type: "svg", margin: 0, errorCorrectionLevel: "M" })`; `verifyUrl(certNo)` = `${process.env.NM_EX_PUBLIC_URL ?? "http://localhost:3000"}/verify/${certNo}`.
- `/certificates/[certNo]`: server page; anyone with the link can view (the number is the secret — same as paper). Renders `CertificateSheet` A4-landscape-proportioned (max-w 1100px), print stylesheet hides site chrome and fixes to one page (`@page { size: A4 landscape; margin: 10mm }`). Layout mirrors the samples: header row (NM-EX mark + "Nigerian Mineral Exchange Platform", centred title/subtitle/banner, right column certificate no. + QR + date of issue), intro sentence, four panels — DMO-EC/ER: 1 Supplier information, 2 Commodity details, 3 Value summary, 4 Liability & payment; DMO-A: 1 Supplier, 2 Domestic smelter, 3 Commodity & transaction details, 4 Financial summary — then Important notes, round NM-EX seal (CSS), "Authorized by: Director, Compliance & Market Operations", footer "Verify this certificate at: www.nm-ex.com/verify". Status banner colour: VALID green, others red with the status word. Include "LME Tin Price (Reference) US$X / MT as at <time>" and "CBN FX Reference ₦X / US$ as at <time>" from `priceRef`. A "Print / Save as PDF" button (client, `window.print()`) and a "Back" link outside the sheet, hidden in print.
- `/verify`: single input "Certificate number", submit → `/verify/<no>`. Also accepts `?q=`.
- `/verify/[certNo]`: public. If not found: "No certificate with this number" in red. Else big status pill + `CertificatePublicView` fields + "Scan the QR code on the certificate or enter its number. The printed certificate is a representation; this record is authoritative." If the visitor has an officer/verifier session, render the full view (parties, values, history, audit) and — for verifiers/officers — a "Mark utilized — export completed" form (`setCertificateStatusAction` from admin; for verifier create `src/app/portal/verify/actions.ts` `markUtilizedAction(certNo, note)` with `requireSession("verifier","officer")`).
- `/portal/verify`: verifier console: the same input, recent verifications (audit events by this actor), a note "Scan with your phone: the QR on any NM-EX certificate opens this record."

- [ ] Build; open the three seeded certificates; print preview one page; scan the QR from a phone on the LAN (or check the URL); mark one utilized as verifier and confirm `/verify/<no>` shows UTILIZED and the lot is `utilized` in admin. Lint, commit: `git commit -m "Render printable DMO certificates with QR codes and public verification"`.

---

### Task 12: `/exchange` landing page

**Files:**
- Create: `src/app/exchange/page.tsx`, `src/components/exchange/exchange-hero.tsx`, `metal-carousel.tsx`, `flow-strip.tsx`, `spot-strip.tsx`, `public/metals/*.svg` (or `.webp`)

**Requirements (brief §1):**
- Full-bleed dark industrial hero (ink background, subtle grain from existing `.grain`), headline "Nigeria's metals and minerals exchange", sub "Compliant supply · Domestic processing · Market access · Traceability", two prominent buttons **Register** (`/register`, forest fill) and **Login** (`/login`, outline), tertiary link "Verify a certificate".
- `MetalCarousel`: Framer Motion loop rotating between four rendered items — tin ingot, copper ingot, lead ingot, cassiterite concentrate — each a CSS/SVG rendered card (gradient metallic block with label and purity), slow 3D tilt/rotate (`rotateY` keyframes, 14 s), pausable on hover, respects `prefers-reduced-motion`. No video, no external images.
- `FlowStrip`: the DMO chain in nine chips: Register → Weigh → Assay → Value → Offer domestically → Accept or clear for export → Pay & collect → Smelt → Verify before export.
- `SpotStrip`: reads `readSpotBoard()` and shows tin, copper, lead, zinc last in NGN (USD under) with "Live NM-EX board" and a link to `/#spot`. Reuse `formatNgn`, `formatUsd`, `toNgn`.
- Three institutional cards: "For suppliers", "For smelters & processors", "For NESS, Customs & Ministry".
- Footer reuse `SiteFooter`. Header: reuse `SiteHeader` but on this page it sits on dark — pass a `tone="dark"` prop (add optional prop; default unchanged so `/` is unaffected).
- Mobile: hero stacks, buttons full-width.

- [ ] Build, compare against `/` on phone and desktop, lint, commit: `git commit -m "Add the /exchange landing page with animated metals, Register and Login"`.

---

### Task 13: Polish, README, deploy notes, final verification

**Files:**
- Modify: `README.md` (add "Demo platform" section: routes, roles, env, reset), `src/app/layout.tsx` metadata description unchanged.

- [ ] **Step 1:** Add a `not-found.tsx` for `/certificates/[certNo]` and `/verify/[certNo]` with the site header.
- [ ] **Step 2:** Portal error handling: every action returns `{ error }` on `WorkflowError` and the forms display it; unexpected errors bubble to Next's error boundary — add `src/app/portal/error.tsx` with "Something went wrong — Reset scenario from the officer console" and a link.
- [ ] **Step 3:** Projector pass at 1280×720 and 1920×1080: fonts ≥ 14px in tables, status pills legible, no horizontal scroll.
- [ ] **Step 4:** Full scripted run from a fresh reset, in this order, in two browser windows (officer + the acting role): register Wamba (already pending) → approve; supplier adds 50 kg → submit 1,030 kg; officer marks sample received → locks assay 1,019 kg @ 70% → offer opens; smelter accepts seeded 25 t → DMO-A; smelter pays/collects; parent lot from the three 1 t children; refined lot → buyer accepts; officer closes the buyers offer on the other refined lot → DMO-ER; verifier marks the seeded DMO-EC utilized; check `/verify` on a phone.
- [ ] **Step 5:** `npm run lint && npm test && npm run build` all clean.
- [ ] **Step 6:** README + commit: `git commit -m "Document the DMO demo platform and its demo controls"`.
- [ ] **Step 7:** Push, mark PR ready. Merge to `main` deploys to `www.nm-ex.com`; the server needs no change (`/var/lib/nm-ex/demo.json` is created on first request). Set `DEMO_PASSWORD` and `NM_EX_PUBLIC_URL=https://www.nm-ex.com` in the service environment if different from defaults.

---

## Self-review against the spec

- §4 roles and seeded accounts → Tasks 5, 6. §5 routes → Tasks 6, 8–12. §6 domain model → Task 1; state machines → Task 4. §7 valuation and price snapshots → Tasks 2, 3, 4 (`priceRef()` at assay lock, acceptance, issue). §8 policy → Tasks 1, 8. §9 certificates/verification → Tasks 3 (labels), 11. §10 seed → Task 5. §11 landing → Task 12. §12 auth → Task 6. §14 deployment → Task 13.
- Confidentiality (brief §7): pool hides supplier identity → Task 10. Buyer default (guidelines §23) → `defaultAcceptance` Task 4, button Task 8. Cancelled/superseded remain visible → `setCertificateStatus` history, Task 8 register lists all statuses.
- Type consistency: `Ctx` defined in Task 4 and used by store (Task 5) and actions (Tasks 8–11); `certificateView` shapes defined in Task 5 and consumed in Task 11; `SEED_IDS` defined in Task 5, used in Task 6.
- Known simplification: refined domestic sale issues a DMO-A with subtitle "Refined Tin / Tin Ingot" (`certClassTitle(cls, kind)`); the seeded DMO-ER is 18.525 MT, not the handout's 25 MT, because the seed keeps mass balance honest.
