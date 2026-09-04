# NM-EX DMO demo platform — design

Date: 2026-09-04
Status: draft for Kenny's review
Purpose: a working, clickable demonstration of the NM-EX Domestic Market Offer
(DMO) operating model for a web-conference walkthrough with Nigerian officials.

Source documents (held outside the repo): Website Adjustment Brief for Kenny;
DMO Certificate Handbook; Draft Guidelines for the Issuance, Use and Verification
of DMO Certificates; Mandatory Warehouse & Assay Verification Supplement;
OMP Draft Policy Note; Ministry One-Pager; three sample certificates
(DOF export clearance — concentrate, DOF export clearance — refined tin,
DOF acceptance — concentrate); 15-step process storyboard.

## 1. Goal

Kenny shares his screen and walks officials through the full tin pilot flow:

    register → verify weight & assay → National Pool offer → smelter accepts
    or offer expires → certificate issued → pay/collect → parent lot → smelt
    → refined lot re-offered → domestic sale or export clearance
    → NESS/Customs verify the certificate by QR or number

Every step is a real state change persisted on the server. Any official can
scan the projected QR code with a phone and see the live certificate status.

Not a goal: production KYC, payments, e-mail, or integration with NESS, NXP,
CCI, Customs, CBN or the Ministry. The documents say these remain configurable
until authorities approve them.

## 2. What exists today

- `/` — public spot board (LME/SMM scrapes, USD→NGN) with a tin procurement
  calculator (`LME × benchmark % × assay %`). Kept as-is.
- `/desk` — single-password ministry briefing (mock sheds, leaked lots, lost
  revenue slider). Kept as-is, reachable from the admin console as
  "Ministry briefing". Its narrative (concentrate export blocked, royalty only
  on refining) predates the DMO documents; it is not part of the demo path.
- File-backed persistence in `src/lib/store.ts` (`data/*.json` locally,
  `/var/lib/nm-ex/*.json` in production). The demo store follows this pattern.
- Deploy: push to `main` → GitHub Actions → SSH → `deploy-nm-ex.sh` → systemd
  on port 3003 behind nginx at `www.nm-ex.com`.

## 3. Approach

A real domain model and state machine, persisted to one JSON file
(`/var/lib/nm-ex/demo.json` in production, `data/demo.json` locally), with:

- a **seeded scenario** that reproduces the worked examples in the handbook
  and the three sample certificates to the kobo;
- **seeded accounts**, one per role, chosen from a card on the login page;
- **demo controls** (admin only): advance the clock, expire an offer now,
  reset the scenario.

Rejected: a client-only click-through (state does not cross roles or
survive a refresh) and a full database backend (more than a demo needs while
policy is unapproved).

## 4. Roles and seeded accounts

| Role | Seeded participant | Reg. no. | Sees |
|---|---|---|---|
| Supplier (tin shed / aggregator) | Solex Tin Ltd, Jos | NMEX-SUP-2026-00456 | own ledger, inventory, lots, offers, certificates |
| Qualified domestic smelter | United Smelters Ltd, Jos | NMEX-SMEL-2026-00015 | National Pool, accepted lots, parent lots, refined lots, certificates |
| Domestic end user (refined tin buyer) | Lagos Solder Works Ltd | NMEX-BUY-2026-00102 | refined-tin pool, own acceptances |
| NM-EX officer (admin) | NM-EX Compliance & Market Operations | — | everything, plus approvals, verification, policy, demo controls |
| Verifier (NESS PIA / Customs) | Neroli Inspection (PIA) | — | verification screen only |
| Pending applicant | Wamba Tin Shed | (none yet) | used to demo registration approval |

All demo accounts share one password from `DEMO_PASSWORD` (default
`nmex-demo`). The existing `/desk` password is untouched.

Permissions are enforced on the server in every action, not only hidden in
the UI (brief §16).

## 5. Routes

Public

- `/` — current spot board, unchanged.
- `/exchange` — new landing page per brief §1 (see §11). Lives beside `/`
  so the two can be compared; promoting it to `/` later is a one-line change.
