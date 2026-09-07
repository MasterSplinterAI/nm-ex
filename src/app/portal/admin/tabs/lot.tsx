import { Card, Row } from "@/components/portal/card";
import { LotStepper } from "@/components/portal/lot-stepper";
import { CertStatusPill, LotStatusPill } from "@/components/portal/status-pill";
import { formatDateTime, formatKg, formatNgn, formatPct } from "@/lib/format";
import { CERT_CLASS_LABEL, INSPECTION_STATUS_LABEL } from "@/lib/dmo/labels";
import { assaySteps, lotBundle, variance, VARIANCE_LIMIT_PCT } from "@/lib/dmo/lot-view";
import { auditFor, certificatesForLot, participantName } from "@/lib/dmo/queries";
import { supplierVocab } from "@/lib/dmo/supplier-vocab";
import type { DemoState } from "@/lib/dmo/types";

/** One lot, and every record that touches it. The officer's forward/back view. */
export function LotDossier({ state, lotId }: { state: DemoState; lotId: string }) {
  const bundle = lotBundle(state, lotId);
  if (!bundle) return <p className="text-sm text-[var(--ink-muted)]">No lot with that reference.</p>;

  const { lot, supplier, inspection, offer, acceptance, buyer, purchases, purchaseCostNgn } = bundle;
  const vocab = supplierVocab(supplier.category);
  const weight = variance(lot.declaredKg, lot.verifiedKg);
  const grade = variance(lot.declaredGradePct, lot.verifiedGradePct);
  const certs = certificatesForLot(state, lot.id);
  const audit = auditFor(state, lot.id);
  const ownerHref = `/portal/admin?tab=registrations&entity=${encodeURIComponent(supplier.id)}`;

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--ink-soft)]">
        <a href="/portal/admin?tab=reports" className="hover:underline">
          Register
        </a>{" "}
        › <a href={ownerHref} className="hover:underline">{supplier.legalName}</a> › {lot.id}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-[1.75rem]">{lot.id}</h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {lot.kind === "concentrate" ? "Tin (Sn) concentrate" : "Refined tin"} owned by{" "}
            <a href={ownerHref} className="font-semibold text-[#1f4b6b] hover:underline">
              {supplier.legalName}
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LotStatusPill status={lot.status} />
          <a
            href={`/portal/admin?trace=${encodeURIComponent(lot.id)}`}
            className="inline-flex h-9 items-center rounded-lg bg-[#1b4d38] px-3 text-sm font-semibold text-white hover:bg-[#163d2c]"
          >
            Trace to source
          </a>
          <a href="/portal/admin?tab=reports" className="text-sm font-semibold text-[var(--forest)] hover:underline">
            Back
          </a>
        </div>
      </div>

      <LotStepper steps={assaySteps(bundle)} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card icon="beaker" title="Assay against declaration">
          <div className="px-4 py-1">
            <Row label="Declared weight" value={formatKg(lot.declaredKg)} />
            <Row label="NM-EX verified weight" value={lot.verifiedKg == null ? "Not assayed" : formatKg(lot.verifiedKg)} />
            <Row
              label="Weight variance"
              value={weight.pct == null ? "—" : `${weight.pct > 0 ? "+" : ""}${formatPct(weight.pct, 2)} (limit ±${VARIANCE_LIMIT_PCT}%)`}
            />
            <Row label="Declared grade" value={formatPct(lot.declaredGradePct, 2)} />
            <Row label="NM-EX verified grade" value={lot.verifiedGradePct == null ? "Not assayed" : formatPct(lot.verifiedGradePct, 4)} />
            <Row
              label="Grade variance"
              value={grade.pct == null ? "—" : `${grade.pct > 0 ? "+" : ""}${formatPct(grade.pct, 2)} (limit ±${VARIANCE_LIMIT_PCT}%)`}
            />
          </div>
        </Card>

        <Card icon="inventory" title="Custody">
          <div className="px-4 py-1">
            <Row label="Inspection" value={inspection ? INSPECTION_STATUS_LABEL[inspection.status] : "Not submitted"} />
            <Row label="Warehouse" value={inspection?.warehouse ?? "—"} />
            <Row label="Sample due by" value={inspection ? formatDateTime(inspection.windowEndsAt) : "—"} />
            <Row label="Assay locked" value={lot.verifiedAt ? formatDateTime(lot.verifiedAt) : "—"} />
            <Row label="Locked by" value={participantName(state, lot.verifiedBy)} />
          </div>
        </Card>

        <Card icon="pool" title="Offer & sale">
          <div className="px-4 py-1">
            <Row label="Offer" value={offer ? `${offer.status} · to ${offer.audience}` : "Never offered"} />
            <Row label="Opened" value={offer ? formatDateTime(offer.opensAt) : "—"} />
            <Row label="Closes" value={offer ? formatDateTime(offer.closesAt) : "—"} />
            <Row label="Buyer" value={buyer?.legalName ?? "—"} />
            <Row label="Payable" value={acceptance ? formatNgn(acceptance.valuation.totalPayableNgn) : "—"} />
            <Row
              label="Settlement"
              value={
                acceptance
                  ? acceptance.collectionStatus === "collected"
                    ? "Collected"
                    : acceptance.paymentStatus === "paid"
                      ? "Paid, awaiting collection"
                      : "Awaiting payment"
                  : "—"
              }
            />
          </div>
        </Card>
      </div>

      {purchases.length > 0 && (
        <Card icon="ledger" title={`${vocab.logTitle} locked into this lot (${purchases.length})`}>
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="py-2">Purchase ID</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">{vocab.sourceColumn}</th>
                  <th className="py-2">Their reference</th>
                  <th className="py-2 text-right">Weight</th>
                  <th className="py-2 text-right">Grade</th>
                  <th className="py-2 text-right">{vocab.costColumn}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]">
                {purchases.map((p) => (
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
                  <td className="py-2.5 text-right tabular-nums">{formatNgn(purchaseCostNgn)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card icon="cert" title={`Certificates (${certs.length})`}>
          {certs.length === 0 ? (
            <p className="p-4 text-sm text-[var(--ink-muted)]">No certificate has issued against this lot.</p>
          ) : (
            <ul className="px-4 py-1">
              {certs.map((c) => (
                <li key={c.certNo} className="data-row">
                  <span className="data-label">
                    <a href={`/certificates/${c.certNo}`} className="tabular-nums font-semibold text-[#1f4b6b] hover:underline">
                      {c.certNo}
                    </a>
                    <span className="block text-xs text-[var(--ink-soft)]">{CERT_CLASS_LABEL[c.cls]}</span>
                  </span>
                  <CertStatusPill status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card icon="audit" title={`Audit trail (${audit.length})`}>
          <div className="max-h-80 overflow-y-auto px-4 py-1">
            {audit.length === 0 ? (
              <p className="py-3 text-sm text-[var(--ink-muted)]">Nothing recorded.</p>
            ) : (
              audit
                .slice()
                .reverse()
                .map((e) => (
                  <div key={e.id} className="border-b border-[var(--rule)] py-2 last:border-b-0">
                    <p className="text-sm font-medium">{e.action}</p>
                    <p className="text-xs text-[var(--ink-soft)]">
                      {formatDateTime(e.at)} · {e.actorLabel}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{e.detail}</p>
                  </div>
                ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}


