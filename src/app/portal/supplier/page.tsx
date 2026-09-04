import { redirect } from "next/navigation";
import { ActionButton, ActionForm, inputClass, labelClass } from "@/components/portal/action-button";
import { Countdown } from "@/components/portal/countdown";
import { Empty } from "@/components/portal/empty";
import { Money } from "@/components/portal/money";
import { Panel } from "@/components/portal/panel";
import { CertStatusPill, LotStatusPill } from "@/components/portal/status-pill";
import { Tabs } from "@/components/portal/tabs";
import { formatDate, formatDateTime, formatKg, formatNgn, formatPct } from "@/lib/format";
import { demoNowIso } from "@/lib/dmo/clock";
import { CERT_CLASS_LABEL } from "@/lib/dmo/labels";
import { mmlKgForTier } from "@/lib/dmo/policy";
import { certificatesFor, inspectionForLot, inventoryFor, lotsFor, offerForLot, participantById } from "@/lib/dmo/queries";
import { getSession } from "@/lib/dmo/session";
import { readState } from "@/lib/dmo/store";
import { referenceValueNgn } from "@/lib/dmo/valuation";
import { readSpotBoard } from "@/lib/store";
import { PageHeader } from "../page-header";
import { addPurchaseAction, submitLotAction } from "./actions";

export const dynamic = "force-dynamic";

type TabId = "ledger" | "lots" | "certificates";

