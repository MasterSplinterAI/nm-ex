# NM-EX — Nigerian Metals Exchange

Public spot reference board for Nigeria's principal mineral exports, with USD prices converted to naira.

**Stack:** Next.js · TypeScript · Tailwind · Framer Motion

## Features (v1)

- Full-bleed brand hero + live spot board
- Minerals: **Tin** (99.9% Sn LME + 70% concentrate procurement desk), Copper, Aluminum, Lead, Zinc, Nickel, Gold, Tantalite
- Tin concentrate: **Procurement = LME × NM-EX benchmark % × assay %** (benchmark starts at 70%, visible; assay seller-editable)
- Government royalty shown separately at **7.5%**, with a burdened export cost (price + royalty) on both refined tin and cassiterite
- Open / Last / Close with **NGN on top**, USD underneath
- Scrapers:
  - **metal.com** LME 3M: Tin, Copper, Aluminum, Lead, Zinc, Nickel
  - **SMM tables**: Gold (99.99% USD/oz), Tantalite (30% Ta₂O₅ CIF USD/lb)
  - **xe.com** for USD → NGN

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
- Auto-deploy: push to `main` → GitHub Actions → SSH runs `/opt/deployment/deploy-nm-ex.sh`

Manual deploy on the server:

```bash
FORCE=1 /opt/deployment/deploy-nm-ex.sh
```

Price refresh (cron or manual):

```bash
curl -X POST -H "x-refresh-secret: $REFRESH_SECRET" http://127.0.0.1:3003/api/refresh
```
