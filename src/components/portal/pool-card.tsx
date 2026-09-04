import { ActionButton, ActionForm } from "@/components/portal/action-button";
import { Countdown } from "@/components/portal/countdown";
import { Money } from "@/components/portal/money";
import { formatDateTime, formatKg, formatMt, formatPct } from "@/lib/format";
import { commodityLabel } from "@/lib/dmo/labels";
import type { PoolEntry } from "@/lib/dmo/queries";
import type { DmoPolicy } from "@/lib/dmo/types";
import { referenceValueNgn } from "@/lib/dmo/valuation";
import type { ActionResult } from "@/lib/dmo/action-utils";

export function PoolCard({
  entry,
  policy,
  lmeUsd,
  fxRate,
  nowIso,
  acceptAction,
  verb,
}: {
  entry: PoolEntry;
  policy: DmoPolicy;
  lmeUsd: number;
  fxRate: number;
  nowIso: string;
  acceptAction: (prev: ActionResult, fd: FormData) => Promise<ActionResult>;
  verb: string;
}) {
  const { offer, lot, supplier } = entry;
  const coef = lot.kind === "concentrate" ? policy.coefToSmelter : 1;
  const ref = referenceValueNgn(lot.verifiedKg! / 1000, lot.verifiedGradePct!, lmeUsd, fxRate);
  const purchase = ref * coef;
  const vat = purchase * (policy.vatPct / 100);
  const contained = (lot.verifiedKg! * lot.verifiedGradePct!) / 100;
  return (
    <article className="grid gap-5 border border-[var(--line)] bg-white/70 p-5 lg:grid-cols-[1fr_20rem]">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--forest)]">{commodityLabel(lot.kind)} · NM-EX verified</p>
        <h3 className="font-display mt-1 text-2xl tabular-nums">{lot.id}</h3>
        <p className="text-sm text-[var(--ink-muted)]">
          {supplier.legalName} · {supplier.regNo} · assay locked {formatDateTime(lot.verifiedAt!)}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Verified weight</p>
            <p className="font-semibold tabular-nums">{formatMt(lot.verifiedKg)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Verified grade</p>
            <p className="font-semibold tabular-nums">{formatPct(lot.verifiedGradePct!, 2)} Sn</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Contained tin</p>
            <p className="font-semibold tabular-nums">{formatKg(contained)}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 border-t border-[var(--line)] pt-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Reference (live board)</p>
            <Money ngn={ref} usd={ref / fxRate} size="sm" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">{coef === 1 ? "Purchase value" : `Purchase × ${coef}`}</p>
            <Money ngn={purchase} size="sm" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Total incl. VAT {policy.vatPct}%</p>
            <Money ngn={purchase + vat} size="sm" tone="green" />
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-[var(--ink-muted)]">
          Indicative at LME US${lmeUsd.toLocaleString("en-US")}/MT × ₦{fxRate.toLocaleString("en-NG")}. The price is fixed at the moment you {verb.toLowerCase()}; the
          royalty liability on {formatKg(contained)} of contained tin ({policy.royaltyPct}%) transfers to you at ₦0 and is reconciled on your export or domestic sale.
        </p>
      </div>
      <div className="flex flex-col justify-between gap-4 border-t border-[var(--line)] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Domestic offer window</p>
          <Countdown untilIso={offer.closesAt} nowIso={nowIso} className="font-display text-2xl" />
          <p className="mt-1 text-xs text-[var(--ink-muted)]">Closes {formatDateTime(offer.closesAt)} WAT. If nobody accepts, the lot clears for export.</p>
        </div>
        <ActionForm action={acceptAction} hidden={{ offerId: offer.id }} inline={false} confirm={`${verb} ${lot.id} at the current board price? A DMO-A certificate will be issued immediately.`}>
          <ActionButton pendingText="Issuing certificate…" className="w-full">{verb} at board price</ActionButton>
        </ActionForm>
      </div>
    </article>
  );
}
