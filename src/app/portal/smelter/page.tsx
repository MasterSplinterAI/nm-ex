import { redirect } from "next/navigation";
import { ActionButton, ActionForm } from "@/components/portal/action-button";
import { inputClass, labelClass } from "@/components/portal/form-styles";
import { Countdown } from "@/components/portal/countdown";
import { Empty } from "@/components/portal/empty";
import { Money } from "@/components/portal/money";
import { Panel } from "@/components/portal/panel";
import { CertStatusPill, LotStatusPill, StatusPill } from "@/components/portal/status-pill";
import { formatDate, formatDateTime, formatKg, formatNgn, formatPct } from "@/lib/format";
import { demoNowIso } from "@/lib/dmo/clock";
import { tabFromSearch } from "@/lib/dmo/nav";
import { acceptancesFor, certificatesFor, lotsFor, offerForLot, participantById, poolFor, royaltyLedgerFor } from "@/lib/dmo/queries";
import { getSession } from "@/lib/dmo/session";
import { readState } from "@/lib/dmo/store";
import { readSpotBoard } from "@/lib/store";
import { PageHeader } from "../page-header";
import { ListingDetail } from "@/components/portal/listing-detail";
import { lotBundle } from "@/lib/dmo/lot-view";
import { acceptOfferAction, collectAction, createParentLotAction, payAction, registerRefinedAction } from "./actions";
import { SmelterHome } from "./home";
import { PoolBoard } from "./pool-board";

export const dynamic = "force-dynamic";

const TABS = ["home", "pool", "acceptances", "inventory", "refined", "certificates"] as const;
type TabId = (typeof TABS)[number];

