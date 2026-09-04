import { redirect } from "next/navigation";
import { ActionButton, ActionForm } from "@/components/portal/action-button";
import { inputClass, labelClass } from "@/components/portal/form-styles";
import { Countdown } from "@/components/portal/countdown";
import { Empty } from "@/components/portal/empty";
import { Money } from "@/components/portal/money";
import { Panel } from "@/components/portal/panel";
import { CertStatusPill, LotStatusPill } from "@/components/portal/status-pill";
import { formatDate, formatDateTime, formatKg, formatNgn, formatPct } from "@/lib/format";
import { demoNowIso } from "@/lib/dmo/clock";
import { tabFromSearch } from "@/lib/dmo/nav";
import { CERT_CLASS_LABEL } from "@/lib/dmo/labels";
import { mmlKgForTier } from "@/lib/dmo/policy";
import { certificatesFor, inspectionForLot, inventoryFor, lotsFor, offerForLot, participantById } from "@/lib/dmo/queries";
import { getSession } from "@/lib/dmo/session";
import { readState } from "@/lib/dmo/store";
import { referenceValueNgn } from "@/lib/dmo/valuation";
import { readSpotBoard } from "@/lib/store";
import { PageHeader } from "../page-header";
import { ListingDetail } from "@/components/portal/listing-detail";
import { lotBundle } from "@/lib/dmo/lot-view";
import { addPurchaseAction } from "./actions";
import { AssayResults } from "./assay-results";
import { SupplierConsolidate } from "./consolidate";
import { SupplierHome } from "./home";
import { SupplierPoolListings } from "./pool-listings";

export const dynamic = "force-dynamic";

type TabId = "home" | "ledger" | "lots" | "listing" | "certificates" | "consolidate";

export default async function SupplierPage({ searchParams }: { searchParams: Promise<{ tab?: string; lot?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "supplier") redirect("/portal");
  const { tab, lot: lotId } = await searchParams;
  const raw = tabFromSearch(tab);
  const active: TabId =
    raw === "lots" || raw === "listing" || raw === "certificates" || raw === "ledger" || raw === "consolidate" ? raw : "home";

  const [state, board] = await Promise.all([readState(), readSpotBoard()]);
  const me = participantById(state, session.participantId)!;
  const nowIso = demoNowIso(state);
  const inv = inventoryFor(state, me.id);
  const lots = lotsFor(state, me.id);
  const certs = certificatesFor(state, me.id);
  const lme = board.minerals.find((m) => m.slug === "tin")?.lastUsd ?? 0;
  const mml1 = mmlKgForTier(1, state.policy);
  const mml2 = mmlKgForTier(2, state.policy);

  return (
    <>
      {active === "home" && <SupplierHome state={state} me={me} nowIso={nowIso} />}
      {active === "consolidate" && <SupplierConsolidate state={state} me={me} />}
      {active === "lots" && lotId && <AssayResults state={state} me={me} lotId={lotId} />}
      {active === "listing" && lotId && (() => {
        const bundle = lotBundle(state, lotId);
        return bundle && bundle.lot.ownerId === me.id ? (
          <ListingDetail
            bundle={bundle}
            policy={state.policy}
            lmeUsd={lme}
            fxRate={board.fx.rate}
            audience="owner"
            backHref="/portal/supplier?tab=listing"
          />
        ) : (
          <p className="text-sm text-[var(--ink-muted)]">That listing is not on this shed’s register.</p>
        );
      })()}
      {active === "listing" && !lotId && (
        <SupplierPoolListings state={state} me={me} lmeUsd={lme} fxRate={board.fx.rate} />
      )}
      {active !== "home" && active !== "consolidate" && !(active === "lots" && lotId) && active !== "listing" && (
        <PageHeader
          kicker="Supplier"
          title={active === "ledger" ? "Purchase logs" : active === "lots" ? "Assay & inspection" : "Certificates"}
          lede={me.regNo ?? undefined}
        />
      )}

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
                    <div key={tier} className="portal-card p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                        Tier {tier} · {tier === 1 ? `above ${state.policy.tier1MinGradePct}% Sn` : `${state.policy.tier1MinGradePct}% Sn and below`}
                      </p>
                      <p className="font-display mt-1 text-3xl tabular-nums">
                        {formatKg(kg)} <span className="text-base text-[var(--ink-muted)]">/ {formatKg(mml)}</span>
                      </p>
                      <div className="mt-3 h-2 w-full bg-[var(--ink)]/10">
                        <div className={`h-2 ${ready ? "bg-[var(--forest)]" : "bg-[var(--copper)]"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <a
                        href="/portal/supplier?tab=consolidate"
                        className={`mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold ${
                          ready
                            ? "bg-[#1b4d38] text-white hover:bg-[#163d2c]"
                            : "cursor-not-allowed bg-[var(--ink)]/10 text-[var(--ink-muted)]"
                        }`}
                        aria-disabled={!ready}
                      >
                        {ready ? `Consolidate ${formatKg(kg)} — choose warehouse` : `${formatKg(mml - kg)} more to reach MML`}
                      </a>
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
                      <th className="pb-2 font-semibold">Purchase ID</th>
                      <th className="pb-2 font-semibold">Date</th>
                      <th className="pb-2 font-semibold">Source</th>
                      <th className="pb-2 font-semibold">Your reference</th>
                      <th className="pb-2 text-right font-semibold">Weight</th>
                      <th className="pb-2 text-right font-semibold">Grade</th>
                      <th className="pb-2 text-right font-semibold">Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {[...inv.entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).map((e) => (
                      <tr key={e.id}>
                        <td className="py-2 tabular-nums font-semibold">{e.id}</td>
                        <td className="py-2 tabular-nums">{e.date}</td>
                        <td className="py-2">{e.source}</td>
                        <td className="py-2 tabular-nums text-[var(--ink-muted)]">{e.reference || "—"}</td>
                        <td className="py-2 text-right tabular-nums">{formatKg(e.kg)}</td>
                        <td className="py-2 text-right tabular-nums">{formatPct(e.gradePct, 2)}</td>
                        <td className="py-2 text-right tabular-nums">{formatNgn(e.valueNgn)}</td>
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
                <span className={labelClass}>Your reference (optional)</span>
                <input name="reference" className={`${inputClass} mt-1`} placeholder="e.g. RCPT-4421 or cash book folio" />
                <span className="mt-1 block text-xs text-[var(--ink-muted)]">
                  Cross-reference against your own books. NM-EX assigns a unique purchase ID when you save.
                </span>
              </label>
              <ActionButton pendingText="Recording…">Add to ledger</ActionButton>
              <p className="text-xs text-[var(--ink-muted)]">
                Shed price guide today: ~{formatNgn((lme * board.fx.rate * state.policy.coefMinerToAggregator) / 1000)} per kg of contained tin (LME × FX × {state.policy.coefMinerToAggregator}).
              </p>
            </ActionForm>
          </Panel>
        </div>
      )}

      {active === "lots" && !lotId && (
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
                <article key={lot.id} className="portal-card p-5">
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
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <a href={`/portal/supplier?tab=lots&lot=${encodeURIComponent(lot.id)}`} className="font-semibold text-[var(--forest)] hover:underline">
                      View assay &amp; inspection
                    </a>
                    {offer && (
                      <a href={`/portal/supplier?tab=listing&lot=${encodeURIComponent(lot.id)}`} className="font-semibold text-[#1f4b6b] hover:underline">
                        View listing →
                      </a>
                    )}
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
