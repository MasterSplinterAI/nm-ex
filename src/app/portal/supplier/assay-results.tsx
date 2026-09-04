import Image from "next/image";
import { LotStepper } from "@/components/portal/lot-stepper";
import { formatDate, formatPct } from "@/lib/format";
import { assaySteps, lotBundle, originLine, variance, VARIANCE_LIMIT_PCT } from "@/lib/dmo/lot-view";
import type { DemoState, Participant } from "@/lib/dmo/types";

export function AssayResults({ state, me, lotId }: { state: DemoState; me: Participant; lotId: string }) {
  const bundle = lotBundle(state, lotId);
  if (!bundle || bundle.lot.ownerId !== me.id) {
    return <p className="text-sm text-[var(--ink-muted)]">That lot is not on this shed’s register.</p>;
  }
  const { lot, inspection, offer } = bundle;
  const weight = variance(lot.declaredKg, lot.verifiedKg);
  const grade = variance(lot.declaredGradePct, lot.verifiedGradePct);
  const assayed = lot.verifiedAt != null;
  const within = assayed && weight.within && grade.within;
  const posted = offer != null;
  const listingHref = `/portal/supplier?tab=listing&lot=${encodeURIComponent(lot.id)}`;

  return (
    <div className="space-y-5">
      <p className="text-xs text-[var(--ink-muted)]">
        Home › Assay &amp; inspection › {lot.id}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-tight sm:text-3xl">Assay &amp; inspection results</h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">Lot {lot.id}</p>
        </div>
        <a href="/portal/supplier?tab=lots" className="text-sm font-semibold text-[var(--forest)] hover:underline">
          All lots
        </a>
      </div>

      <LotStepper steps={assaySteps(bundle)} />

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <section className="portal-card overflow-hidden">
          <div className="grid gap-0 sm:grid-cols-[13rem_1fr]">
            <div className="relative aspect-[4/3] bg-[#dfe6e2] sm:aspect-auto sm:min-h-[11rem]">
              <Image src="/portal/lot-bags-jos.jpg" alt="NM-EX bags at the approved warehouse" fill className="object-cover" sizes="320px" />
            </div>
            <dl className="grid gap-3 p-5 text-sm sm:grid-cols-2">
              <Row label="Lot reference" value={lot.id} mono />
              <Row label="Supplier" value={bundle.supplier.legalName} />
              <Row label="Origin" value={originLine(bundle.supplier)} />
              <Row label="Mineral type" value="Tin (Sn) concentrate" />
              <Row label="Date received" value={formatDate(inspection?.sampleReceivedAt ?? lot.createdAt)} />
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">Inspection status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${assayed ? "bg-[#1b4d38]/10 text-[#1b4d38]" : "bg-[var(--paper)] text-[var(--ink-muted)]"}`}>
                    {assayed ? "Completed" : inspection?.status === "awaiting_sample" ? "Awaiting sample" : "In assay"}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </section>
        <aside className={`rounded-2xl border p-5 ${within ? "border-[#1b4d38]/30 bg-[#1b4d38]/8" : assayed ? "border-[var(--copper)]/40 bg-[var(--copper)]/8" : "border-[var(--line)] bg-white"}`}>
          <p className="font-display text-lg">{assayed ? (within ? "Within acceptable variance" : "Outside ±0.5% variance") : "Assay not locked"}</p>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            {assayed
              ? `Difference between the shed declaration and the NM-EX result is ${within ? "within" : "outside"} ±${VARIANCE_LIMIT_PCT}%. ${within ? "Approved for the National Pool." : "An officer must review before the lot can be offered."}`
              : "Deliver the sample. The officer enters official weight and grade before this lot can be posted."}
          </p>
        </aside>
      </div>

      <section className="portal-card overflow-hidden">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <h2 className="font-display text-lg">Final assay &amp; weight</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              <tr>
                <th className="px-5 pb-2 pt-3 font-semibold">Type</th>
                <th className="pb-2 pt-3 text-right font-semibold">Supplier declared</th>
                <th className="pb-2 pt-3 text-right font-semibold">NM-EX final</th>
                <th className="pb-2 pt-3 text-right font-semibold">Difference</th>
                <th className="px-5 pb-2 pt-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              <MetricRow label="Weight (kg)" declared={lot.declaredKg} verified={lot.verifiedKg} digits={2} v={weight} />
              <MetricRow label="Grade (Sn %)" declared={lot.declaredGradePct} verified={lot.verifiedGradePct} digits={4} v={grade} />
              <tr>
                <td className="px-5 py-3 text-[var(--ink-muted)]" colSpan={4}>
                  {lot.purchaseIds.length} purchase lines locked to this lot
                </td>
                <td className="px-5 py-3 text-right">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="portal-card p-5">
          <h2 className="font-display text-lg">Next steps</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-[var(--ink-muted)]">
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
        <section className="portal-card p-5">
          <h2 className="font-display text-lg">Related documents</h2>
          <ul className="mt-3 space-y-2 text-sm">
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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">{label}</dt>
      <dd className={`mt-0.5 ${mono ? "tabular-nums font-semibold" : ""}`}>{value}</dd>
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
      <td className="px-5 py-3 font-medium">{label}</td>
      <td className="py-3 text-right tabular-nums">{declared.toLocaleString("en-NG", { minimumFractionDigits: digits, maximumFractionDigits: digits })}</td>
      <td className="py-3 text-right tabular-nums font-semibold">
        {verified == null ? "—" : verified.toLocaleString("en-NG", { minimumFractionDigits: digits, maximumFractionDigits: digits })}
      </td>
      <td className="py-3 text-right tabular-nums text-[var(--ink-muted)]">
        {v.diff == null || v.pct == null
          ? "—"
          : `${v.diff > 0 ? "+" : ""}${v.diff.toLocaleString("en-NG", { maximumFractionDigits: 4 })} (${v.pct > 0 ? "+" : ""}${formatPct(v.pct, 2)})`}
      </td>
      <td />
    </tr>
  );
}

function Doc({ label, href, ready }: { label: string; href?: string; ready?: boolean }) {
  if (href) {
    return (
      <li>
        <a href={href} className="font-semibold text-[#1f4b6b] hover:underline">
          {label} {ready ? "· View listing" : ""}
        </a>
      </li>
    );
  }
  return <li className="text-[var(--ink-muted)]">{label} — issued when the assay is locked</li>;
}
