import { redirect } from "next/navigation";
import { Empty } from "@/components/portal/empty";
import { Money } from "@/components/portal/money";
import { Panel } from "@/components/portal/panel";
import { PoolCard } from "@/components/portal/pool-card";
import { CertStatusPill } from "@/components/portal/status-pill";
import { Tabs } from "@/components/portal/tabs";
import { formatDateTime, formatKg, formatPct } from "@/lib/format";
import { demoNowIso } from "@/lib/dmo/clock";
import { acceptancesFor, participantById, poolFor } from "@/lib/dmo/queries";
import { getSession } from "@/lib/dmo/session";
import { readState } from "@/lib/dmo/store";
import { readSpotBoard } from "@/lib/store";
import { PageHeader } from "../page-header";
import { acceptOfferAction } from "../smelter/actions";

export const dynamic = "force-dynamic";

export default async function BuyerPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "buyer") redirect("/portal");
  const { tab } = await searchParams;
  const active = tab === "purchases" ? "purchases" : "pool";

  const [state, board] = await Promise.all([readState(), readSpotBoard()]);
  const me = participantById(state, session.participantId)!;
  const nowIso = demoNowIso(state);
  const lme = board.minerals.find((m) => m.slug === "tin")?.lastUsd ?? 0;
  const pool = poolFor(state, "buyers");
  const purchases = acceptancesFor(state, me.id);

  return (
    <>
      <PageHeader
        kicker="Domestic end user"
        title={me.legalName}
        lede={<>Registration {me.regNo}. Refined Nigerian tin is offered to domestic industry for {state.policy.offerPeriodDays} days before any export clearance can issue.</>}
      />
      <Tabs
        base="/portal/buyer"
        active={active}
        tabs={[
          { id: "pool", label: "Refined tin offered", badge: pool.length },
          { id: "purchases", label: "My purchases", badge: purchases.length },
        ]}
      />

      {active === "pool" && (
        <div className="space-y-4">
          {pool.length === 0 ? (
            <Empty>No refined tin is offered right now. Lots appear here when a smelter registers a campaign.</Empty>
          ) : (
            pool.map((entry) => (
              <PoolCard key={entry.offer.id} entry={entry} policy={state.policy} lmeUsd={lme} fxRate={board.fx.rate} nowIso={nowIso} acceptAction={acceptOfferAction} verb="Buy" />
            ))
          )}
        </div>
      )}

      {active === "purchases" && (
        <Panel kicker="Domestic purchases" title="Accepted refined lots">
          {purchases.length === 0 ? (
            <Empty>No purchases yet.</Empty>
          ) : (
            <div className="space-y-3">
              {purchases.map((a) => {
                const lot = state.lots.find((l) => l.id === a.lotId)!;
                const cert = state.certificates.find((c) => c.certNo === a.certNo)!;
                return (
                  <article key={a.id} className="grid gap-3 border border-[var(--line)] bg-white/70 p-4 sm:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <a href={`/certificates/${a.certNo}`} className="font-display text-lg tabular-nums underline-offset-4 hover:underline">{a.certNo}</a>
                        <CertStatusPill status={cert.status} />
                      </div>
                      <p className="mt-1 text-sm text-[var(--ink-muted)]">
                        {lot.id} · {formatKg(lot.verifiedKg)} @ {formatPct(lot.verifiedGradePct!, 2)} Sn · {formatDateTime(a.acceptedAt)}
                      </p>
                    </div>
                    <Money ngn={a.valuation.totalPayableNgn} size="sm" />
                  </article>
                );
              })}
            </div>
          )}
        </Panel>
      )}
    </>
  );
}