- `/register` — role picker → role-specific document checklist → submit →
  "Application received, under review".
- `/login` — role cards (one click) plus a plain e-mail/password form.
- `/verify` — enter a certificate number; `/verify/[certNo]` — result. Also
  the QR target. Public view shows the limited field set from brief §15;
  signed-in verifiers and officers see the full record.
- `/certificates/[certNo]` — printable certificate, styled after the sample
  images, with QR. Browser "Print → Save as PDF" is the PDF.

Signed in (`/app/...`, layout switches by role)

- `/app/supplier` — purchase ledger, running inventory by grade tier, MML
  trigger, inspection requests with 48-hour countdown, lots, offers,
  certificates.
- `/app/smelter` — National Pool, Accept, accepted-lot pipeline
  (Accepted → Payment pending → Paid → Collection pending → Collected),
  parent-lot builder, register refined lot, offer refined lot, certificates.
- `/app/buyer` — refined-tin pool, Accept, own acceptances.
- `/app/admin` — registration queue, inspection queue (mark sample received,
  enter verified weight/grade, approve to pool), offers (close/expire),
  certificate register (cancel, suspend, mark utilized), policy, audit log,
  demo controls, demo script.
- `/app/verify` — verifier console: number or QR → status and matching
  fields → Mark utilized.

## 6. Domain model

All records are append-friendly; nothing is deleted. Every mutation writes an
`AuditEvent { at, actor, action, subjectType, subjectId, detail }` (brief §18).

- **Participant** — id, regNo, role, legalName, address, contact, status
  (`pending | under_review | more_info | approved | rejected | suspended`),
  documents (name + type only; bytes are not stored).
- **PurchaseEntry** — supplierId, date, source (free text; may be
  unregistered), mineral, kg, purchasing-point grade %, value NGN, reference.
- **Lot** — id (`NMEX-TIN-…`), kind (`concentrate | refined`), ownerId,
  status, declared weight/grade, verified weight/grade (locked by officer),
  containedTin, parentLotId?, childLotIds[], sourcePurchaseIds[],
  smeltingCampaignId?
- **InspectionRequest** — lotId, submitted kg, assigned warehouse, window
  (48 h), status (`awaiting_sample | sample_received | verified | rejected`).
- **Offer** — lotId, opensAt, closesAt (policy offer period), audience
  (`smelters | buyers`), status (`open | accepted | expired | withdrawn`),
  responses[].
- **Acceptance** — offerId, acceptorId, acceptedAt, payment status,
  collection status, deadline (policy window), default flag.
- **Certificate** — certNo, class (`DMO-A | DMO-EC | DMO-ER`), lotId,
  offerId, acceptanceId?, issuedAt, status
  (`VALID | EXPIRED | UTILIZED | CANCELLED | SUSPENDED | UNDER_REVIEW |
  SUPERSEDED`), frozen valuation snapshot (see §7), supersedesCertNo?
- **ParentLot** — id (`NMEX-AGG-TIN-YYYY-NNNN`), smelterId, childLotIds[],
  total weight, total contained tin, weighted average grade, manifest.
- **SmeltingCampaign** — parentLotIds[], input contained tin, actual
  recovered tin, recovery %, refinedLotId.
- **Policy** — see §8.

Lot status machine (concentrate):

    draft → in_ledger → submitted_for_inspection → sample_received
      → verified → offered → accepted | expired
      accepted → payment_pending → paid → collection_pending → collected
        → aggregated → smelted
      expired → export_cleared (DMO-EC) → utilized

Lot status machine (refined):

    registered → verified → offered → accepted (domestic sale) | expired
      expired → export_cleared (DMO-ER) → utilized

## 7. Valuation engine

Pure functions in `src/lib/dmo/valuation.ts`, unit-tested with `node:test`
via `tsx` (no new test framework). The tests assert the handbook worked
examples exactly:

