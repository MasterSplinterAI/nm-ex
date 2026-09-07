# NM-EX view mapping, price locks and end-to-end provenance

**Goal:** Give every login the pages its own role actually needs, and let an NM-EX
official start at a refined export clearance and walk backwards to the individual
pits the tin came from.

**Architecture:** No new storage engine. Two genuinely new domain concepts
(per-purchase price locks, and a provenance tree), everything else is view work
over records we already hold. Each role gets an information architecture derived
from what that role is accountable for, not a copy of the other roles' menus.

**Status:** Phases 1–3 of the walkthrough already shipped (assay results, listing
detail, National Pool board, entity dossier, lot dossier, purchase ↔ lot links,
the direct mine login). This plan covers what the ministry reference screens
imply on top of that.

---

## 1. What each view is accountable for

The menus differ because the obligations differ. This is the spine of the plan.

| View | Its job | What it must be able to prove |
|---|---|---|
| **Mine** (Ropp Valley) | Raise ore, sell direct | Production per pit; that it got the full coefficient with no shed in between |
| **Tin shed** (Musa & Son) | Buy from small mines, reach MML, sell as one lot | What it paid each miner, at which locked LME; that the consolidated lot is DMO-eligible; its **VAT position**, not its profit |
| **Smelter** (United) | Buy verified lots, smelt, account for royalty | **Royalty transferred onto it** lot by lot, and how much is still outstanding against refined output |
| **Domestic buyer** (Lagos Solder) | Buy refined tin offered at home | That it bought before export was allowed |
| **NM-EX officer** | Run the registry | Any record, from any direction, back to source |
| **Verifier** | Clear at the port | That this certificate number has not been spent |

### The shed's story, in order

Purchases from small mines → minimum marketable lot reached → **DMO eligibility** →
consolidate into a lot → submit to NM-EX → verification → **verified numbers replace
declared numbers** → DMO offer opened to smelters → sale → settlement.

The current sidebar collapses steps 2–4 into one item. The reference screens split
them, and they are separate decisions, so they should be separate pages.

---

## 2. New domain concept: per-purchase price locks

**Why.** Reference screen `Payments & Invoices – Individual Price Locks` shows each
parcel carrying its own `LME Price Lock (USD/t)` and `FX Lock (₦/$)` — row 1 locked
at \$55,225, row 2 at \$53,550, rows 3–7 at \$54,200. The stated rule is:

> Your purchase price locks are preserved through consolidation. NM-EX uses a
> weighted average LME price lock. Only the smelter absorbs market price movements.

This is a real protection for the shed and it is the reason the shed's margin can be
thin (2.22% on the reference screen) without the shed carrying market risk. We do
not model it at all today: `PurchaseEntry` has no `priceRef`.

**Change.**

- `src/lib/dmo/types.ts` — add `priceRef: PriceRef` to `PurchaseEntry`.
- `src/lib/dmo/workflow.ts:206` `addPurchase` — stamp `ctx.priceRef()` on the entry.
- `src/lib/dmo/workflow.ts` `submitForInspection` — compute the lot's
  **weighted-average lock** (weight by parcel kg) and store it on the `Lot` as
  `purchaseLock: PriceRef`.
- `src/lib/dmo/seed.ts` — seeded purchases get varied locks so the demo shows
  movement between parcels, as the reference screen does.
- Migration: `src/lib/dmo/store.ts` `load()` — existing `data/demo.json` has no
  `priceRef` on purchases. Backfill from `lot.assayPriceRef` or the board at read
  time rather than crashing.

**Test:** `src/lib/dmo/workflow.test.ts` — a lot built from parcels locked at
\$54,000 and \$56,000 in equal weight carries a \$55,000 weighted lock.

---

## 3. Payments & Invoices (shed and mine)

**Route:** `/portal/supplier?tab=payments`, new nav item after `lots`.
**File:** create `src/app/portal/supplier/payments.tsx`.

Two reference screens exist for this page; they are the same page at two moments.
Build one page that switches on whether the lot has been verified.

**Before verification — "Indicative until verified":**

- **Purchase records table**, one row per parcel: date, supplier/miner, declared
  weight, declared grade, indicative contained Sn, **LME price lock**, **FX lock**,
  purchase rate ₦/kg, purchase value, input VAT 7.5%, indicative royalty 7.5%,
  price-lock badge, status. Totals row.
- **Purchase summary**: total weight, weighted average grade, total purchase value
  excl. VAT, cumulative input VAT, indicative royalty.
- **VAT position**: cumulative input VAT (from purchases) − output VAT (on sale) =
  **net VAT payable**. Copy: "You are only liable for the net VAT under the NRS
  output − input mechanism."
- **Other lock statuses**: weight, grade, sale price, royalty, VAT — each
  `Pending verification` until the officer locks the assay.
- **Next steps** panel, mirroring the reference screen.

**After verification:** the same table with verified figures replacing declared,
locks flipped to `Locked`, and an **indicative sale value** panel (sale value excl.
VAT, output VAT, invoice total incl. VAT) plus remittance responsibility.

**Deliberately not "profit".** The shed's margin is thin and that is fine — the page
is about price protection and VAT position. Show `Gross margin` and `Margin (%)`
as secondary figures, never as the headline, and never colour a thin margin as a
failure.

**Domain support needed:** `lotFormulas` already gives the sale side. Add
`purchaseEconomics(purchases, policy)` in `src/lib/dmo/lot-view.ts` returning
input VAT, output VAT, net VAT, weighted grade, weighted lock.

---

## 4. Smelter: royalty, organised

