"use client";

import { useMemo, useState } from "react";
import {
  DEMO_LOT_ID,
  DEMO_LOT_T,
  DOMESTIC_USE_DEFAULT_PCT,
  ENTITIES,
  EXPORTS_2023_T_MO,
  EXPORTS_NOW_T_MO,
  EXPORTS_PROJECT_DEFAULT,
  EXPORTS_PROJECT_MAX,
  EXPORTS_PROJECT_MIN,
  SMELT_RECOVERY_PCT,
  VAT_PCT,
  buildMockLots,
  concentrateValueUsd,
  entityTransactions,
  nationalTake,
  refinedTonnes,
  roleLabel,
  royaltyOnRefinedUsd,
  statusLabel,
  vatOnTransferUsd,
  type EntityRole,
  type TraceLot,
  type TracePrices,
} from "@/lib/trace";
import { formatNgn, formatPct, formatUsd, toNgn } from "@/lib/format";

type Props = {
  prices: TracePrices;
};

type Tab = "guide" | "impact" | "registry" | "lots";
type Counterparty = "buyer" | "refiner";
type DemoStep = "shed" | "paid" | "refined";

const timeFmt = new Intl.DateTimeFormat("en-NG", {
  timeZone: "Africa/Lagos",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function TraceDesk({ prices }: Props) {
  const [tab, setTab] = useState<Tab>("guide");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--forest)]">
            NM-EX Trace
          </p>
          <h1 className="mt-1 font-display text-2xl tracking-tight text-[var(--ink)] sm:text-3xl">
            Tin custody &amp; revenue
          </h1>
        </div>
        <nav
          className="flex border border-[var(--line)] bg-white"
          aria-label="Desk sections"
        >
          <TabButton active={tab === "guide"} onClick={() => setTab("guide")}>
            Guide
          </TabButton>
          <TabButton active={tab === "impact"} onClick={() => setTab("impact")}>
            Lost revenue
          </TabButton>
          <TabButton
            active={tab === "registry"}
            onClick={() => setTab("registry")}
          >
            Registry
          </TabButton>
          <TabButton active={tab === "lots"} onClick={() => setTab("lots")}>
            Lots
          </TabButton>
        </nav>
      </div>

      {tab === "guide" && <GuideTab prices={prices} onOpen={setTab} />}
      {tab === "impact" && <ImpactTab prices={prices} />}
      {tab === "registry" && <RegistryTab prices={prices} />}
      {tab === "lots" && <LotsTab prices={prices} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 px-4 text-sm font-medium ${
        active
          ? "bg-[var(--ink)] text-[var(--paper)]"
          : "text-[var(--ink-muted)] hover:bg-[var(--ink)]/[0.04] hover:text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}

function GuideTab({
  prices,
  onOpen,
}: {
  prices: TracePrices;
  onOpen: (tab: Tab) => void;
}) {
  const chain = [
    {
      name: "Mine / concession",
      note: "Licensed concessions can register on the book. Most alluvial diggings hold no licence — untraced until the shed.",
    },
    {
      name: "Tin shed / aggregator",
      note: "Aggregates concession and alluvial production. The book starts here — weighed, assayed, logged.",
    },
    {
      name: "Bulk buyer",
      note: `Optional middle step. Banked payment, invoice + ${formatPct(VAT_PCT, 1)} VAT — or the shed sells straight to the refiner.`,
    },
    {
      name: "Refiner",
      note: `Every lot lands here. Royalty ${formatPct(prices.royaltyPct, 1)} of LME posts on the recovered metal.`,
    },
    {
      name: "Export or domestic use",
      note: "Refined tin only — shipped out or sold in country. Concentrate is not cleared.",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="max-w-3xl space-y-4">
        <p className="text-[var(--ink)]">
          This desk simulates the traceability and revenue-assurance framework
          United Smelters put to the Federal Ministry of Solid Minerals
          Development: register every tin shed, bulk buyer and refiner —
          licensed concessions too; move every lot from the shed onward as a
          banked, invoiced payment; refine in Nigeria so royalty posts on the
          metal.
        </p>
        <p className="text-sm text-[var(--ink-muted)]">
          Today roughly {EXPORTS_NOW_T_MO.toLocaleString()} t of cassiterite
          concentrate leaves for China every month — cash trades, no VAT
          trail, and no royalty, because royalty only arises when metal is
          refined here. Everything below prices off the live NM-EX board (LME{" "}
          {formatUsd(prices.lmeUsd)}/t). Participants and lots are simulated.
        </p>
      </section>

      <section>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          The chain
        </p>
        <ol className="mt-3 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-5">
          {chain.map((step, index) => (
            <li key={step.name} className="bg-white px-4 py-4">
              <p className="text-xs tabular-nums text-[var(--ink-muted)]">
                {index + 1}
              </p>
              <p
                className={`mt-1 font-medium ${
                  index === 0 ? "text-[var(--copper)]" : "text-[var(--ink)]"
                }`}
              >
                {step.name}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                {step.note}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-[var(--ink-muted)]">
          Three rules carry the whole system: the book starts at the registered
          shed · every transfer is a banked payment with VAT invoiced · royalty
          posts only when refined in Nigeria. Exports are zero-rated for VAT,
          so chain VAT is credited back — the invoice trail is the control. Net
          VAT revenue comes from tin sold in country.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <GuideCard
          title="Lost revenue"
          body="What the government is not collecting today — royalty and VAT at current export volumes, with a slider for 2027–28."
          onOpen={() => onOpen("impact")}
        />
        <GuideCard
          title="Registry"
          body="The registered sheds, bulk buyers and refiner. Click one to read its ledger — every lot it touched, VAT remitted, royalty posted."
          onOpen={() => onOpen("registry")}
        />
        <GuideCard
          title="Lots"
          body="Lot passports. Follow a lot event by event from shed intake to refined metal — including one that leaks off-book, and one you can walk yourself."
          onOpen={() => onOpen("lots")}
        />
      </section>
    </div>
  );
}

function GuideCard({
  title,
  body,
  onOpen,
}: {
  title: string;
  body: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="border border-[var(--line)] bg-white px-4 py-4 text-left hover:border-[var(--ink)]/40"
    >
      <p className="font-medium text-[var(--ink)]">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
        {body}
      </p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--forest)]">
        Open →
      </p>
    </button>
  );
}

function ImpactTab({ prices }: { prices: TracePrices }) {
  const [projectedT, setProjectedT] = useState(EXPORTS_PROJECT_DEFAULT);
  const [domesticPct, setDomesticPct] = useState(DOMESTIC_USE_DEFAULT_PCT);
  const now = useMemo(
    () => nationalTake(prices, EXPORTS_NOW_T_MO, domesticPct),
    [prices, domesticPct],
  );
  const then = useMemo(
    () => nationalTake(prices, EXPORTS_2023_T_MO, domesticPct),
    [prices, domesticPct],
  );
  const projected = useMemo(
    () => nationalTake(prices, projectedT, domesticPct),
    [prices, projectedT, domesticPct],
  );

  return (
    <div className="space-y-10">
      <p className="max-w-3xl text-[var(--ink-muted)]">
        Roughly {EXPORTS_NOW_T_MO.toLocaleString()} t of cassiterite
        concentrate leaves for China every month — unrefined, paid in cash.
        The royalty is the big loss. Exports are zero-rated for VAT, so net
        VAT revenue comes only from refined tin sold in country. Priced off
        the live board, LME {formatUsd(prices.lmeUsd)}/t.
      </p>

      <div className="grid gap-3 lg:grid-cols-3">
        <LossCard
          label="Royalty not collected"
          annualUsd={now.annualRoyalty}
          monthlyUsd={now.monthlyRoyalty}
          fxRate={prices.fxRate}
          detail={`${formatPct(prices.royaltyPct, 1)} of LME on recovered metal, export or domestic. Royalty only arises when tin is refined in Nigeria — nothing is refined, so nothing posts.`}
        />
        <LossCard
          label="VAT not collected · in-country sales"
          annualUsd={now.annualVat}
          monthlyUsd={now.monthlyVat}
          fxRate={prices.fxRate}
          detail={`${formatPct(VAT_PCT, 1)} output VAT on refined tin sold to Nigerian end users, assuming ${domesticPct}% stays in country. Exported tin is zero-rated, so chain VAT is credited back.`}
        />
        <LossCard
          label="Total lost per year"
          annualUsd={now.annualRoyalty + now.annualVat}
          monthlyUsd={now.monthlyRoyalty + now.monthlyVat}
          fxRate={prices.fxRate}
          detail={`At today's reported ${EXPORTS_NOW_T_MO.toLocaleString()} t / month. Unreported tonnes sit on top of this figure.`}
          accent
        />
      </div>

      <div className="max-w-3xl space-y-4">
        <label className="block max-w-xl">
          <span className="text-sm text-[var(--ink)]">
            Refined tin sold in country — {domesticPct}%
          </span>
          <div className="mt-2 flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={domesticPct}
              onChange={(event) =>
                setDomesticPct(Number.parseInt(event.target.value, 10))
              }
              className="h-10 w-full accent-[var(--forest)]"
              aria-label="Share of refined tin sold in country"
            />
            <span className="w-24 shrink-0 text-right tabular-nums text-[var(--ink)]">
              {domesticPct}%
            </span>
          </div>
        </label>
        <p className="text-sm text-[var(--ink-muted)]">
          The {formatNgn(toNgn(now.annualChainVat, prices.fxRate))} of VAT
          invoiced along the chain each year is not counted here — it comes
          back to the exporter as input credit under zero-rating. Its value to
          government is the invoice trail, not the cash.
        </p>
      </div>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          If volumes keep growing
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[var(--ink-muted)]">
          Reported exports rose from {EXPORTS_2023_T_MO} t / month in 2023 to{" "}
          {EXPORTS_NOW_T_MO.toLocaleString()} t / month today. Slide to set a
          2027–28 volume and see what stays uncollected if it still leaves
          unrefined.
        </p>

        <label className="mt-5 block max-w-xl">
          <span className="text-sm text-[var(--ink)]">
            Projected exports, 2027–28
          </span>
          <div className="mt-2 flex items-center gap-4">
            <input
              type="range"
              min={EXPORTS_PROJECT_MIN}
              max={EXPORTS_PROJECT_MAX}
              step={50}
              value={projectedT}
              onChange={(event) =>
                setProjectedT(Number.parseInt(event.target.value, 10))
              }
              className="h-10 w-full accent-[var(--forest)]"
              aria-label="Projected monthly concentrate exports"
            />
            <span className="w-24 shrink-0 text-right tabular-nums text-[var(--ink)]">
              {projectedT.toLocaleString()} t/mo
            </span>
          </div>
        </label>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <ScenarioCard
            label="2023"
            volume={`${EXPORTS_2023_T_MO} t / month`}
            take={then}
            fxRate={prices.fxRate}
          />
          <ScenarioCard
            label="Today"
            volume={`${EXPORTS_NOW_T_MO.toLocaleString()} t / month`}
            take={now}
            fxRate={prices.fxRate}
            accent
          />
          <ScenarioCard
            label="Projected 2027–28"
            volume={`${projectedT.toLocaleString()} t / month`}
            take={projected}
            fxRate={prices.fxRate}
          />
        </div>

        <VolumeBars projected={projectedT} />

        <p className="mt-4 text-xs text-[var(--ink-muted)]">
          Assumed {formatPct(prices.assayPct, 1)} Sn ×{" "}
          {formatPct(SMELT_RECOVERY_PCT, 0)} recovery · LME{" "}
          {formatUsd(prices.lmeUsd)}/t. Royalty and VAT are separate lines.
        </p>
      </section>
    </div>
  );
}

function LossCard({
  label,
  annualUsd,
  monthlyUsd,
  fxRate,
  detail,
  accent = false,
}: {
  label: string;
  annualUsd: number;
  monthlyUsd: number;
  fxRate: number;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`border px-5 py-5 ${
        accent
          ? "border-[var(--copper)]/40 bg-[rgb(143_106_69/0.07)]"
          : "border-[var(--line)] bg-white"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-[0.16em] ${
          accent ? "text-[var(--copper)]" : "text-[var(--ink-muted)]"
        }`}
      >
        {label}
      </p>
      <p className="mt-3 font-display text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
        {formatNgn(toNgn(annualUsd, fxRate))}
      </p>
      <p className="mt-1 text-[var(--ink-muted)]">
        {formatUsd(annualUsd)} a year ·{" "}
        {formatNgn(toNgn(monthlyUsd, fxRate))} a month
      </p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
        {detail}
      </p>
    </div>
  );
}

function ScenarioCard({
  label,
  volume,
  take,
  fxRate,
  accent = false,
}: {
  label: string;
  volume: string;
  take: ReturnType<typeof nationalTake>;
  fxRate: number;
  accent?: boolean;
}) {
  const totalUsd = take.annualRoyalty + take.annualVat;
  return (
    <div
      className={`border px-5 py-5 ${
        accent
          ? "border-[var(--copper)]/40 bg-[rgb(143_106_69/0.07)]"
          : "border-[var(--line)] bg-white"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">{volume}</p>
      <p className="mt-3 font-display text-2xl tracking-tight text-[var(--ink)]">
        {formatNgn(toNgn(totalUsd, fxRate))}
      </p>
      <p className="text-sm text-[var(--ink-muted)]">
        {formatUsd(totalUsd)} lost a year
      </p>
      <dl className="mt-4 space-y-1.5 border-t border-[var(--line)] pt-3 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-[var(--ink-muted)]">Royalty</dt>
          <dd className="tabular-nums text-[var(--ink)]">
            {formatNgn(toNgn(take.annualRoyalty, fxRate))}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-[var(--ink-muted)]">VAT · in-country</dt>
          <dd className="tabular-nums text-[var(--ink)]">
            {formatNgn(toNgn(take.annualVat, fxRate))}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function VolumeBars({ projected }: { projected: number }) {
  const max = EXPORTS_PROJECT_MAX;
  const rows = [
    { label: "2023", t: EXPORTS_2023_T_MO },
    { label: "Now", t: EXPORTS_NOW_T_MO },
    { label: "27–28", t: projected },
  ];
  return (
    <div className="mt-6 space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3 text-xs">
          <span className="w-12 shrink-0 text-[var(--ink-muted)]">{row.label}</span>
          <div className="h-2 flex-1 bg-[var(--line)]">
            <div
              className="h-2 bg-[var(--forest)]"
              style={{ width: `${(row.t / max) * 100}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right tabular-nums text-[var(--ink)]">
            {row.t.toLocaleString()} t
          </span>
        </div>
      ))}
    </div>
  );
}

const dateFmt = new Intl.DateTimeFormat("en-NG", {
  timeZone: "Africa/Lagos",
  day: "2-digit",
  month: "short",
});

const ROLE_ORDER: EntityRole[] = ["shed", "buyer", "refiner"];

function RegistryTab({ prices }: { prices: TracePrices }) {
  const lots = useMemo(() => buildMockLots(prices), [prices]);
  const [selectedId, setSelectedId] = useState(ENTITIES[0].id);
  const entity =
    ENTITIES.find((item) => item.id === selectedId) ?? ENTITIES[0];
  const rows = useMemo(
    () => entityTransactions(lots, entity.name),
    [lots, entity.name],
  );

  const lotCount = new Set(rows.map((row) => row.lotId)).size;
  const tonnesIn = rows
    .filter((row) => row.direction === "in" && row.action !== "Refined")
    .reduce((sum, row) => sum + row.tonnes, 0);
  const vatTotal = rows.reduce((sum, row) => sum + row.vatUsd, 0);
  const royaltyTotal = rows.reduce((sum, row) => sum + row.royaltyUsd, 0);

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--ink-muted)]">
        Registered participants under the framework. Select one to read its
        ledger — every lot it touched, VAT on its banked transfers, royalty
        posted at the furnace.
      </p>

      <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="space-y-5">
          {ROLE_ORDER.map((role) => (
            <div key={role}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                {roleLabel(role)}s
              </p>
              <ul className="mt-2 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                {ENTITIES.filter((item) => item.role === role).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`flex w-full flex-col gap-0.5 py-2.5 text-left ${
                        item.id === entity.id
                          ? "text-[var(--ink)]"
                          : "text-[var(--ink-muted)]"
                      }`}
                    >
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="font-mono text-xs">
                        {item.id} · {item.location}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        <article className="border border-[var(--line)] bg-white px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="font-mono text-sm text-[var(--ink-muted)]">
                {entity.id}
              </p>
              <h2 className="mt-1 font-display text-2xl tracking-tight text-[var(--ink)]">
                {entity.name}
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                {roleLabel(entity.role)} · {entity.location} · registered{" "}
                {dateFmt.format(new Date(`${entity.registeredSince}T12:00:00+01:00`))}
              </p>
            </div>
            <span className="text-sm text-[var(--forest)]">Registered</span>
          </div>

          <div className="mt-6 grid gap-4 border-y border-[var(--line)] py-4 sm:grid-cols-4">
            <Fact
              label="Lots touched"
              value={String(lotCount)}
              hint="this month"
            />
            <Fact
              label="Tonnes handled"
              value={`${tonnesIn.toFixed(1)} t`}
              hint="concentrate in"
            />
            <Fact
              label={`VAT invoiced · ${formatPct(VAT_PCT, 1)}`}
              value={formatNgn(toNgn(vatTotal, prices.fxRate))}
              hint={
                vatTotal > 0
                  ? `${formatUsd(vatTotal)} · credited on export`
                  : "none booked"
              }
            />
            <Fact
              label="Royalty posted"
              value={formatNgn(toNgn(royaltyTotal, prices.fxRate))}
              hint={
                entity.role === "refiner"
                  ? formatUsd(royaltyTotal)
                  : "posts at the furnace"
              }
            />
          </div>

          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Transactions
          </p>
          {rows.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">
              No lots on the book yet.
            </p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] text-left text-xs text-[var(--ink-muted)]">
                    <th className="py-2 pr-3 font-normal">Date</th>
                    <th className="py-2 pr-3 font-normal">Lot</th>
                    <th className="py-2 pr-3 font-normal">Event</th>
                    <th className="py-2 pr-3 text-right font-normal">Tonnes</th>
                    <th className="py-2 pr-3 text-right font-normal">VAT</th>
                    <th className="py-2 pr-3 text-right font-normal">Royalty</th>
                    <th className="py-2 font-normal">Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {rows.map((row) => {
                    const offBook = row.doc == null;
                    return (
                      <tr
                        key={`${row.lotId}-${row.at}-${row.direction}`}
                        className={offBook ? "text-[var(--copper)]" : ""}
                      >
                        <td className="py-2.5 pr-3 whitespace-nowrap text-xs text-[var(--ink-muted)]">
                          {timeFmt.format(new Date(row.at))}
                        </td>
                        <td className="py-2.5 pr-3 font-mono text-xs">
                          {row.lotId}
                        </td>
                        <td className="py-2.5 pr-3">
                          {row.action}
                          {row.direction === "in" && row.counterparty
                            ? ` · from ${row.counterparty}`
                            : ""}
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">
                          {row.tonnes.toFixed(row.action === "Refined" ? 2 : 1)}
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">
                          {row.vatUsd > 0
                            ? formatNgn(toNgn(row.vatUsd, prices.fxRate))
                            : "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">
                          {row.royaltyUsd > 0
                            ? formatNgn(toNgn(row.royaltyUsd, prices.fxRate))
                            : "—"}
                        </td>
                        <td className="py-2.5 font-mono text-xs">
                          {row.doc ?? "no invoice"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {entity.role === "shed" && (
            <p className="mt-4 text-xs text-[var(--ink-muted)]">
              Intake from miners is untraced today — the book starts at this
              shed. Rows in copper left the book as cash.
            </p>
          )}
        </article>
      </div>
    </div>
  );
}

function LotsTab({ prices }: { prices: TracePrices }) {
  const seed = useMemo(() => buildMockLots(prices), [prices]);
  const [selectedId, setSelectedId] = useState(DEMO_LOT_ID);
  const [demoStep, setDemoStep] = useState<DemoStep>("shed");
  const [demoTo, setDemoTo] = useState<Counterparty>("refiner");
  const [demoRef, setDemoRef] = useState("NX-PAY-0000");

  const lot =
    seed.find((item) => item.id === selectedId) ?? seed[0] ?? null;
  if (!lot) return null;

  const showingDemo =
    lot.interactive && lot.id === DEMO_LOT_ID ? demoStep : null;

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--ink-muted)]">
        Simulated custody book. Mine → shed is untraced. From the shed, lots
        move as banked payments with VAT invoiced — the audit trail (credited
        back if the tin is exported). Royalty posts only when refined.
        Concentrate cannot be exported on this book.
      </p>

      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Lots
          </p>
          <ul className="mt-2 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {seed.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`flex w-full flex-col gap-0.5 py-3 text-left ${
                    item.id === lot.id
                      ? "text-[var(--ink)]"
                      : "text-[var(--ink-muted)]"
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-sm">{item.id}</span>
                    <span
                      className={`text-xs ${
                        item.status === "diverted"
                          ? "text-[var(--copper)]"
                          : item.status === "refined"
                            ? "text-[var(--forest)]"
                            : ""
                      }`}
                    >
                      {statusLabel(item.status)}
                    </span>
                  </span>
                  <span className="text-xs">
                    {item.concentrateTonnes} t · {item.shed}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <LotPassport
          lot={lot}
          prices={prices}
          demoStep={showingDemo}
          demoTo={demoTo}
          demoRef={demoRef}
          onDemoTo={setDemoTo}
          onSend={() => {
            setDemoRef(`NX-PAY-${String(Math.floor(1000 + Math.random() * 9000))}`);
            setDemoStep("paid");
          }}
          onRefine={() => setDemoStep("refined")}
          onReset={() => setDemoStep("shed")}
        />
      </div>
    </div>
  );
}

function LotPassport({
  lot,
  prices,
  demoStep,
  demoTo,
  demoRef,
  onDemoTo,
  onSend,
  onRefine,
  onReset,
}: {
  lot: TraceLot;
  prices: TracePrices;
  demoStep: DemoStep | null;
  demoTo: Counterparty;
  demoRef: string;
  onDemoTo: (to: Counterparty) => void;
  onSend: () => void;
  onRefine: () => void;
  onReset: () => void;
}) {
  const pendingRoyalty = royaltyOnRefinedUsd(
    lot.concentrateTonnes,
    lot.assayPct,
    prices.lmeUsd,
    prices.royaltyPct,
  );
  const interactive = demoStep != null;

  return (
    <article className="border border-[var(--line)] bg-white px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-[var(--ink-muted)]">{lot.id}</p>
          <h2 className="mt-1 font-display text-2xl tracking-tight text-[var(--ink)]">
            {lot.concentrateTonnes} t · {formatPct(lot.assayPct, 1)} Sn
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {lot.origin} · {lot.shed}
          </p>
        </div>
        <span
          className={`text-sm ${
            lot.status === "diverted"
              ? "text-[var(--copper)]"
              : "text-[var(--forest)]"
          }`}
        >
          {statusLabel(lot.status)}
        </span>
      </div>

      {interactive ? (
        <InteractiveLot
          prices={prices}
          step={demoStep}
          to={demoTo}
          paymentRef={demoRef}
          onTo={onDemoTo}
          onSend={onSend}
          onRefine={onRefine}
          onReset={onReset}
        />
      ) : (
        <>
          <ol className="mt-8">
            {lot.events.map((event, index) => (
              <li
                key={event.id}
                className="grid grid-cols-[1rem_minmax(0,1fr)] gap-3"
              >
                <div className="flex flex-col items-center">
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                      lot.status === "diverted" &&
                      index === lot.events.length - 1
                        ? "bg-[var(--copper)]"
                        : "bg-[var(--forest)]"
                    }`}
                  />
                  {index < lot.events.length - 1 && (
                    <span className="w-px flex-1 bg-[var(--line)]" />
                  )}
                </div>
                <div className={index < lot.events.length - 1 ? "pb-6" : ""}>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {timeFmt.format(new Date(event.at))}
                    {event.doc ? ` · ${event.doc}` : ""}
                  </p>
                  <p className="mt-0.5 text-[var(--ink)]">
                    <span className="font-medium">{event.action}</span>
                    <span className="text-[var(--ink-muted)]">
                      {" "}
                      · {event.place}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
                    {event.actor}
                    <span className="mx-1.5 text-[var(--line)]">·</span>
                    {event.tonnes.toFixed(event.action === "Refined" ? 2 : 1)} t
                    {event.assayPct != null
                      ? ` · ${formatPct(event.assayPct, 1)}`
                      : ""}
                    {event.vatUsd > 0
                      ? ` · VAT ${formatNgn(toNgn(event.vatUsd, prices.fxRate))}`
                      : ""}
                    {event.royaltyUsd > 0
                      ? ` · Royalty ${formatNgn(toNgn(event.royaltyUsd, prices.fxRate))}`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 border-t border-[var(--line)] pt-5">
            {lot.status === "refined" && lot.refinedTonnes != null ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <Fact
                  label={`Refined · ${formatPct(SMELT_RECOVERY_PCT, 0)} recovery`}
                  value={`${lot.refinedTonnes.toFixed(2)} t`}
                  hint={`${lot.containedTonnes.toFixed(1)} t contained Sn`}
                />
                <Fact
                  label={`Royalty · ${formatPct(prices.royaltyPct, 1)} of LME`}
                  value={formatNgn(toNgn(lot.royaltyUsd, prices.fxRate))}
                  hint={formatUsd(lot.royaltyUsd)}
                />
                <Fact label="Export" value="Cleared" hint="Refined metal only" />
              </div>
            ) : lot.status === "diverted" ? (
              <div>
                <p className="text-[var(--ink)]">
                  Cash after the shed. No VAT. No royalty. Not on this book for
                  export.
                </p>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  {lot.containedTonnes.toFixed(1)} t contained Sn. Royalty if
                  refined: {formatNgn(toNgn(pendingRoyalty, prices.fxRate))} (
                  {formatUsd(pendingRoyalty)}).
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--ink-muted)]">
                In custody. Royalty is not due until refined. Concentrate export
                is not cleared.
                {lot.vatUsd > 0
                  ? ` VAT booked so far: ${formatNgn(toNgn(lot.vatUsd, prices.fxRate))}.`
                  : ""}
              </p>
            )}
          </div>
        </>
      )}
    </article>
  );
}

function InteractiveLot({
  prices,
  step,
  to,
  paymentRef,
  onTo,
  onSend,
  onRefine,
  onReset,
}: {
  prices: TracePrices;
  step: DemoStep;
  to: Counterparty;
  paymentRef: string;
  onTo: (to: Counterparty) => void;
  onSend: () => void;
  onRefine: () => void;
  onReset: () => void;
}) {
  const value = concentrateValueUsd(
    DEMO_LOT_T,
    prices.lmeUsd,
    prices.benchmarkPct,
    prices.assayPct,
  );
  const vat = vatOnTransferUsd(value);
  const royalty = royaltyOnRefinedUsd(
    DEMO_LOT_T,
    prices.assayPct,
    prices.lmeUsd,
    prices.royaltyPct,
  );
  const metal = refinedTonnes(DEMO_LOT_T, prices.assayPct);
  const counterparty =
    to === "refiner" ? "United Smelters, Lagos" : "Jos Buying Centre";

  return (
    <div className="mt-6 space-y-5">
      <p className="text-sm text-[var(--ink-muted)]">
        Walk this lot. Intake has no mine trail. Payment creates the first
        banked record.
      </p>

      <ol className="flex flex-wrap gap-2 text-xs text-[var(--ink-muted)]">
        <li>Untraced intake</li>
        <li aria-hidden>→</li>
        <li className={step !== "shed" ? "text-[var(--forest)]" : "text-[var(--ink)]"}>
          Shed
        </li>
        <li aria-hidden>→</li>
        <li className={step !== "shed" ? "text-[var(--ink)]" : undefined}>
          {to === "refiner" ? "Refiner" : "Buyer"}
        </li>
        <li aria-hidden>→</li>
        <li className={step === "refined" ? "text-[var(--forest)]" : undefined}>
          Refined · royalty
        </li>
      </ol>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm text-[var(--ink)]">
            From <span className="font-medium">Wamba Tin Shed</span>
          </p>
          <fieldset className="space-y-2 text-sm">
            <legend className="text-xs text-[var(--ink-muted)]">To</legend>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="to"
                checked={to === "refiner"}
                disabled={step !== "shed"}
                onChange={() => onTo("refiner")}
              />
              United Smelters, Lagos
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="to"
                checked={to === "buyer"}
                disabled={step !== "shed"}
                onChange={() => onTo("buyer")}
              />
              Jos Buying Centre
            </label>
          </fieldset>

          <dl className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-xs text-[var(--ink-muted)]">Value</dt>
              <dd className="mt-1 tabular-nums text-[var(--ink)]">
                {formatNgn(toNgn(value, prices.fxRate))}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--ink-muted)]">
                VAT {formatPct(VAT_PCT, 1)}
              </dt>
              <dd className="mt-1 tabular-nums text-[var(--ink)]">
                {formatNgn(toNgn(vat, prices.fxRate))}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--ink-muted)]">Debit</dt>
              <dd className="mt-1 tabular-nums text-[var(--ink)]">
                {formatNgn(toNgn(value + vat, prices.fxRate))}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-3">
            {step === "shed" && (
              <button
                type="button"
                onClick={onSend}
                className="h-11 bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)]"
              >
                Send payment
              </button>
            )}
            {step === "paid" && to === "refiner" && (
              <button
                type="button"
                onClick={onRefine}
                className="h-11 bg-[var(--forest)] px-5 text-sm font-semibold text-white"
              >
                Refine lot
              </button>
            )}
            {step !== "shed" && (
              <button
                type="button"
                onClick={onReset}
                className="text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="border border-[var(--line)] bg-[var(--paper)] px-4 py-4 text-sm">
          {step === "shed" && (
            <p className="text-[var(--ink-muted)]">
              Lot is at the shed. No mine trail. Payment creates the first
              record — invoice + VAT, like a bank transfer.
            </p>
          )}
          {step !== "shed" && (
            <div className="space-y-3 text-[var(--ink)]">
              <p className="font-mono text-xs text-[var(--forest)]">{paymentRef}</p>
              <p>
                Paid {formatNgn(toNgn(value + vat, prices.fxRate))} to{" "}
                {counterparty}
              </p>
              <p className="text-[var(--ink-muted)]">
                VAT remitted {formatNgn(toNgn(vat, prices.fxRate))}
              </p>
              {step === "paid" && to === "buyer" && (
                <p className="text-[var(--ink-muted)]">
                  At the buying centre. No royalty yet. Concentrate export is
                  not on this book.
                </p>
              )}
              {step === "paid" && to === "refiner" && (
                <p className="text-[var(--ink-muted)]">
                  At the furnace. Refine to post royalty on the metal.
                </p>
              )}
              {step === "refined" && (
                <div className="space-y-1">
                  <p>
                    Refined {metal.toFixed(2)} t ·{" "}
                    {formatPct(SMELT_RECOVERY_PCT, 0)} recovery
                  </p>
                  <p>
                    Royalty {formatNgn(toNgn(royalty, prices.fxRate))}
                    <span className="ml-2 text-[var(--ink-muted)]">
                      {formatUsd(royalty)}
                    </span>
                  </p>
                  <p className="text-[var(--forest)]">
                    Export cleared — refined metal only
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div>
      <p className="text-xs text-[var(--ink-muted)]">{label}</p>
      <p className="mt-1 font-display text-xl tracking-tight text-[var(--ink)]">
        {value}
      </p>
      <p className="mt-0.5 text-sm text-[var(--ink-muted)]">{hint}</p>
    </div>
  );
}
