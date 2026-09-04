import Link from "next/link";
import { IngotScene } from "@/components/exchange/ingot-scene";
import { LiveClock } from "@/components/live-clock";
import { NigeriaFlag } from "@/components/nigeria-flag";
import { SiteFooter } from "@/components/site-footer";
import { formatFxRate, formatNgn, formatUsd } from "@/lib/format";
import { readState } from "@/lib/dmo/store";
import { readSpotBoard } from "@/lib/store";

export const dynamic = "force-dynamic";

const FLOW = [
  ["Register", "Role-based onboarding with category-specific compliance documents, approved by NM-EX."],
  ["Log purchases", "Tin sheds and aggregators record every parcel — 20 kg or 2 tonnes — in a private ledger."],
  ["Reach the MML", "The minimum marketable lot unlocks Submit for inspection automatically."],
  ["Verify", "48-hour sample window, official assay and weight at an approved warehouse. The assay is locked to the lot."],
  ["National Pool", "Qualified domestic smelters see every verified lot first, priced off the live LME reference."],
  ["Accept or clear", "Acceptance issues a DMO-A. No acceptance in five days issues an export clearance — DMO-EC or DMO-ER."],
  ["Smelt & re-offer", "Refined metal returns to the pool for Nigerian industry before it can leave the country."],
  ["Verify at the border", "NESS and Customs confirm any certificate by QR or number against the live record."],
];

const ROLES = [
  ["Tin sheds & aggregators", "Ledger, MML trigger, inspection, lot tracking, certificates."],
  ["Mining companies", "Sell verified production directly into the National Pool."],
  ["Smelters & processors", "First right of acceptance on every verified lot. Aggregation and refined output."],
  ["Domestic end users", "Buy refined Nigerian tin before it is offered abroad."],
  ["Government & verifiers", "Officer console, policy levers, audit trail, NESS / Customs verification."],
];

