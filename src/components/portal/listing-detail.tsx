import Image from "next/image";
import type { ReactNode } from "react";
import { ActionButton, ActionForm } from "@/components/portal/action-button";
import { LotStepper } from "@/components/portal/lot-stepper";
import { formatDate, formatKg, formatNgn, formatNgnPrecise, formatPct, formatUsd } from "@/lib/format";
import type { ActionResult } from "@/lib/dmo/action-utils";
import {
  assaySteps,
  lotEconomics,
  lotFormulas,
  originLine,
  variance,
  VARIANCE_LIMIT_PCT,
  type LotBundle,
} from "@/lib/dmo/lot-view";
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
  const f = lotFormulas(e, policy);
  const weight = variance(lot.declaredKg, lot.verifiedKg);
  const sold = offer?.status === "accepted" && buyer != null;
  const open = offer?.status === "open";
  const profit = e.listing - purchaseCostNgn;

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--ink-soft)]">Home › National Pool › {lot.id} › View listing</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-[1.75rem]">Lot listing details — National Pool</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">
            Verified weight, grade, pricing, royalties and transaction status for this lot.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-lg px-3 py-2 text-sm font-semibold ${
              sold
                ? "bg-[#1b4d38] text-white"
                : open
                  ? "border border-[#1b4d38]/25 bg-[#1b4d38]/10 text-[#1b4d38]"
                  : "border border-[var(--line-strong)] bg-white text-[var(--ink-muted)]"
            }`}
          >
            {sold ? `Sold — ${buyer!.legalName}` : open ? "Available on the National Pool" : "Not listed"}
          </span>
          <a href={backHref} className="text-sm font-semibold text-[var(--forest)] hover:underline">
            Back
          </a>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Lot identity">
          <div className="relative aspect-[16/9] border-b border-[var(--line-strong)] bg-[#dfe6e2]">
            <Image src="/portal/tin-concentrate-sample.jpg" alt="Tin concentrate sample" fill className="object-cover" sizes="400px" />
          </div>
          <dl className="px-4 py-1">
            <Row label="Lot no." value={lot.id} />
            <Row label="Mineral type" value="Tin (Sn) concentrate" />
            <Row label="Supplier" value={supplier.legalName} />
            <Row label="Origin" value={originLine(supplier)} />
            <Row label="Date received" value={formatDate(bundle.inspection?.sampleReceivedAt ?? lot.createdAt)} />
            <Row label="Date listed" value={offer ? formatDate(offer.opensAt) : "—"} />
            {sold && <Row label="Date sold" value={formatDate(acceptance!.acceptedAt)} />}
          </dl>
        </Card>

        <Card title="NM-EX verified results">
          <div className="px-4 py-1">
            <Row label="Final weight" value={`${formatKg(e.kg)} (${(e.kg / 1000).toFixed(5)} tonnes)`} />
            <Row label="Final Sn grade" value={formatPct(e.grade, 4)} />
            <Row label="Estimated metal content (Sn)" value={formatKg(e.containedKg)} />
          </div>
          {lot.verifiedKg != null && (
            <div className="px-4 pb-4">
              <p
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                  weight.within
                    ? "border-[#1b4d38]/25 bg-[#1b4d38]/8 text-[#1b4d38]"
                    : "border-[var(--copper)]/40 bg-[var(--copper)]/10 text-[var(--copper)]"
                }`}
              >
                {weight.within ? "Within acceptable variance" : "Outside variance"}
                {weight.pct != null
                  ? ` — ${weight.pct > 0 ? "+" : ""}${formatPct(weight.pct, 2)} against the shed declaration (limit ±${VARIANCE_LIMIT_PCT}%)`
                  : ""}
              </p>
            </div>
          )}
        </Card>

        <Card title="Transaction status">
          <div className="p-4">
            <LotStepper steps={assaySteps(bundle)} variant="stack" />
            {sold && <p className="mt-3 text-sm font-semibold text-[#1b4d38]">Purchased by {buyer!.legalName}</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Price calculation (NM-EX)">
          <div className="px-4 py-1">
            <Row label="LME price (tin)" value={`${formatUsd(e.lmeUsd)} / tonne`} />
            <Row label="Smelter payable coefficient" value={`${(e.coef * 100).toFixed(1)}%`} />
            <Row label="NM-EX final grade (Sn)" value={formatPct(e.grade, 4)} />
            <Row label="Final weight" value={`${formatKg(e.kg)} (${(e.kg / 1000).toFixed(5)} t)`} />
            <Row label="FX rate" value={`₦${e.fxRate.toLocaleString("en-NG")} / $1`} />
          </div>
          <div className="p-4 pt-2">
            <div className="rounded-lg border border-[#1b4d38]/25 bg-[#1b4d38]/[0.07] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--ink)]">Total sell price (listing price)</p>
              <p className="font-display mt-1 text-[1.6rem] leading-tight tabular-nums text-[#1b4d38]">{f.listing.result}</p>
              <p className="formula mt-1.5">= {f.listing.expression}</p>
            </div>
          </div>
        </Card>

        <Card title="Fiscal obligations (for information)">
          <div className="px-4 py-1">
            <Figure label={f.reference.label} value={f.reference.result} expression={f.reference.expression} />
            <Figure label={f.royalty.label} value={f.royalty.result} expression={f.royalty.expression}>
              <Note>
                {sold
                  ? `Royalty status: liability transferred to ${buyer!.legalName} at ₦0 on the DMO-A.`
                  : "Royalty status: on domestic acceptance the liability moves to the smelter at ₦0."}
              </Note>
            </Figure>
            <Figure label={f.vat.label} value={f.vat.result} expression={f.vat.expression}>
              <Note>VAT status: accounted under the NM-EX mechanism, not deducted from the shed’s sale proceeds.</Note>
            </Figure>
          </div>
        </Card>

        {audience === "owner" ? (
          <Card title={`Your sale & profit (${supplier.legalName})`}>
            <div className="px-4 py-1">
              <Row label="Total sell price (listing price)" value={f.listing.result} />
              <Row label={`Recorded purchase cost (${bundle.purchases.length} parcels)`} value={formatNgn(purchaseCostNgn)} />
            </div>
            <div className="p-4 pt-2">
              <div
                className={`rounded-lg border px-4 py-3 ${
                  profit < 0 ? "border-[#9b2c2c]/30 bg-[#9b2c2c]/[0.06]" : "border-[#1b4d38]/25 bg-[#1b4d38]/[0.07]"
                }`}
              >
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {profit < 0 ? "Your gross trading loss" : "Your gross trading profit"}
                </p>
                <p className={`font-display mt-1 text-[1.6rem] leading-tight tabular-nums ${profit < 0 ? "text-[#9b2c2c]" : "text-[#1b4d38]"}`}>
                  {formatNgnPrecise(profit)}
                </p>
                <p className="formula mt-1.5">
                  = {f.listing.result} − {formatNgn(purchaseCostNgn)}
                </p>
              </div>
              <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-[var(--ink-muted)]">
                <li>Royalty is paid by the buying smelter and is not deducted from your proceeds.</li>
                <li>VAT is accounted for under the NM-EX VAT mechanism.</li>
                <li>Profit is the listing price less what you recorded as paid on the locked parcels.</li>
              </ol>
            </div>
          </Card>
        ) : (
          <Card title="Accept this lot">
            <div className="flex flex-1 flex-col p-4">
              <div className="px-0 py-1">
                <Row label="Listing price" value={f.listing.result} />
                <Row label={`VAT (${policy.vatPct}%)`} value={f.vat.result} />
                <Row label="Total payable by you" value={formatNgnPrecise(e.listing + e.vat)} />
                <Row label={`Royalty transferred to you (${policy.royaltyPct}%)`} value={`${f.royalty.result} at ₦0`} />
              </div>
              {open && acceptAction && offer ? (
                <ActionForm
                  action={acceptAction}
                  hidden={{ offerId: offer.id }}
                  className="mt-auto pt-4"
                  confirm={`Accept ${lot.id} at the current board price? A DMO-A issues immediately.`}
                >
                  <ActionButton pendingText="Issuing certificate…" className="w-full">
                    Accept at board price
                  </ActionButton>
                </ActionForm>
              ) : (
                <p className="mt-auto pt-4 text-sm text-[var(--ink-muted)]">
                  {sold ? "This listing is sold." : "This lot is not open."}
                </p>
              )}
            </div>
          </Card>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Buyer / smelter information">
          {sold && buyer ? (
            <div className="px-4 py-1">
              <Row label="Buyer" value={buyer.legalName} />
              <Row label="Location" value={buyer.address} />
              <Row label="Purchase price" value={f.listing.result} />
              <Row label="Status" value="Purchase confirmed" />
              <Row label="Expected collection" value={`Within ${policy.paymentWindowDays} working days`} />
            </div>
          ) : (
            <p className="p-4 text-sm text-[var(--ink-muted)]">No smelter has accepted yet. The domestic window is running.</p>
          )}
        </Card>

        <Card title="Documents">
          <ul className="px-4 py-1">
            <DocRow
              label={acceptance ? `DMO-A ${acceptance.certNo}` : "DMO certificate"}
              href={acceptance ? `/certificates/${acceptance.certNo}` : undefined}
              pending="Issues on acceptance"
            />
            <DocRow
              label="Assay report"
              pending={lot.verifiedAt ? `Locked ${formatDate(lot.verifiedAt)}` : "Pending assay"}
            />
            <DocRow label="Weighbridge ticket" pending="Issued at verification" />
            <DocRow label="Royalty calculation" pending={f.royalty.result} />
          </ul>
        </Card>

        <Card title="Actions">
          <ul className="px-4 py-1">
            {audience === "owner" && (
              <DocRow label="Assay & inspection results" href={`/portal/supplier?tab=lots&lot=${encodeURIComponent(lot.id)}`} pending="" />
            )}
            {audience === "smelter" && <DocRow label="Back to National Pool" href="/portal/smelter?tab=pool" pending="" />}
            {audience === "owner" && <DocRow label="All your listings" href="/portal/supplier?tab=listing" pending="" />}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="portal-card flex flex-col overflow-hidden">
      <div className="card-head">
        <h2 className="card-title">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="data-row">
      <dt className="data-label">{label}</dt>
      <dd className="data-value">{value}</dd>
    </div>
  );
}

/** A money figure with the arithmetic that produced it directly underneath. */
function Figure({
  label,
  value,
  expression,
  children,
}: {
  label: string;
  value: string;
  expression: string;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-[var(--rule)] py-3 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--ink)]">{label}</p>
        <p className="text-[0.9375rem] font-bold tabular-nums text-[var(--ink)]">{value}</p>
      </div>
      <p className="formula mt-1">= {expression}</p>
      {children}
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="mt-2 rounded-md bg-[var(--paper)] px-2.5 py-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">{children}</p>;
}

function DocRow({ label, href, pending }: { label: string; href?: string; pending: string }) {
  return (
    <li className="data-row">
      <span className="data-label text-[var(--ink)]">{label}</span>
      {href ? (
        <a href={href} className="text-sm font-semibold text-[#1f4b6b] hover:underline">
          View
        </a>
      ) : (
        <span className="text-xs text-[var(--ink-soft)]">{pending}</span>
      )}
    </li>
  );
}
