import Image from "next/image";
import { LotStepper } from "@/components/portal/lot-stepper";
import { formatDate, formatKg, formatNgn, formatPct } from "@/lib/format";
import { assaySteps, lotBundle, originLine, variance, VARIANCE_LIMIT_PCT } from "@/lib/dmo/lot-view";
import { supplierVocab } from "@/lib/dmo/supplier-vocab";
import type { DemoState, Participant } from "@/lib/dmo/types";

export function AssayResults({ state, me, lotId }: { state: DemoState; me: Participant; lotId: string }) {
  const bundle = lotBundle(state, lotId);
  if (!bundle || bundle.lot.ownerId !== me.id) {
    return <p className="text-sm text-[var(--ink-muted)]">That lot is not on this shed’s register.</p>;
  }
  const { lot, inspection, offer } = bundle;
  const vocab = supplierVocab(me.category);
  const weight = variance(lot.declaredKg, lot.verifiedKg);
  const grade = variance(lot.declaredGradePct, lot.verifiedGradePct);
  const assayed = lot.verifiedAt != null;
  const within = assayed && weight.within && grade.within;
  const posted = offer != null;
  const listingHref = `/portal/supplier?tab=listing&lot=${encodeURIComponent(lot.id)}`;

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--ink-soft)]">
        Home › Assay &amp; inspection › {lot.id}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-[1.75rem]">Assay &amp; inspection results</h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Independent verification by an NM-EX accredited laboratory. Lot {lot.id}.
          </p>
        </div>
        <a href="/portal/supplier?tab=lots" className="text-sm font-semibold text-[var(--forest)] hover:underline">
          All lots
        </a>
      </div>

      <LotStepper steps={assaySteps(bundle)} />

      <div className="grid gap-4 lg:grid-cols-[1fr_19rem]">
        <section className="portal-card overflow-hidden">
          <div className="card-head">
            <h2 className="card-title">Lot information</h2>
          </div>
          <div className="grid gap-0 sm:grid-cols-[13rem_1fr]">
            <div className="relative aspect-[4/3] border-b border-[var(--line-strong)] bg-[#dfe6e2] sm:aspect-auto sm:border-b-0 sm:border-r sm:min-h-[12rem]">
              <Image src="/portal/lot-bags-jos.jpg" alt="NM-EX bags at the approved warehouse" fill className="object-cover" sizes="320px" />
            </div>
            <dl className="px-4 py-1">
              <Row label="Lot reference" value={lot.id} />
              <Row label="Supplier" value={bundle.supplier.legalName} />
              <Row label="Origin" value={originLine(bundle.supplier)} />
              <Row label="Mineral type" value="Tin (Sn) concentrate" />
              <Row label="Date received" value={formatDate(inspection?.sampleReceivedAt ?? lot.createdAt)} />
              <div className="data-row">
                <dt className="data-label">Inspection status</dt>
                <dd>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${assayed ? "bg-[#1b4d38]/10 text-[#1b4d38]" : "bg-[var(--paper)] text-[var(--ink-muted)]"}`}>
                    {assayed ? "Completed" : inspection?.status === "awaiting_sample" ? "Awaiting sample" : "In assay"}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </section>
        <aside
          className={`rounded-xl border p-5 ${
            within
              ? "border-[#1b4d38]/35 bg-[#1b4d38]/[0.09]"
              : assayed
                ? "border-[var(--copper)]/45 bg-[var(--copper)]/[0.09]"
                : "border-[var(--line-strong)] bg-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base font-bold text-white ${
                within ? "bg-[#1b4d38]" : assayed ? "bg-[var(--copper)]" : "bg-[var(--ink-soft)]"
              }`}
            >
              {within ? "✓" : "!"}
            </span>
            <p className={`font-display text-lg leading-tight ${within ? "text-[#1b4d38]" : assayed ? "text-[var(--copper)]" : ""}`}>
              {assayed ? (within ? "Within acceptable variance" : `Outside ±${VARIANCE_LIMIT_PCT}% variance`) : "Assay not locked"}
            </p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
            {assayed
              ? `Difference between the shed declaration and the NM-EX result is ${within ? "within" : "outside"} ±${VARIANCE_LIMIT_PCT}%. ${within ? "Approved for the National Pool." : "An officer must review before the lot can be offered."}`
              : "Deliver the sample. The officer enters official weight and grade before this lot can be posted."}
          </p>
        </aside>
      </div>

      <section className="portal-card overflow-hidden">
        <div className="card-head">
          <h2 className="card-title">Final assay &amp; weight results</h2>
          <span className="text-xs text-[var(--ink-soft)]">Acceptable variance ±{VARIANCE_LIMIT_PCT}%</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr className="bg-[#1b4d38] text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-white">
                <th className="px-4 py-2.5">Type</th>
                <th className="py-2.5 text-right">Supplier declared</th>
                <th className="py-2.5 text-right">NM-EX final</th>
                <th className="py-2.5 text-right">Difference</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule)]">
              <MetricRow label="Weight (kg)" declared={lot.declaredKg} verified={lot.verifiedKg} digits={2} v={weight} />
              <MetricRow label="Grade (Sn %)" declared={lot.declaredGradePct} verified={lot.verifiedGradePct} digits={4} v={grade} />
              <tr className="bg-[#f4f7f5]">
                <td className="px-4 py-3 text-[var(--ink-muted)]" colSpan={4}>
                  {bundle.purchases.length} ledger line{bundle.purchases.length === 1 ? "" : "s"} locked to this lot
                </td>
                <td className="px-4 py-3 text-right">
                  {posted ? (
                    <a href={listingHref} className="text-sm font-semibold text-[#1f4b6b] hover:underline">
                      Posted to National Pool · View listing →
                    </a>
                  ) : assayed ? (
                    <span className="text-sm font-semibold text-[#1b4d38]">Assayed · not yet listed</span>
                  ) : (
                    <span className="text-sm text-[var(--ink-muted)]">Not assayed</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {bundle.purchases.length > 0 && (
        <section className="portal-card overflow-hidden">
          <div className="card-head">
            <h2 className="card-title">Ledger lines locked into this lot</h2>
            <a href="/portal/supplier?tab=ledger" className="text-sm font-semibold text-[var(--forest)] hover:underline">
              Back to {vocab.logTitle.toLowerCase()}
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="py-2">Purchase ID</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">{vocab.sourceColumn}</th>
                  <th className="py-2">Your reference</th>
                  <th className="py-2 text-right">Weight</th>
                  <th className="py-2 text-right">Grade</th>
                  <th className="py-2 text-right">{vocab.costColumn}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]">
                {bundle.purchases.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 tabular-nums font-semibold">{p.id}</td>
                    <td className="py-2 tabular-nums">{p.date}</td>
                    <td className="py-2">{p.source}</td>
                    <td className="py-2 tabular-nums text-[var(--ink-muted)]">{p.reference || "—"}</td>
                    <td className="py-2 text-right tabular-nums">{formatKg(p.kg)}</td>
                    <td className="py-2 text-right tabular-nums">{formatPct(p.gradePct, 2)}</td>
                    <td className="py-2 text-right tabular-nums">{formatNgn(p.valueNgn)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--line-strong)] bg-[#f4f7f5] font-bold">
                  <td className="py-2.5" colSpan={4}>
                    Declared total
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{formatKg(lot.declaredKg)}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatPct(lot.declaredGradePct, 2)}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatNgn(bundle.purchaseCostNgn)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="portal-card overflow-hidden">
          <div className="card-head">
            <h2 className="card-title">Next steps</h2>
          </div>
          <ol className="list-decimal space-y-2 p-4 pl-8 text-sm leading-relaxed text-[var(--ink-muted)]">
            {posted ? (
              <>
                <li>This lot is on the NM-EX National Pool.</li>
                <li>Qualified smelters can accept it at the live board price.</li>
                <li>You will see the buyer and DMO-A here once someone accepts.</li>
              </>
            ) : assayed ? (
              <>
                <li>Official weight and grade are locked.</li>
                <li>The lot is ready to post to the National Pool.</li>
              </>
            ) : (
              <>
                <li>Deliver a sample to {inspection?.warehouse ?? "the approved warehouse"} within 48 hours.</li>
                <li>An NM-EX officer records receipt, then locks the assay.</li>
                <li>Only then can the lot be listed for smelters.</li>
              </>
            )}
          </ol>
        </section>
        <section className="portal-card overflow-hidden">
          <div className="card-head">
            <h2 className="card-title">Related documents</h2>
          </div>
          <ul className="px-4 py-1">
            <Doc label="NM-EX assay certificate" href={posted ? listingHref : undefined} />
            <Doc label="Inspection report" href={undefined} />
            <Doc label="Weighbridge ticket" href={undefined} />
            <Doc label="Lot listing (National Pool)" href={posted ? listingHref : undefined} ready={posted} />
          </ul>
        </section>
      </div>
    </div>
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

function MetricRow({
  label,
  declared,
  verified,
  digits,
  v,
}: {
  label: string;
  declared: number;
  verified: number | null;
  digits: number;
  v: ReturnType<typeof variance>;
}) {
  return (
    <tr>
      <td className="px-4 py-3 font-medium">{label}</td>
      <td className="py-3 text-right tabular-nums">{declared.toLocaleString("en-NG", { minimumFractionDigits: digits, maximumFractionDigits: digits })}</td>
      <td className="py-3 text-right font-bold tabular-nums">
        {verified == null ? "—" : verified.toLocaleString("en-NG", { minimumFractionDigits: digits, maximumFractionDigits: digits })}
      </td>
      <td className="py-3 text-right tabular-nums text-[var(--ink-muted)]">
        {v.diff == null || v.pct == null
          ? "—"
          : `${v.diff > 0 ? "+" : ""}${v.diff.toLocaleString("en-NG", { maximumFractionDigits: 4 })} (${v.pct > 0 ? "+" : ""}${formatPct(v.pct, 2)})`}
      </td>
      <td className="px-4 py-3 text-right">
        {v.pct != null && (
          <span className={`text-xs font-semibold ${v.within ? "text-[#1b4d38]" : "text-[var(--copper)]"}`}>
            {v.within ? "Within variance" : "Outside variance"}
          </span>
        )}
      </td>
    </tr>
  );
}

function Doc({ label, href, ready }: { label: string; href?: string; ready?: boolean }) {
  return (
    <li className="data-row">
      <span className="data-label text-[var(--ink)]">{label}</span>
      {href ? (
        <a href={href} className="text-sm font-semibold text-[#1f4b6b] hover:underline">
          {ready ? "View listing" : "View"}
        </a>
      ) : (
        <span className="text-xs text-[var(--ink-soft)]">Issued when the assay is locked</span>
      )}
    </li>
  );
}
