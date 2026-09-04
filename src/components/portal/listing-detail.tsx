import Image from "next/image";
import { ActionButton, ActionForm } from "@/components/portal/action-button";
import { LotStepper } from "@/components/portal/lot-stepper";
import { formatDate, formatKg, formatNgn, formatNgnPrecise, formatPct, formatUsd } from "@/lib/format";
import type { ActionResult } from "@/lib/dmo/action-utils";
import { assaySteps, lotEconomics, originLine, variance, VARIANCE_LIMIT_PCT, type LotBundle } from "@/lib/dmo/lot-view";
import type { DmoPolicy } from "@/lib/dmo/types";

export function ListingDetail({
  bundle,
  policy,
  lmeUsd,
  fxRate,
  audience,
  backHref,
  acceptAction,
}: {
  bundle: LotBundle;
  policy: DmoPolicy;
  lmeUsd: number;
  fxRate: number;
  audience: "owner" | "smelter";
  backHref: string;
  acceptAction?: (prev: ActionResult, fd: FormData) => Promise<ActionResult>;
}) {
  const { lot, supplier, offer, buyer, purchaseCostNgn, acceptance } = bundle;
  const e = lotEconomics(lot, policy, lmeUsd, fxRate);
  const weight = variance(lot.declaredKg, lot.verifiedKg);
  const sold = offer?.status === "accepted" && buyer != null;
  const open = offer?.status === "open";
  const profit = e.listing - purchaseCostNgn;

  return (
    <div className="space-y-5">
      <p className="text-xs text-[var(--ink-muted)]">
        Home › National Pool › {lot.id} › View listing
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-tight sm:text-3xl">Lot listing details — National Pool</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">
            Verified weight, grade, pricing, royalties and transaction status for this lot.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-xl px-3 py-2 text-sm font-semibold ${sold ? "bg-[#1b4d38] text-white" : open ? "bg-[#1b4d38]/10 text-[#1b4d38]" : "bg-[var(--paper)] text-[var(--ink-muted)]"}`}>
            {sold ? `Sold — ${buyer!.legalName}` : open ? "Available on the National Pool" : "Not listed"}
          </span>
          <a href={backHref} className="text-sm font-semibold text-[var(--forest)] hover:underline">
            Back
          </a>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="portal-card overflow-hidden">
          <div className="relative aspect-[16/9] bg-[#dfe6e2]">
            <Image src="/portal/tin-concentrate-sample.jpg" alt="Tin concentrate sample" fill className="object-cover" sizes="400px" />
          </div>
          <dl className="space-y-2 p-5 text-sm">
            <Line label="Lot no." value={lot.id} mono />
            <Line label="Mineral type" value="Tin (Sn) concentrate" />
            <Line label="Supplier / origin" value={`${supplier.legalName} / ${originLine(supplier)}`} />
            <Line label="Received" value={formatDate(bundle.inspection?.sampleReceivedAt ?? lot.createdAt)} />
            <Line label="Listed" value={offer ? formatDate(offer.opensAt) : "—"} />
            {sold && <Line label="Sold" value={formatDate(acceptance!.acceptedAt)} />}
          </dl>
        </section>

        <section className="portal-card p-5">
          <h2 className="font-display text-lg">NM-EX verified results</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <Line label="Final weight" value={`${formatKg(e.kg)} (${(e.kg / 1000).toFixed(5)} tonnes)`} />
            <Line label="Final Sn grade" value={formatPct(e.grade, 4)} />
            <Line label="Estimated metal content (Sn)" value={formatKg(e.containedKg)} />
          </dl>
          {lot.verifiedKg != null && (
            <p className={`mt-4 rounded-xl px-3 py-2 text-xs font-semibold ${weight.within ? "bg-[#1b4d38]/10 text-[#1b4d38]" : "bg-[var(--copper)]/15 text-[var(--copper)]"}`}>
              {weight.within ? "Within acceptable variance" : "Outside variance"}{" "}
              {weight.pct != null ? `(${weight.pct > 0 ? "+" : ""}${formatPct(weight.pct, 2)} vs declaration, limit ±${VARIANCE_LIMIT_PCT}%)` : ""}
            </p>
          )}
        </section>

        <section className="portal-card p-5">
          <h2 className="font-display text-lg">Transaction status</h2>
          <div className="mt-3">
            <LotStepper steps={assaySteps(bundle)} variant="stack" />
          </div>
          {sold && <p className="mt-3 text-sm font-semibold text-[#1b4d38]">Purchased by {buyer!.legalName}</p>}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="portal-card p-5">
          <h2 className="font-display text-lg">Price calculation</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Line label="LME tin" value={`${formatUsd(e.lmeUsd)} / tonne`} />
            <Line label="Smelter payable coefficient" value={`${(e.coef * 100).toFixed(1)}%`} />
            <Line label="FX rate" value={`₦${e.fxRate.toLocaleString("en-NG")} / $1`} />
            <Line label="Total sell price (listing)" value={formatNgnPrecise(e.listing)} strong />
          </dl>
        </section>
        <section className="portal-card p-5">
          <h2 className="font-display text-lg">Fiscal obligations</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Line label="Verified metal value" value={formatNgnPrecise(e.reference)} />
            <Line label={`Royalty (${policy.royaltyPct}%)`} value={formatNgnPrecise(e.royalty)} />
            <p className="text-xs text-[var(--ink-muted)]">
              {sold ? "Liability transferred to the buyer at ₦0 on the DMO-A." : "On domestic acceptance the royalty moves to the smelter at ₦0."}
            </p>
            <Line label={`VAT (${policy.vatPct}%)`} value={formatNgnPrecise(e.vat)} />
            <p className="text-xs text-[var(--ink-muted)]">Accounted under the NM-EX mechanism — not deducted from the shed’s sale proceeds.</p>
          </dl>
        </section>
        {audience === "owner" ? (
          <section className="portal-card p-5">
            <h2 className="font-display text-lg">Your sale &amp; profit</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Line label="Listing price" value={formatNgnPrecise(e.listing)} />
              <Line label={`Recorded purchase cost (${bundle.purchases.length} parcels)`} value={formatNgn(purchaseCostNgn)} />
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">Gross trading profit</dt>
                <dd className="font-display mt-1 text-2xl tabular-nums text-[#1b4d38]">{formatNgnPrecise(profit)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-[var(--ink-muted)]">
              Profit is listing price minus what this shed recorded as paid to miners on the locked parcels. The smelter pays VAT and holds the royalty.
            </p>
          </section>
        ) : (
          <section className="portal-card flex flex-col p-5">
            <h2 className="font-display text-lg">Accept this lot</h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              You pay {formatNgnPrecise(e.listing + e.vat)} including VAT. Royalty {formatNgnPrecise(e.royalty)} transfers to you at ₦0.
            </p>
            {open && acceptAction && offer ? (
              <ActionForm action={acceptAction} hidden={{ offerId: offer.id }} className="mt-auto pt-4" confirm={`Accept ${lot.id} at the current board price? A DMO-A issues immediately.`}>
                <ActionButton pendingText="Issuing certificate…" className="w-full">
                  Accept at board price
                </ActionButton>
              </ActionForm>
            ) : (
              <p className="mt-auto pt-4 text-sm text-[var(--ink-muted)]">{sold ? "This listing is sold." : "This lot is not open."}</p>
            )}
          </section>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="portal-card p-5">
          <h2 className="font-display text-lg">Buyer / smelter</h2>
          {sold && buyer ? (
            <dl className="mt-3 space-y-2 text-sm">
              <Line label="Buyer" value={buyer.legalName} />
              <Line label="Address" value={buyer.address} />
              <Line label="Status" value="Purchase confirmed" />
              <p className="text-xs text-[var(--ink-muted)]">Collect from the approved warehouse within {policy.paymentWindowDays} working days of payment.</p>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">No smelter has accepted yet. The domestic window is running.</p>
          )}
        </section>
        <section className="portal-card p-5">
          <h2 className="font-display text-lg">Documents</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {acceptance ? (
              <li>
                <a href={`/certificates/${acceptance.certNo}`} className="font-semibold text-[#1f4b6b] hover:underline">
                  DMO-A {acceptance.certNo}
                </a>
              </li>
            ) : (
              <li className="text-[var(--ink-muted)]">DMO certificate — issues on acceptance</li>
            )}
            <li className="text-[var(--ink-muted)]">Assay report — locked {lot.verifiedAt ? formatDate(lot.verifiedAt) : "pending"}</li>
            <li className="text-[var(--ink-muted)]">Weighbridge ticket — issued at verification</li>
          </ul>
        </section>
        <section className="portal-card p-5">
          <h2 className="font-display text-lg">Actions</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {audience === "owner" && (
              <li>
                <a href={`/portal/supplier?tab=lots&lot=${encodeURIComponent(lot.id)}`} className="font-semibold text-[var(--forest)] hover:underline">
                  Assay &amp; inspection results
                </a>
              </li>
            )}
            {audience === "smelter" && (
              <li>
                <a href="/portal/smelter?tab=pool" className="font-semibold text-[var(--forest)] hover:underline">
                  Back to National Pool
                </a>
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Line({ label, value, mono, strong }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">{label}</dt>
      <dd className={`text-right ${mono || strong ? "tabular-nums font-semibold" : "tabular-nums"}`}>{value}</dd>
    </div>
  );
}