export default async function ExchangePage() {
  const [board, state] = await Promise.all([readSpotBoard(), readState()]);
  const tin = board.minerals.find((m) => m.slug === "tin");
  const copper = board.minerals.find((m) => m.slug === "copper");
  const lead = board.minerals.find((m) => m.slug === "lead");
  const openOffers = state.offers.filter((o) => o.status === "open").length;
  const certsIssued = state.certificates.length;
  const approved = state.participants.filter((p) => p.status === "approved" && p.role !== "officer" && p.role !== "verifier").length;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--paper)] text-[var(--ink)]">
      <header className="absolute inset-x-0 top-0 z-20 pt-[env(safe-area-inset-top)] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-10">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl tracking-tight">NM-EX</span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60 sm:inline">Nigerian Metals Exchange</span>
          </div>
          <nav className="flex items-center gap-3 text-sm sm:gap-6">
            <Link href="/" className="hidden text-white/70 hover:text-white sm:inline">Spot board</Link>
            <a href="#how" className="hidden text-white/70 hover:text-white md:inline">How it works</a>
            <a href="/verify" className="hidden text-white/70 hover:text-white sm:inline">Verify</a>
            <a href="/register" className="inline-flex h-10 items-center border border-white/40 px-4 font-semibold text-white hover:border-white hover:bg-white/10">Register</a>
            <a href="/login" className="inline-flex h-10 items-center bg-white px-4 font-semibold text-[var(--ink)] hover:bg-[var(--paper)]">Login</a>
            <NigeriaFlag className="h-4 w-6 shrink-0 shadow-sm" />
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#0f1613] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(31,107,79,0.35),transparent_60%),radial-gradient(ellipse_at_20%_90%,rgba(143,106,69,0.25),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-28 sm:px-10 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-36">
          <div className="flex flex-col justify-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#9fd4bd]">Ministry of Solid Minerals Development · Domestic Market Offer</p>
            <h1 className="font-display mt-4 text-4xl leading-[1.02] tracking-tight sm:text-6xl">
              Nigeria&apos;s metals and minerals exchange.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              The national platform for compliant mineral supply, domestic processing, market access and traceability. Every tonne of
              concentrate in, every tonne of metal out, one auditable record from the tin shed to the port.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/register" className="inline-flex h-12 items-center bg-white px-6 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--paper)]">Register as a participant</a>
              <a href="/login" className="inline-flex h-12 items-center border border-white/40 px-6 text-sm font-semibold text-white hover:border-white hover:bg-white/10">Login to your dashboard</a>
              <a href="/verify" className="inline-flex h-12 items-center px-3 text-sm text-white/70 underline-offset-4 hover:text-white hover:underline">Verify a certificate →</a>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-white/15 pt-6 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.18em] text-white/50">Approved participants</dt>
                <dd className="font-display mt-1 text-2xl tabular-nums">{approved}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.18em] text-white/50">Lots in the National Pool</dt>
                <dd className="font-display mt-1 text-2xl tabular-nums">{openOffers}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.18em] text-white/50">DMO certificates issued</dt>
                <dd className="font-display mt-1 text-2xl tabular-nums">{certsIssued}</dd>
              </div>
            </dl>
          </div>
          <div className="relative min-h-[22rem] lg:min-h-[30rem]">
            <IngotScene />
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-black/30">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 text-xs sm:px-10">
            <span className="flex items-center gap-2 text-white/60">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#9fd4bd]" /> Live reference
            </span>
            {[tin, copper, lead].map((m) =>
              m ? (
                <span key={m.slug} className="tabular-nums">
                  <span className="text-white/60">{m.name}</span> <span className="font-semibold">{formatUsd(m.lastUsd)}</span>
                  <span className="text-white/40">/MT</span>
                </span>
              ) : null,
            )}
            <span className="tabular-nums">
              <span className="text-white/60">USD→NGN</span> <span className="font-semibold">{formatFxRate(board.fx.rate)}</span>
            </span>
            {tin?.lastUsd != null && (
              <span className="tabular-nums">
                <span className="text-white/60">Tin reference</span> <span className="font-semibold">{formatNgn(tin.lastUsd * board.fx.rate)}</span>
                <span className="text-white/40">/MT Sn</span>
              </span>
            )}
            <LiveClock className="ml-auto text-white/70" />
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--forest)]">How the exchange works</p>
        <h2 className="font-display mt-2 max-w-2xl text-3xl tracking-tight sm:text-4xl">Physical mineral flow and digital compliance move together.</h2>
        <ol className="mt-10 grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map(([title, body], i) => (
            <li key={title} className="bg-[var(--paper)] p-5">
              <p className="font-display text-3xl text-[var(--ink)]/20">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-[var(--line)] bg-white/60">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--forest)]">Domestic-offer first</p>
            <h2 className="font-display mt-2 text-3xl tracking-tight">Every lot is offered to Nigerian smelters before it can leave the country.</h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--ink-muted)]">
              A verified lot enters the National Pool for {state.policy.offerPeriodDays} days at the government reference price — LME × CBN rate × contained tin — with the
              domestic purchase at a coefficient of {state.policy.coefToSmelter}. Acceptance issues a DMO-A and transfers the {state.policy.royaltyPct}% royalty liability to the
              smelter. No acceptance issues an export clearance with the royalty assessed on the full reference value.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="/verify" className="inline-flex h-11 items-center bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)] hover:bg-[var(--forest)]">Verify a certificate</a>
              <Link href="/#tin" className="inline-flex h-11 items-center px-3 text-sm text-[var(--ink-muted)] underline-offset-4 hover:underline">See the tin desk</Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["DMO-A", "Acceptance", "Domestic sale recorded. Royalty transferred to the smelter at ₦0."],
              ["DMO-EC", "Export clearance · concentrate", "No smelter accepted. Royalty due on the full reference value before clearance."],
              ["DMO-ER", "Export clearance · refined", "No domestic buyer accepted refined metal. Royalty reconciled at the furnace."],
            ].map(([code, name, body]) => (
              <div key={code} className="border border-[var(--line)] bg-white p-4">
                <p className="font-display text-2xl">{code}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--forest)]">{name}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--forest)]">Who uses NM-EX</p>
        <h2 className="font-display mt-2 text-3xl tracking-tight">One platform, five kinds of participant, permissions enforced at the core.</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ROLES.map(([title, body]) => (
            <a key={title} href="/register" className="border border-[var(--line)] bg-white/70 p-4 transition hover:border-[var(--forest)]">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">{body}</p>
              <p className="mt-3 text-xs font-semibold text-[var(--forest)]">Register →</p>
            </a>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