export default async function SupplierPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "supplier") redirect("/portal");
  const { tab } = await searchParams;
  const active: TabId = tab === "lots" || tab === "certificates" ? tab : "ledger";

  const [state, board] = await Promise.all([readState(), readSpotBoard()]);
  const me = participantById(state, session.participantId)!;
  const nowIso = demoNowIso(state);
  const inv = inventoryFor(state, me.id);
  const lots = lotsFor(state, me.id);
  const certs = certificatesFor(state, me.id);
  const lme = board.minerals.find((m) => m.slug === "tin")?.lastUsd ?? 0;
  const mml1 = mmlKgForTier(1, state.policy);
  const mml2 = mmlKgForTier(2, state.policy);
  const activeLots = lots.filter((l) => !["utilized", "sold_domestic", "smelted", "aggregated", "collected"].includes(l.status));

  return (
    <>
      <PageHeader
        kicker="Supplier dashboard"
        title={me.legalName}
        lede={<>Registration {me.regNo}. Log every purchase; when eligible inventory reaches the minimum marketable lot, submit it for NM-EX verification.</>}
      />
      <Tabs
        base="/portal/supplier"
        active={active}
        tabs={[
          { id: "ledger", label: "Purchase ledger", badge: inv.entries.length },
          { id: "lots", label: "My lots", badge: activeLots.length },
          { id: "certificates", label: "Certificates", badge: certs.length },
        ]}
      />

      {active === "ledger" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <Panel kicker="Minimum marketable lot" title="Eligible inventory">
              <div className="grid gap-4 sm:grid-cols-2">
                {([1, 2] as const).map((tier) => {
                  const kg = tier === 1 ? inv.tier1Kg : inv.tier2Kg;
                  const mml = tier === 1 ? mml1 : mml2;
                  const pct = Math.min(100, (kg / mml) * 100);
                  const ready = kg >= mml;
                  return (
                    <div key={tier} className="border border-[var(--line)] bg-white/70 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                        Tier {tier} · {tier === 1 ? `above ${state.policy.tier1MinGradePct}% Sn` : `${state.policy.tier1MinGradePct}% Sn and below`}
                      </p>
                      <p className="font-display mt-1 text-3xl tabular-nums">
                        {formatKg(kg)} <span className="text-base text-[var(--ink-muted)]">/ {formatKg(mml)}</span>
                      </p>
                      <div className="mt-3 h-2 w-full bg-[var(--ink)]/10">
                        <div className={`h-2 ${ready ? "bg-[var(--forest)]" : "bg-[var(--copper)]"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <ActionForm action={submitLotAction} hidden={{ tier: String(tier), kg: String(kg) }} className="mt-4" confirm={ready ? `Submit ${kg} kg for inspection? Purchases are locked to the lot.` : undefined}>
                        <ActionButton disabled={!ready} pendingText="Submitting…" className="w-full">
                          {ready ? `Submit ${formatKg(kg)} for inspection` : `${formatKg(mml - kg)} more to reach MML`}
                        </ActionButton>
                      </ActionForm>
                      {kg > 0 && (
                        <p className="mt-2 text-xs text-[var(--ink-muted)]">
                          Indicative reference at today&apos;s board: {formatNgn(referenceValueNgn(kg / 1000, tier === 1 ? 72 : 45, lme, board.fx.rate))} (assumes {tier === 1 ? 72 : 45}% Sn until assayed)
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel kicker="Unallocated purchases" title="Ledger entries">
              {inv.entries.length === 0 ? (
                <Empty>No unallocated purchases. Every entry has been submitted in a lot.</Empty>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    <tr>
                      <th className="pb-2 font-semibold">Date</th>
                      <th className="pb-2 font-semibold">Source</th>
                      <th className="pb-2 text-right font-semibold">Weight</th>
                      <th className="pb-2 text-right font-semibold">Grade</th>
                      <th className="pb-2 text-right font-semibold">Paid</th>
                      <th className="pb-2 text-right font-semibold">Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {[...inv.entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).map((e) => (
                      <tr key={e.id}>
                        <td className="py-2 tabular-nums">{e.date}</td>
                        <td className="py-2">{e.source}</td>
                        <td className="py-2 text-right tabular-nums">{formatKg(e.kg)}</td>
                        <td className="py-2 text-right tabular-nums">{formatPct(e.gradePct, 2)}</td>
                        <td className="py-2 text-right tabular-nums">{formatNgn(e.valueNgn)}</td>
                        <td className="py-2 text-right tabular-nums text-xs text-[var(--ink-muted)]">{e.reference || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
          </div>

          <Panel kicker="Record a purchase" title="New ledger entry" className="self-start">
            <ActionForm action={addPurchaseAction} inline={false}>
              <label className="block">
                <span className={labelClass}>Date</span>
                <input name="date" type="date" defaultValue={nowIso.slice(0, 10)} className={`${inputClass} mt-1`} required />
              </label>
              <label className="block">
                <span className={labelClass}>Source (miner / cooperative / site)</span>
                <input name="source" className={`${inputClass} mt-1`} placeholder="e.g. Rayfield cooperative" required />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelClass}>Weight (kg)</span>
                  <input name="kg" type="number" step="0.1" min="0.1" className={`${inputClass} mt-1`} defaultValue={50} required />
                </label>
                <label className="block">
                  <span className={labelClass}>Grade (% Sn)</span>
                  <input name="gradePct" type="number" step="0.01" min="0.01" max="100" className={`${inputClass} mt-1`} defaultValue={72} required />
                </label>
              </div>
              <label className="block">
                <span className={labelClass}>Amount paid (₦)</span>
                <input name="valueNgn" type="number" step="1" min="0" className={`${inputClass} mt-1`} defaultValue={2_175_000} />
              </label>
              <label className="block">
                <span className={labelClass}>Receipt reference</span>
                <input name="reference" className={`${inputClass} mt-1`} placeholder="RCPT-…" />
              </label>
              <ActionButton pendingText="Recording…">Add to ledger</ActionButton>
              <p className="text-xs text-[var(--ink-muted)]">
                Shed price guide today: ~{formatNgn((lme * board.fx.rate * state.policy.coefMinerToAggregator) / 1000)} per kg of contained tin (LME × FX × {state.policy.coefMinerToAggregator}).
              </p>
            </ActionForm>
          </Panel>
        </div>
      )}

      {active === "lots" && (
        <div className="space-y-4">
          {lots.length === 0 ? (
            <Empty>No lots yet. Reach the minimum marketable lot in the ledger and submit for inspection.</Empty>
          ) : (
            lots.map((lot) => {
              const insp = inspectionForLot(state, lot.id);
              const offer = offerForLot(state, lot.id);
              const lotCerts = certs.filter((c) => c.lotId === lot.id);
              const ref = lot.verifiedKg != null ? referenceValueNgn(lot.verifiedKg / 1000, lot.verifiedGradePct!, lme, board.fx.rate) : null;
              return (
                <article key={lot.id} className="border border-[var(--line)] bg-white/70 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl tabular-nums">{lot.id}</h3>
                      <p className="text-sm text-[var(--ink-muted)]">
                        {lot.verifiedKg != null
                          ? <>Verified {formatKg(lot.verifiedKg)} @ {formatPct(lot.verifiedGradePct!, 2)} Sn · assay locked {formatDateTime(lot.verifiedAt!)}</>
                          : <>Declared {formatKg(lot.declaredKg)} @ {formatPct(lot.declaredGradePct, 2)} Sn · {lot.purchaseIds.length} ledger entries</>}
                      </p>
                    </div>
                    <LotStatusPill status={lot.status} />
                  </div>

                  <ol className="mt-4 grid gap-2 text-xs sm:grid-cols-5">
                    {[
                      ["Submitted", true],
                      ["Sample received", insp?.status !== "awaiting_sample"],
                      ["Assay verified", lot.verifiedAt != null],
                      ["Domestic offer", offer != null],
                      ["Certificate", lotCerts.length > 0],
                    ].map(([label, done], i) => (
                      <li key={String(label)} className={`border-t-2 pt-1.5 ${done ? "border-[var(--forest)] text-[var(--ink)]" : "border-[var(--line)] text-[var(--ink-muted)]"}`}>
                        {i + 1}. {label}
                      </li>
                    ))}
                  </ol>

                  <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
                    {insp && insp.status === "awaiting_sample" && (
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Deliver sample to</p>
                        <p>{insp.warehouse}</p>
                        <Countdown untilIso={insp.windowEndsAt} nowIso={nowIso} label="Window" className="text-xs" />
                      </div>
                    )}
                    {offer && offer.status === "open" && (
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Offered to qualified {offer.audience}</p>
                        <Countdown untilIso={offer.closesAt} nowIso={nowIso} label="Closes in" />
                        <p className="text-xs text-[var(--ink-muted)]">If no smelter accepts, an export clearance issues automatically.</p>
                      </div>
                    )}
                    {ref != null && offer?.status === "open" && (
                      <>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Indicative you would receive (× {state.policy.coefToSmelter})</p>
                          <Money ngn={ref * state.policy.coefToSmelter} size="sm" tone="green" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Royalty you would owe if exported</p>
                          <Money ngn={ref * (state.policy.royaltyPct / 100)} size="sm" tone="red" />
                        </div>
                      </>
                    )}
                    {lotCerts.map((c) => (
                      <div key={c.certNo}>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">{CERT_CLASS_LABEL[c.cls]}</p>
                        <a href={`/certificates/${c.certNo}`} className="tabular-nums font-semibold underline-offset-4 hover:underline">{c.certNo}</a>
                        <span className="ml-2"><CertStatusPill status={c.status} /></span>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {active === "certificates" && (
        <Panel kicker="Issued to or naming this supplier" title="DMO certificates">
          {certs.length === 0 ? (
            <Empty>No certificates yet.</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                <tr>
                  <th className="pb-2 font-semibold">Certificate</th>
                  <th className="pb-2 font-semibold">Class</th>
                  <th className="pb-2 font-semibold">Lot</th>
                  <th className="pb-2 font-semibold">Issued</th>
                  <th className="pb-2 text-right font-semibold">Payable to you</th>
                  <th className="pb-2 text-right font-semibold">Royalty you owe</th>
                  <th className="pb-2 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {certs.map((c) => (
                  <tr key={c.certNo}>
                    <td className="py-2 tabular-nums"><a href={`/certificates/${c.certNo}`} className="underline-offset-4 hover:underline">{c.certNo}</a></td>
                    <td className="py-2 text-[var(--ink-muted)]">{c.cls}</td>
                    <td className="py-2 tabular-nums">{c.lotId}</td>
                    <td className="py-2 tabular-nums text-[var(--ink-muted)]">{formatDate(c.issuedAt)}</td>
                    <td className="py-2 text-right tabular-nums">{c.cls === "DMO-A" ? formatNgn(c.valuation.totalPayableNgn) : "—"}</td>
                    <td className="py-2 text-right tabular-nums">{c.cls === "DMO-A" ? <span className="text-[var(--forest)]">₦0 (transferred)</span> : <span className="text-[#9b2c2c]">{formatNgn(c.valuation.royaltyNgn)}</span>}</td>
                    <td className="py-2 text-right"><CertStatusPill status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}
    </>
  );
}