| Quantity | Formula | Must equal |
|---|---|---|
| Contained tin | weight × grade | 25 × 78% = 19.500 MT |
| Concentrate reference value | weight × grade × LME × FX | ₦1,423,645,275.00 |
| Refined reference value | weight × purity × LME × FX | ₦1,824,273,656.88 |
| Domestic purchase value | reference × procurement coefficient (72.5%) | ₦1,032,142,824.38 |
| VAT on domestic purchase | purchase × 7.5% | ₦77,410,711.83 |
| Export royalty, concentrate | reference × 7.5% | ₦106,773,395.63 |
| Export royalty, refined | reference × 7.5% | ₦136,820,524.27 |
| Royalty at concentrate transfer (DMO-A) | — | ₦0.00, liability → smelter |
| Recovered tin (illustrative) | contained × recovery | 19.500 × 95% = 18.525 MT |

Rules the engine encodes:

- The procurement coefficient is never applied to the government reference
  value or to export royalty (handbook §8).
- Acceptance transfers royalty liability immediately, per child lot, before
  any aggregation (supplement §5).
- Aggregation carries a consolidated ledger of already-transferred
  liabilities; it never creates or delays a transfer.
- Certificates freeze LME, FX, coefficient, royalty rate and computed values
  at issue time. Later policy changes do not alter issued certificates.

Reference price mode (policy): `fixed` uses LME US$55,225/MT and FX
₦1,322/US$ so the on-screen numbers match the printed handouts; `live`
reads the spot board. Default for the demo is `fixed`.

## 8. Policy (admin-editable, not hard-coded)

Brief §19 and the OMP note require these to be configurable:

- Procurement coefficients: miner → aggregator 0.70; aggregator or direct
  producer → smelter 0.725.
- Official Market Price (OMP) coefficient: shown as "not yet prescribed by
  the Ministry"; editable so Kenny can show the distinction from the buying
  coefficient. Not used in any certificate value.
- Royalty rate 7.5%; VAT 7.5%; illustrative recovery 95%.
- MML by grade tier: Tier 1 (> 50% Sn) 1,000 kg; Tier 2 (≤ 50% Sn) 2,000 kg.
- Sample window 48 h; offer period 5 calendar days; payment/collection
  window 5 days.
- Reference price mode `fixed | live`, fixed LME, fixed FX.
- Required registration documents per participant category (list of names).

## 9. Certificates and verification

Classes and titles:

| Class | Title on certificate | Trigger |
|---|---|---|
| DMO-A | Domestic-Offer-First Acceptance Certificate | qualified smelter/buyer accepts |
| DMO-EC | Domestic-Offer-First Export Clearance Certificate (Tin Concentrate) | concentrate offer expires |
| DMO-ER | Domestic-Offer-First Export Clearance Certificate (Refined Tin / Tin Ingot) | refined offer expires |

Certificate numbers: `NMEX-<CLASS>-<COMMODITY>-<YYYY>-<NNNNN>`, e.g.
`NMEX-DMO-EC-TINC-2026-00021`. The seeded scenario issues the three sample
certificates with the same parties, quantities and values as the images.

Layout follows the sample images: header with NM-EX mark, title, status
banner, certificate number, QR, date of issue; four panels (supplier /
smelter, commodity, value summary, liability & payment); important notes;
authorised signature block; "Verify this certificate at" URL. Colours and
type reuse the site's tokens.

The QR encodes `https://www.nm-ex.com/verify/<certNo>`. Generated as SVG
with a small dependency (`qrcode`).

Verification result (public): certificate number, class, status, commodity,
verified quantity, verified grade, Lot / Parent Lot ID, issue date,
utilised yes/no. Signed-in verifiers and officers additionally see parties,
values and the audit trail. Verifier can **Mark utilized** — one-time,
recorded in the audit log.

Cancel / suspend / supersede keep the original visible with its new status
(guidelines §22).

## 10. Seeded scenario

Chosen so every screen has something on it and each storyboard step can be
shown live without waiting days:

1. Wamba Tin Shed — registration submitted, awaiting NM-EX review.
2. Solex ledger — 19 small purchases (20–100 kg) totalling 980 kg Tier 1.
   "Submit lot for inspection" is disabled. Kenny logs one 50 kg purchase
   on screen, the total crosses the 1,000 kg MML and the button activates.
