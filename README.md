# NM-EX — Nigerian Metals Exchange

Public spot reference board for Nigeria's principal mineral exports, with USD prices converted to naira.

**Stack:** Next.js · TypeScript · Tailwind · Framer Motion

## Features (v1)

- Full-bleed brand hero + live spot board
- Minerals: **Tin** (primary), Copper, Aluminum, Lead, Zinc, Nickel, Gold, Tantalite
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

## Later

- Ministry login + official price overrides
- Refiner / distributor portals for sales & purchases
- Domain forwards → nm-ex.com