export default async function SmelterPage({ searchParams }: { searchParams: Promise<{ tab?: string; lot?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "smelter") redirect("/portal");
  const { tab, lot: lotId } = await searchParams;
  const active: TabId = TABS.includes(tabFromSearch(tab) as TabId) ? (tabFromSearch(tab) as TabId) : "home";

  const [state, board] = await Promise.all([readState(), readSpotBoard()]);
  const me = participantById(state, session.participantId)!;
  const nowIso = demoNowIso(state);
  const lme = board.minerals.find((m) => m.slug === "tin")?.lastUsd ?? 0;
  const pool = poolFor(state, "smelters");
  const acceptances = acceptancesFor(state, me.id);
  const collected = state.lots.filter((l) => l.status === "collected" && acceptances.some((a) => a.lotId === l.id));
  const parents = state.parentLots.filter((p) => p.smelterId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unsmelted = parents.filter((p) => !p.campaignId);
  const refined = lotsFor(state, me.id).filter((l) => l.kind === "refined");
  const certs = certificatesFor(state, me.id);
  const royalty = royaltyLedgerFor(state, me.id);

  return (
    <>
      {active === "home" && <SmelterHome state={state} me={me} nowIso={nowIso} />}
      {active !== "home" && active !== "pool" && (
        <PageHeader
          kicker="Qualified domestic smelter"
          title={
            active === "acceptances"
              ? "Acceptances"
              : active === "inventory"
                ? "Inventory & aggregation"
                : active === "refined"
                  ? "Refined output"
                  : "Certificates & royalty"
          }
          lede={me.regNo ?? undefined}
        />
      )}

      {active === "pool" && lotId && (() => {
        const bundle = lotBundle(state, lotId);
        return bundle && bundle.offer ? (
          <ListingDetail
            bundle={bundle}
            policy={state.policy}
            lmeUsd={lme}
            fxRate={board.fx.rate}
            audience="smelter"
            backHref="/portal/smelter?tab=pool"
            acceptAction={acceptOfferAction}
          />
        ) : (
          <p className="text-sm text-[var(--ink-muted)]">That lot is not on the National Pool.</p>
        );
      })()}
      {active === "pool" && !lotId && (
        <PoolBoard pool={pool} policy={state.policy} lmeUsd={lme} fxRate={board.fx.rate} nowIso={nowIso} />
      )}

      {active === "acceptances" && (
        <div className="space-y-4">
          {acceptances.length === 0 ? (
            <Empty>You have not accepted any lots yet.</Empty>
          ) : (
            acceptances.map((a) => {
              const lot = state.lots.find((l) => l.id === a.lotId)!;
              const cert = state.certificates.find((c) => c.certNo === a.certNo)!;
              return (
                <article key={a.id} className="grid gap-4 border border-[var(--line)] bg-white/70 p-5 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <a href={`/certificates/${a.certNo}`} className="font-display text-xl tabular-nums underline-offset-4 hover:underline">{a.certNo}</a>
                      <CertStatusPill status={cert.status} />
                    </div>
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">
                      {lot.id} · {formatKg(lot.verifiedKg)} @ {formatPct(lot.verifiedGradePct!, 2)} Sn · accepted {formatDateTime(a.acceptedAt)} at LME US${a.priceRef.lmeUsd.toLocaleString("en-US")} / ₦{a.priceRef.fxRate.toLocaleString("en-NG")}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Total payable (incl. VAT)</p>
                        <Money ngn={a.valuation.totalPayableNgn} size="sm" />
                      </div>
                      <StatusPill tone={a.paymentStatus === "paid" ? "ok" : "warn"}>{a.paymentStatus === "paid" ? `Paid ${formatDate(a.paidAt!)}` : "Payment pending"}</StatusPill>
                      <StatusPill tone={a.collectionStatus === "collected" ? "ok" : "muted"}>{a.collectionStatus === "collected" ? `Collected ${formatDate(a.collectedAt!)}` : "Collection pending"}</StatusPill>
                      {a.paymentStatus === "pending" && cert.status !== "CANCELLED" && <Countdown untilIso={a.deadlineAt} nowIso={nowIso} label="Pay within" />}
                    </div>
                  </div>
                  {cert.status !== "CANCELLED" && (
                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      {a.paymentStatus === "pending" && (
                        <ActionForm action={payAction} hidden={{ acceptanceId: a.id }}>
                          <ActionButton small pendingText="Confirming…">Confirm payment made</ActionButton>
                        </ActionForm>
                      )}
                      {a.paymentStatus === "paid" && a.collectionStatus === "pending" && (
                        <ActionForm action={collectAction} hidden={{ acceptanceId: a.id }}>
                          <ActionButton small pendingText="Confirming…">Confirm collection from warehouse</ActionButton>
                        </ActionForm>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}

      {active === "inventory" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
          <Panel kicker="Collected child lots" title="Available for aggregation">
            {collected.length === 0 ? (
              <Empty>No collected lots. Accept, pay and collect from the National Pool first.</Empty>
            ) : (
              <ActionForm action={createParentLotAction} inline={false}>
                <table className="w-full text-sm">
                  <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    <tr>
                      <th className="pb-2" />
                      <th className="pb-2 font-semibold">Child lot</th>
                      <th className="pb-2 text-right font-semibold">Weight</th>
                      <th className="pb-2 text-right font-semibold">Grade</th>
                      <th className="pb-2 text-right font-semibold">Contained Sn</th>
                      <th className="pb-2 text-right font-semibold">DMO-A</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {collected.map((l) => {
                      const a = acceptances.find((x) => x.lotId === l.id)!;
                      return (
                        <tr key={l.id}>
                          <td className="py-2"><input type="checkbox" name="childLotIds" value={l.id} defaultChecked className="h-4 w-4 accent-[var(--forest)]" /></td>
                          <td className="py-2 tabular-nums">{l.id}</td>
                          <td className="py-2 text-right tabular-nums">{formatKg(l.verifiedKg)}</td>
                          <td className="py-2 text-right tabular-nums">{formatPct(l.verifiedGradePct!, 2)}</td>
                          <td className="py-2 text-right tabular-nums">{formatKg((l.verifiedKg! * l.verifiedGradePct!) / 100)}</td>
                          <td className="py-2 text-right tabular-nums text-xs"><a href={`/certificates/${a.certNo}`} className="underline-offset-4 hover:underline">{a.certNo}</a></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                  <p className="text-xs text-[var(--ink-muted)]">A parent lot preserves the chain of custody from each child DMO-A through smelting to the refined output.</p>
                  <ActionButton pendingText="Aggregating…">Create parent lot</ActionButton>
                </div>
              </ActionForm>
            )}
          </Panel>

          <Panel kicker="Parent lots" title="Aggregated feed" className="self-start">
            {parents.length === 0 ? (
              <Empty>No parent lots yet.</Empty>
            ) : (
              <ul className="divide-y divide-[var(--line)] text-sm">
                {parents.map((p) => (
                  <li key={p.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold tabular-nums">{p.id}</span>
                      <StatusPill tone={p.campaignId ? "muted" : "ok"}>{p.campaignId ? "Smelted" : "Ready to smelt"}</StatusPill>
                    </div>
                    <p className="mt-1 text-xs text-[var(--ink-muted)]">
                      {p.childLotIds.length} child lot{p.childLotIds.length === 1 ? "" : "s"} · {formatKg(p.totalKg)} · {formatKg(p.containedTinKg)} Sn · {formatPct(p.avgGradePct, 2)} · {formatDate(p.createdAt)}
                    </p>
                    <p className="mt-1 text-xs tabular-nums text-[var(--ink-muted)]">{p.childLotIds.join(", ")}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}

      {active === "refined" && (
        <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
          <Panel kicker="Smelting campaign" title="Register refined output" className="self-start">
            {unsmelted.length === 0 ? (
              <Empty>No parent lots awaiting smelting.</Empty>
            ) : (
              <ActionForm action={registerRefinedAction} inline={false}>
                <div>
                  <span className={labelClass}>Parent lots consumed</span>
                  <ul className="mt-1 space-y-1.5 text-sm">
                    {unsmelted.map((p) => (
                      <li key={p.id} className="flex items-center gap-2">
                        <input type="checkbox" name="parentLotIds" value={p.id} defaultChecked className="h-4 w-4 accent-[var(--forest)]" />
                        <span className="tabular-nums">{p.id}</span>
                        <span className="text-xs text-[var(--ink-muted)]">{formatKg(p.containedTinKg)} Sn</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <label className="block">
                  <span className={labelClass}>Recovered refined tin (kg)</span>
                  <input name="recoveredKg" type="number" step="0.1" className={`${inputClass} mt-1`} defaultValue={Math.round(unsmelted.reduce((a, p) => a + p.containedTinKg, 0) * (state.policy.recoveryPct / 100))} required />
                  <span className="mt-1 block text-xs text-[var(--ink-muted)]">Expected at {state.policy.recoveryPct}% recovery. NM-EX flags recoveries far from the norm.</span>
                </label>
                <label className="block">
                  <span className={labelClass}>Purity (% Sn)</span>
                  <input name="purityPct" type="number" step="0.01" className={`${inputClass} mt-1`} defaultValue={99.95} required />
                </label>
                <ActionButton pendingText="Registering…">Register & offer to domestic buyers</ActionButton>
                <p className="text-xs text-[var(--ink-muted)]">Refined tin must also be offered domestically for {state.policy.offerPeriodDays} days before it can be exported under a DMO-ER.</p>
              </ActionForm>
            )}
          </Panel>

          <Panel kicker="Refined lots" title="Ingot output">
            {refined.length === 0 ? (
              <Empty>No refined lots registered.</Empty>
            ) : (
              <div className="space-y-3">
                {refined.map((l) => {
                  const camp = state.campaigns.find((c) => c.id === l.campaignId);
                  const offer = offerForLot(state, l.id);
                  const lotCerts = state.certificates.filter((c) => c.lotId === l.id);
                  return (
                    <article key={l.id} className="border border-[var(--line)] bg-white/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-display text-lg tabular-nums">{l.id}</h3>
                        <LotStatusPill status={l.status} />
                      </div>
                      <p className="mt-1 text-sm text-[var(--ink-muted)]">
                        {formatKg(l.verifiedKg)} @ {formatPct(l.verifiedGradePct!, 2)} Sn
                        {camp && <> · from {camp.parentLotIds.join(", ")} · {formatKg(camp.inputContainedKg)} Sn in → {formatPct(camp.recoveryPct, 2)} recovery</>}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                        {offer?.status === "open" && <Countdown untilIso={offer.closesAt} nowIso={nowIso} label="Offered to domestic buyers · closes in" />}
                        {lotCerts.map((c) => (
                          <span key={c.certNo} className="inline-flex items-center gap-2">
                            <a href={`/certificates/${c.certNo}`} className="tabular-nums underline-offset-4 hover:underline">{c.certNo}</a>
                            <CertStatusPill status={c.status} />
                          </span>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      )}

      {active === "certificates" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <Panel kicker="Named on" title="DMO certificates">
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                <tr>
                  <th className="pb-2 font-semibold">Certificate</th>
                  <th className="pb-2 font-semibold">Lot</th>
                  <th className="pb-2 font-semibold">Issued</th>
                  <th className="pb-2 text-right font-semibold">Reference</th>
                  <th className="pb-2 text-right font-semibold">Royalty</th>
                  <th className="pb-2 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {certs.map((c) => (
                  <tr key={c.certNo}>
                    <td className="py-2 tabular-nums"><a href={`/certificates/${c.certNo}`} className="underline-offset-4 hover:underline">{c.certNo}</a></td>
                    <td className="py-2 tabular-nums">{c.lotId}</td>
                    <td className="py-2 tabular-nums text-[var(--ink-muted)]">{formatDate(c.issuedAt)}</td>
                    <td className="py-2 text-right tabular-nums">{formatNgn(c.valuation.referenceValueNgn)}</td>
                    <td className="py-2 text-right tabular-nums">{c.cls === "DMO-A" ? <span className="text-[var(--forest)]">{formatNgn(c.valuation.royaltyNgn)} transferred</span> : <span className="text-[#9b2c2c]">{formatNgn(c.valuation.royaltyNgn)} due</span>}</td>
                    <td className="py-2 text-right"><CertStatusPill status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel kicker="Royalty liability held" title="Fiscal position" className="self-start">
            <p className="font-display text-3xl tabular-nums text-[#9b2c2c]">{formatNgn(royalty.total)}</p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              Sum of royalty transferred to you on acceptance across {royalty.rows.length} DMO-A certificate{royalty.rows.length === 1 ? "" : "s"}. Reconciled by NM-EX against your refined
              output at export (DMO-ER) or domestic sale.
            </p>
            <ul className="mt-4 divide-y divide-[var(--line)] text-xs">
              {royalty.rows.map((r) => (
                <li key={r.certNo} className="flex justify-between py-1.5 tabular-nums">
                  <span>{r.certNo}</span>
                  <span>{formatNgn(r.royaltyNgn)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </>
  );
}