3. Solex lot in inspection — 1,200 kg submitted, sample window running.
4. Solex lot verified and offered — 25.000 MT @ 78% Sn, offer open, in the
   National Pool. This is the lot United Smelters accepts on screen → DMO-A
   matching sample `…-00031`.
5. Solex lot expired — DMO-EC already issued (`…-00021`), status VALID,
   payment pending, cleared for export.
6. Child lots A001/B001/C001 (1 MT @ 72/75/78%) already accepted by United
   Smelters, royalty transferred, ready to aggregate into
   `NMEX-AGG-TIN-2026-0041` (25 MT total with other seeded children).
7. United Smelters refined lot — 25.000 MT @ 99.95%, offer expired →
   DMO-ER issued (`…-00001`).
8. A second refined lot offered to buyers, open, so Lagos Solder Works can
   accept it live (Outcome A, domestic sale).

Demo controls (admin): **Expire this offer now**, **Advance clock** (hours
or days), **Reset scenario**. The clock offset is stored with the scenario
so countdowns and expiries are consistent across roles.

## 11. New landing page (`/exchange`)

Per brief §1: NM-EX as a national metals and minerals exchange, modern,
industrial, institutional. Hero with moving metal imagery (rotating tin,
copper, lead ingots and concentrate — CSS/Framer Motion over rendered
images; no video dependency), prominent **Register** and **Login**, a short
statement of the four functions (compliant supply, domestic processing,
market access, traceability), the DMO flow in one strip, the live spot
strip pulled from the existing board, and a "Verify a certificate" entry.

Built as separate components; nothing in `src/components/hero.tsx` or
`spot-board.tsx` is modified. The site header gains Register / Login links.

## 12. Auth

Signed cookie (`HMAC`, same pattern as `desk-auth.ts`) carrying
`participantId` and `role`. Server actions read the session and check role
before mutating. Middleware redirects `/app/*` to `/login`. No password
reset, no e-mail.

## 13. Out of scope for the demo

Real document upload storage, payments, e-mail/SMS, camera QR scanning
(phones scan the projected QR natively), external APIs (NESS, NXP, CCI,
Customs, CBN, Ministry), multi-tenant admin for adding participant
categories via UI (categories and their document lists are policy data,
editable as JSON in the policy screen), non-tin commodities.

## 14. Deployment

No server changes: the app writes `/var/lib/nm-ex/demo.json` next to
`spot.json`. New env: `DEMO_PASSWORD` (optional), `NM_EX_DEMO_PATH`
(optional). Merge to `main` deploys. Before the call: sign in as admin →
Reset scenario.

## 15. Build order

1. Domain types, valuation engine, tests (numbers match handouts).
2. Demo store, seed scenario, audit log, reset.
3. Auth, login cards, register flow, `/app` layout with role nav.
4. Admin console: registrations, inspections, offers, certificates, policy,
   demo controls.
5. Supplier dashboard: ledger, inventory, MML, inspection, lots.
6. Smelter dashboard: pool, accept, pipeline, parent lot, refined lot.
7. Certificates page + QR + `/verify`.
8. Buyer dashboard (small) and verifier console.
9. `/exchange` landing page; header links.
10. Demo script page (the 15 storyboard steps, each linking to the screen
    where it happens), phone/projector pass, README.

Each step is a separate commit on the feature branch; the branch stays
deployable throughout.

## 16. Decisions taken (change if wrong)

- Certificate titles say **Domestic-Offer-First** (as on the samples);
  class codes are **DMO-A / DMO-EC / DMO-ER** (as in the handbook and
  guidelines). Certificate numbers use the class code.
- Verify URL is `www.nm-ex.com/verify/…`, not `nm-ex.gov.ng` as printed on
  the samples.
- United Smelters is located in **Jos** (per the certificates), not Lagos
  (per the existing desk mock).
- Reference price mode defaults to **fixed** so screen matches paper.
- New landing lives at **`/exchange`**; `/` is untouched.
