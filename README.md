# NM-EX — Nigerian Metals Exchange

Public spot reference board for Nigeria's principal mineral exports, with USD prices converted to naira.

**Stack:** Next.js · TypeScript · Tailwind · Framer Motion

## Features (v1)

- Full-bleed brand hero + live spot board
- Minerals: **Tin** (99.85% Sn LME + 70% tin concentrate procurement desk), Copper (99.99%), Aluminum (99.70%), Lead (99.97%), Zinc (99.995%), Nickel (99.80%), Gold (99.99%), Tantalite (30% Ta₂O₅)
- Tin concentrate: **Procurement = LME × NM-EX benchmark % × assay %** (benchmark starts at 70%, visible; assay seller-editable)
- Government royalty shown separately at **7.5%** on refined tin and tin concentrate — not added into the LME or procurement price
- Open / Last / Close with **NGN on top**, USD underneath
- Scrapers:
  - **metal.com** LME 3M: Tin, Copper, Aluminum, Lead, Zinc, Nickel
  - **SMM tables**: Gold (99.99% USD/oz), Tantalite (30% Ta₂O₅ CIF USD/lb)
  - **xe.com** for USD → NGN

## DMO demo platform

A scripted, role-based demonstration of the Domestic Market Offer (DMO) operating model: registration → purchase ledger → minimum marketable lot → inspection and assay → National Pool → smelter acceptance (DMO-A) or export clearance (DMO-EC / DMO-ER) → aggregation → refined re-offer → NESS / Customs verification.

- `/exchange` — new landing page (kept separate from `/` so the two can be compared)
- `/register` — role-based onboarding with category-specific document checklists
- `/login` — one-click sign-in to the seeded demo accounts
- `/portal/supplier`, `/portal/smelter`, `/portal/buyer`, `/portal/admin`, `/portal/verify` — dashboards per role
- `/certificates/<no>` — full certificate with QR (parties, officers and verifiers only); `/verify?no=` — public status check

Design: `docs/superpowers/specs/2026-09-04-dmo-demo-platform-design.md`. Plan: `docs/superpowers/plans/2026-09-04-dmo-demo-platform.md`.

Prices are never fixed. Every offer shows indicative values from the live board; each certificate snapshots LME and FX at the moment it is issued.

**Seeded accounts** (all use `DEMO_PASSWORD`, default `nmex-demo`; one-click sign-in unless `DEMO_ONE_CLICK=false`):

| Role | Account | Registration |
| --- | --- | --- |
| Supplier | Solex Tin Ltd | NMEX-SUP-2026-00456 |
| Smelter | United Smelters Ltd | NMEX-SMEL-2026-00015 |
| Domestic buyer | Lagos Solder Works Ltd | NMEX-BUY-2026-00102 |
| NM-EX officer | NM-EX Compliance & Market Operations | — |
| Verifier | Neroli Inspection Services (PIA) | — |
| Pending applicant | Wamba Tin Shed | awaiting review |

**Suggested walkthrough** (≈15 minutes): `/exchange` → `/verify` with `NMEX-DMO-EC-TINC-2026-00021` → register a tin shed → officer approves it → Solex adds a 50 kg purchase, the MML button unlocks, submit → officer marks sample received and enters the assay → United accepts the 25 MT lot in the National Pool (DMO-A issues) → pay, collect, create a parent lot, register refined output → Lagos Solder buys refined tin → verifier marks `…-00021` utilized → officer advances the clock 120 h to expire the open offers → reset.

Demo state lives in `data/demo.json` locally and `/var/lib/nm-ex/demo.json` in production (`NM_EX_DEMO_PATH` overrides). Delete it or use **Demo controls → Reset** to rebuild the seed. Run `npm test` for the valuation, state-machine and seed tests.

## Develop

```bash
npm install
npm run refresh   # scrape + write data/spot.json
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

- `GET /api/spot` — current board JSON
- `POST /api/refresh` — re-scrape (optional `x-refresh-secret` header if `REFRESH_SECRET` is set)

## Deploy (production)

Host: `ubuntu@3.16.210.84` (shared with JarMetals / Cornerstone).

- App: `/var/www/nm-ex` · systemd `nm-ex.service` · port **3003**
- Nginx: `nm-ex.com` / `www.nm-ex.com`
- Persistent prices: `/var/lib/nm-ex/spot.json`
- Tin policy (benchmark / royalty): `/var/lib/nm-ex/policy.json` or env `TIN_BENCHMARK_PCT`, `GOVERNMENT_ROYALTY_PCT`
- DMO demo state: `/var/lib/nm-ex/demo.json`; env `DEMO_PASSWORD`, `DEMO_SESSION_SECRET`, `NM_EX_PUBLIC_URL` (QR base, default `https://www.nm-ex.com`)
- Auto-deploy: push to `main` → GitHub Actions → SSH runs `/opt/deployment/deploy-nm-ex.sh`

Manual deploy on the server:

```bash
FORCE=1 /opt/deployment/deploy-nm-ex.sh
```

Price refresh (cron or manual):

```bash
curl -X POST -H "x-refresh-secret: $REFRESH_SECRET" http://127.0.0.1:3003/api/refresh
```