The smelter's defining obligation is that **royalty transfers onto it at ₦0 on every
acceptance** and is reconciled later against refined output. Today that lives in a
sidebar list on the certificates tab. It deserves its own page.

**Route:** `/portal/smelter?tab=royalty`.
**File:** create `src/app/portal/smelter/royalty.tsx`.

- **Held total** headline, with the formula spelled out as elsewhere.
- **Per-lot table**: child lot → DMO-A → contained Sn → royalty transferred → date →
  which parent lot it went into → which campaign → which refined lot → whether that
  refined lot has cleared (DMO-ER) or sold domestically. Every id a link.
- **Reconciliation panel**: royalty in (from acceptances) vs royalty discharged
  (on refined output cleared or sold) vs **still outstanding**.
- `src/lib/dmo/queries.ts` — extend `royaltyLedgerFor` to carry the parent lot,
  campaign and refined lot for each row so the table can link forward.

Also fold `Active Bids`, `Purchase History`, `Warehouses` and `Market Data` from the
reference sidebar into pages that already have content behind them:
`Active Bids` = open offers this smelter can act on; `Purchase History` = acceptances,
settled; `Warehouses` = collected inventory grouped by warehouse.

---

## 5. The one that matters: end-to-end provenance rollback

**The ask:** an NM-EX official opens a refined DMO export clearance and walks
backwards — refined lot → parent lot → child lots → each child's DMO-A → the shed or
mine lot → the parcels inside it → the source mines.

Every link already exists in the data:

```
Certificate (DMO-ER)
  └── lotId ─────────────► Lot (refined)
                             └── campaignId ──► Campaign
                                                  └── parentLotIds ──► ParentLot[]
                                                                        └── childLotIds ──► Lot[] (concentrate)
                                                                                             ├── acceptance ──► DMO-A cert
                                                                                             ├── ownerId ─────► shed or mine
                                                                                             └── purchaseIds ─► PurchaseEntry[]
                                                                                                                 └── source ──► pit / cooperative
```

**Build:**

- `src/lib/dmo/provenance.ts` (new) — `provenanceTree(state, certNo | lotId)`
  returning a typed tree: refined lot, campaign with recovery %, parent lots, child
  lots each with their DMO-A, owner, and parcels grouped by source. Include mass
  balance at each hop (contained Sn in vs out) so the officer can see nothing was
  invented between stages.
- `src/lib/dmo/provenance.test.ts` — seed builds a full chain; assert the tree from
  the seeded DMO-ER reaches the exact seeded purchase sources, and that contained
  tin reconciles within the recovery percentage.
- `src/app/portal/admin/tabs/provenance.tsx` (new) — render it as a collapsible
  chain, deepest level being a table of source pits with weights. Each node links to
  the lot dossier or entity dossier already built.
- Reachable from: the DMO-ER on `/certificates/[certNo]`, the certificates tab, the
  lot dossier, and the traceability report.
- Add the reverse entry point too: from a **purchase**, show which refined lot and
  which export clearance it ultimately ended up in.

This is the single most persuasive screen for a ministry audience and it is mostly
a query plus a tree renderer. Do it before any of the cosmetic pages.

---

## 6. Remaining nav items from the reference screens

Only build what has real data behind it. Anything else stays off the menu.

| Reference item | Verdict |
|---|---|
| `DMO Eligibility` | **Build.** Split from lot consolidation: shows MML progress, tier, grade threshold, and the go/no-go. Route `?tab=eligibility`. |
| `Warehouse & Dispatch` | **Build.** Real data: inspection warehouse, sample window, collection status. Route `?tab=warehouse`. |
| `Sales & Transactions` | **Build.** Settled sales with final price, buyer, invoice. Route `?tab=sales`. |
| `Reports` | **Build thin.** Per-participant export of their own ledger and lots. |
| `My Profile` / `Company Profile` | **Build thin.** Registered particulars and documents, read-only, mirroring the officer dossier. |
| `Support` | **Omit.** No data behind it; an empty page is worse than no item. |
| `Market Data` (smelter) | **Build thin.** Reuse the existing spot board component. |
| `Certificates (DMO)` | Already exists. |

---

## 7. Visual polish — the remaining gap

The look is close. What is still off against the references:

1. **Card headers need icons.** Every reference card has a small tinted glyph left of
   its title. We have the header strip but no icon. Extend `.card-head` and pass an
   icon id, reusing `src/components/portal/nav-icons.tsx`.
2. **Coloured note bands.** The references lean on tinted callouts — blue for
   informational, amber for VAT, green for confirmation. Add `.note-info`,
   `.note-warn`, `.note-ok` to `globals.css` and use them instead of ad-hoc classes.
3. **Header price ticker.** The references carry `LME Tin (USD/t)` and `FX (₦/$)`
   with a change indicator in the top bar on every page. Add to
   `src/components/portal/shell.tsx`.
4. **Lock badges.** A padlock glyph plus `Locked` / `Pending verification` pill,
   used across payments and assay screens.
5. **Table density.** References run tighter than ours — reduce row padding to
   `py-2` and set numeric columns to a fixed width so columns align across cards.

---

## Suggested order

1. **Provenance rollback** (§5) — highest value, mostly query work, no schema change.
2. **Price locks** (§2) — schema change; do it before Payments depends on it.
3. **Payments & Invoices** (§3) — the most detailed reference screen.
4. **Smelter royalty** (§4).
5. **Visual polish** (§7) — cheap, do it alongside the above.
6. **Remaining nav** (§6) — last, and only the rows marked Build.

Each numbered section is independently shippable and independently demoable.
