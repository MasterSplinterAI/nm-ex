import { NigeriaFlag } from "@/components/nigeria-flag";
import { CertStatusPill } from "@/components/portal/status-pill";
import { formatDate, formatDateTime, formatFxRate, formatKg, formatMt, formatNgnPrecise, formatPct, formatUsd } from "@/lib/format";
import { CERT_STATUS_LABEL } from "@/lib/dmo/labels";
import type { CertificateFullView } from "@/lib/dmo/queries";
import type { DemoState } from "@/lib/dmo/types";
import { verifyUrl } from "@/lib/dmo/qr";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[var(--ink)]/70 pt-3">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink)]">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Row({ label, value, strong, tone }: { label: string; value: React.ReactNode; strong?: boolean; tone?: "red" | "green" | "muted" }) {
  return (
    <div className="grid grid-cols-[minmax(0,13rem)_1fr] gap-3 py-1 text-[13px] leading-snug">
      <dt className="text-[var(--ink)]/70">{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-semibold" : ""} ${tone === "red" ? "font-semibold text-[#9b2c2c]" : tone === "green" ? "font-semibold text-[var(--forest)]" : tone === "muted" ? "text-[var(--ink)]/60" : "text-[var(--ink)]"}`}>{value}</dd>
    </div>
  );
}

export function CertificateSheet({ view, state, qrSvg }: { view: CertificateFullView; state: DemoState; qrSvg: string }) {
  const { certificate: c, lot, supplier, counterparty, valuation: v, priceRef, offer, acceptance, history } = view;
  const isAcceptance = c.cls === "DMO-A";
  const parent = lot.parentLotId ? state.parentLots.find((p) => p.id === lot.parentLotId) : null;
  const campaign = lot.campaignId ? state.campaigns.find((k) => k.id === lot.campaignId) : null;
  const childLots = campaign
    ? campaign.parentLotIds.flatMap((pid) => state.parentLots.find((p) => p.id === pid)?.childLotIds ?? [])
    : [];
  const childCerts = childLots.map((id) => state.certificates.find((cc) => cc.lotId === id && cc.cls === "DMO-A")).filter(Boolean);
  const bannerTone = isAcceptance ? "bg-[var(--forest)] text-white" : "bg-[var(--ink)] text-[var(--paper)]";
  const watermark = c.status !== "VALID" ? CERT_STATUS_LABEL[c.status].toUpperCase() : null;

  return (
    <article className="certificate relative mx-auto max-w-3xl border border-[var(--ink)] bg-white px-7 py-7 text-[var(--ink)] shadow-[0_1px_0_rgba(0,0,0,0.04),0_18px_40px_-24px_rgba(16,21,18,0.35)] sm:px-10 sm:py-9 print:max-w-none print:border-0 print:shadow-none">
      {watermark && (
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <span className="rotate-[-24deg] border-[6px] border-[#9b2c2c]/25 px-8 py-3 font-display text-6xl font-bold tracking-[0.3em] text-[#9b2c2c]/20 sm:text-8xl">{watermark}</span>
        </div>
      )}

      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="font-display text-3xl tracking-tight">NM-EX</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--ink)]/70">Nigerian Metals Exchange</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--ink)]/60">Ministry of Solid Minerals Development · Domestic Market Offer Programme</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <NigeriaFlag className="h-6 w-9 shadow-sm" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink)]/60">Certificate No.</p>
            <p className="font-display text-lg tabular-nums">{c.certNo}</p>
          </div>
        </div>
      </header>

      <div className="mt-6 text-center">
        <h1 className="font-display text-2xl leading-tight sm:text-3xl">{view.title}</h1>
        <p className="mt-1 text-sm uppercase tracking-[0.18em] text-[var(--ink)]/70">{view.subtitle}</p>
        <p className={`mx-auto mt-4 inline-block px-5 py-2 text-xs font-bold uppercase tracking-[0.22em] ${bannerTone}`}>
          {view.cls === "DMO-A" ? (lot.kind === "concentrate" ? "SOLD TO QUALIFIED DOMESTIC SMELTER" : "SOLD TO QUALIFIED DOMESTIC BUYER") : lot.kind === "concentrate" ? "NO DOMESTIC SMELTER OFFER — EXPORT BOUND" : "NO DOMESTIC OFFER — EXPORT BOUND"}
        </p>
      </div>

      <div className="mt-6 grid gap-3 border-y border-[var(--ink)]/70 py-3 text-[13px] sm:grid-cols-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink)]/60">Issue date</p>
          <p className="font-semibold">{formatDate(c.issuedAt)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink)]/60">Issued at (WAT)</p>
          <p className="font-semibold tabular-nums">{formatDateTime(c.issuedAt)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink)]/60">Status</p>
          <CertStatusPill status={c.status} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Section title={isAcceptance ? "Seller" : "Exporter / Supplier"}>
          <dl>
            <Row label="Registered name" value={supplier.legalName} strong />
            <Row label="NM-EX registration" value={supplier.regNo} />
            <Row label="Address" value={supplier.address} />
            <Row label="Contact" value={`${supplier.contactName} · ${supplier.phone}`} />
          </dl>
        </Section>
        <Section title={isAcceptance ? (lot.kind === "concentrate" ? "Qualified domestic smelter" : "Qualified domestic buyer") : "Domestic offer outcome"}>
          {counterparty ? (
            <dl>
              <Row label="Registered name" value={counterparty.legalName} strong />
              <Row label="NM-EX registration" value={counterparty.regNo} />
              <Row label="Address" value={counterparty.address} />
              <Row label="Contact" value={`${counterparty.contactName} · ${counterparty.phone}`} />
            </dl>
          ) : (
            <dl>
              <Row label="Offer opened" value={formatDateTime(offer.opensAt)} />
              <Row label="Offer closed" value={formatDateTime(offer.closesAt)} />
              <Row label="Offered to" value={offer.audience === "smelters" ? "All qualified domestic smelters" : "All qualified domestic buyers"} />
              <Row label="Acceptances received" value="None" strong />
              <Row label="Outcome" value="Domestic-offer-first obligation discharged. Export permitted." tone="green" />
            </dl>
          )}
        </Section>
      </div>

      <div className="mt-6">
        <Section title="Verified lot details">
          <dl className="sm:columns-2 sm:gap-8">
            <Row label="NM-EX lot ID" value={lot.id} strong />
            <Row label="Commodity" value={view.commodity} />
            <Row label="Verified weight" value={`${formatMt(lot.verifiedKg)} (${formatKg(lot.verifiedKg)})`} />
            <Row label="Verified grade" value={`${formatPct(v.gradePct, 2)} Sn`} />
            <Row label="Contained tin" value={`${formatMt(v.containedTinMt * 1000)}`} strong />
            <Row label="Assay locked" value={`${formatDateTime(lot.verifiedAt!)} · ${state.inspections.find((i) => i.lotId === lot.id)?.warehouse ?? "NM-EX Approved Warehouse"}`} />
            {parent && <Row label="Parent lot" value={`${parent.id} (${parent.childLotIds.length} child lots, ${formatKg(parent.containedTinKg)} Sn)`} />}
            {campaign && <Row label="Smelting campaign" value={`${formatKg(campaign.inputContainedKg)} contained in → ${formatKg(campaign.recoveredKg)} refined (${formatPct(campaign.recoveryPct, 2)} recovery)`} />}
            {childCerts.length > 0 && <Row label="Input DMO-A certificates" value={childCerts.map((cc) => cc!.certNo).join(", ")} />}
          </dl>
        </Section>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Section title="Reference prices at issue">
          <dl>
            <Row label="LME tin cash settlement" value={`${formatUsd(priceRef.lmeUsd, true)} / MT`} strong />
            <Row label="CBN USD → NGN reference" value={formatFxRate(priceRef.fxRate)} strong />
            <Row label="Snapshot taken" value={formatDateTime(priceRef.at)} />
            <Row label="Reference value / MT Sn" value={formatNgnPrecise(priceRef.lmeUsd * priceRef.fxRate)} />
          </dl>
        </Section>
        <Section title={isAcceptance ? "Transaction value" : "Fiscal assessment"}>
          <dl>
            <Row label="Government reference value" value={formatNgnPrecise(v.referenceValueNgn)} strong />
            {isAcceptance && (
              <>
                <Row label={`Procurement coefficient`} value={`× ${v.procurementCoef}`} />
                <Row label="Purchase value" value={formatNgnPrecise(v.purchaseValueNgn)} strong />
                <Row label={`VAT ${v.vatPct}%`} value={formatNgnPrecise(v.vatNgn)} />
                <Row label="Total payable to seller" value={formatNgnPrecise(v.totalPayableNgn)} tone="green" />
              </>
            )}
            {!isAcceptance && <Row label="Procurement coefficient" value="Not applied — full reference value" tone="muted" />}
            <Row label={`Royalty assessed ${v.royaltyPct}%`} value={formatNgnPrecise(v.royaltyNgn)} />
            <Row
              label="Royalty payable at this event"
              value={isAcceptance ? `₦0.00 — liability transferred to ${counterparty?.legalName}` : formatNgnPrecise(v.royaltyAtTransferNgn)}
              tone={isAcceptance ? "green" : "red"}
            />
            {!isAcceptance && <Row label="VAT" value="Export zero-rated" tone="muted" />}
            {acceptance && (
              <>
                <Row label="Payment" value={acceptance.paymentStatus === "paid" ? `Received ${formatDateTime(acceptance.paidAt!)}` : `Due by ${formatDateTime(acceptance.deadlineAt)}`} />
                <Row label="Collection" value={acceptance.collectionStatus === "collected" ? `Collected ${formatDateTime(acceptance.collectedAt!)}` : "Pending"} />
              </>
            )}
          </dl>
        </Section>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_9rem]">
        <Section title="Certificate history">
          <ol className="text-[13px]">
            {history.map((h, i) => (
              <li key={i} className="flex gap-3 py-1">
                <span className="w-32 shrink-0 tabular-nums text-[var(--ink)]/60">{formatDateTime(h.at)}</span>
                <span className="font-semibold">{CERT_STATUS_LABEL[h.status]}</span>
                <span className="text-[var(--ink)]/70">{h.note}</span>
              </li>
            ))}
          </ol>
        </Section>
        <Section title="Verify">
          <div className="h-32 w-32 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <p className="mt-2 break-all text-[10px] leading-snug text-[var(--ink)]/70">{verifyUrl(c.certNo)}</p>
        </Section>
      </div>

      <footer className="mt-8 border-t border-[var(--ink)]/70 pt-3 text-[10px] leading-relaxed text-[var(--ink)]/65">
        <p>
          {isAcceptance
            ? "This certificate records a domestic acceptance under the Domestic Market Offer programme. It transfers the royalty liability on the contained metal to the accepting party and does not itself authorise export."
            : "This certificate confirms that the lot was offered to all qualified domestic participants for the statutory period without acceptance and may be presented to NESS / Nigeria Customs Service in support of export documentation. Royalty shown must be settled before clearance. It is not a Certificate of Origin, an NXP form or a permit."}
        </p>
        <p className="mt-1">
          Verification of authenticity is by the QR code or by certificate number at {verifyUrl("").replace("?no=", "")}. The NM-EX electronic record is authoritative; a printed copy has no standing if it differs. Issued electronically — no signature required.
        </p>
      </footer>
    </article>
  );
}
