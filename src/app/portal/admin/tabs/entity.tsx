import { Card, Row } from "@/components/portal/card";
import { Empty } from "@/components/portal/empty";
import { CertStatusPill, LotStatusPill, ParticipantStatusPill } from "@/components/portal/status-pill";
import { formatDate, formatDateTime, formatKg, formatNgn, formatPct } from "@/lib/format";
import { CATEGORY_LABEL, CERT_CLASS_LABEL, INSPECTION_STATUS_LABEL, ROLE_LABEL } from "@/lib/dmo/labels";
import { participantDossier, participantName } from "@/lib/dmo/queries";
import { supplierVocab } from "@/lib/dmo/supplier-vocab";
import type { DemoState } from "@/lib/dmo/types";

/**
 * Everything the registry holds on one participant, on one page. Reached by
 * clicking any participant name in the officer console.
 */
export function EntityDossier({ state, entityId }: { state: DemoState; entityId: string }) {
  const d = participantDossier(state, entityId);
  if (!d) {
    return <p className="text-sm text-[var(--ink-muted)]">No participant with that reference.</p>;
  }
  const { participant: p } = d;
  const vocab = supplierVocab(p.category);
  const isSupplier = p.role === "supplier";
  const declaredKg = d.purchases.reduce((n, x) => n + x.kg, 0);
  const spendNgn = d.purchases.reduce((n, x) => n + x.valueNgn, 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--ink-soft)]">
        <a href="/portal/admin?tab=registrations" className="hover:underline">
          Registrations
        </a>{" "}
        › {p.legalName}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-[1.75rem]">{p.legalName}</h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {p.category ? CATEGORY_LABEL[p.category] : ROLE_LABEL[p.role]} · {p.regNo ?? "no registration number"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ParticipantStatusPill status={p.status} />
          <a href="/portal/admin?tab=registrations" className="text-sm font-semibold text-[var(--forest)] hover:underline">
            Back
          </a>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card icon="registrations" title="Registered particulars">
          <div className="px-4 py-1">
            <Row label="Reference" value={p.id} />
            <Row label="Address" value={p.address} />
            <Row label="Contact" value={p.contactName} />
            <Row label="Phone" value={p.phone} />
            <Row label="E-mail" value={p.email} />
            <Row label="Applied" value={formatDate(p.createdAt)} />
            <Row label="Officer note" value={p.reviewNote ?? "—"} />
          </div>
        </Card>

        <Card icon="doc" title="Documents on file">
          {p.documents.length === 0 ? (
            <p className="p-4 text-sm text-[var(--ink-muted)]">No documents uploaded.</p>
          ) : (
            <ul className="px-4 py-1">
              {p.documents.map((doc) => (
                <li key={doc.name} className="data-row">
                  <span className="data-label text-[var(--ink)]">{doc.name}</span>
                  <span className="text-xs text-[var(--ink-soft)]">{doc.type.split("/").pop()?.toUpperCase()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card icon="reports" title="Position in the registry">
          <div className="px-4 py-1">
            {isSupplier && <Row label={`${vocab.recordNoun} records`} value={String(d.purchases.length)} />}
            {isSupplier && <Row label="Declared weight logged" value={formatKg(declaredKg)} />}
            {isSupplier && <Row label={vocab.costColumn === "Cost" ? "Production cost" : "Amount paid to miners"} value={formatNgn(spendNgn)} />}
            <Row label="Lots owned" value={String(d.lots.length)} />
            <Row label="Lots sold" value={String(d.soldTo.length)} />
            <Row label="Lots bought" value={String(d.boughtLots.length)} />
            <Row label="Certificates naming them" value={String(d.certificates.length)} />
            <Row label="Audit events" value={String(d.audit.length)} />
          </div>
        </Card>
      </div>

      {d.lots.length > 0 && (
        <Card icon="lots" title={`Lots (${d.lots.length})`}>
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="py-2">Lot</th>
                  <th className="py-2">Kind</th>
                  <th className="py-2 text-right">Declared</th>
                  <th className="py-2 text-right">Verified</th>
                  <th className="py-2 text-right">Grade</th>
                  <th className="py-2">Parcels</th>
                  <th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]">
                {d.lots.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2 tabular-nums font-semibold">
                      <a href={`/portal/admin?lot=${encodeURIComponent(l.id)}`} className="text-[#1f4b6b] hover:underline">
                        {l.id}
                      </a>
                    </td>
                    <td className="py-2 text-[var(--ink-muted)]">{l.kind === "concentrate" ? "Concentrate" : "Refined"}</td>
                    <td className="py-2 text-right tabular-nums">{formatKg(l.declaredKg)}</td>
                    <td className="py-2 text-right tabular-nums">{l.verifiedKg == null ? "—" : formatKg(l.verifiedKg)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {l.verifiedGradePct == null ? formatPct(l.declaredGradePct, 2) : formatPct(l.verifiedGradePct, 2)}
                    </td>
                    <td className="py-2 tabular-nums text-[var(--ink-muted)]">{l.purchaseIds.length}</td>
                    <td className="py-2 text-right">
                      <LotStatusPill status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {isSupplier && d.purchases.length > 0 && (
        <Card icon="ledger" title={`${vocab.logTitle} (${d.purchases.length})`}>
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
                  <th className="py-2">Lot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]">
                {d.purchases.map((x) => (
                  <tr key={x.id}>
                    <td className="py-2 tabular-nums font-semibold">{x.id}</td>
                    <td className="py-2 tabular-nums">{x.date}</td>
                    <td className="py-2">{x.source}</td>
                    <td className="py-2 tabular-nums text-[var(--ink-muted)]">{x.reference || "—"}</td>
                    <td className="py-2 text-right tabular-nums">{formatKg(x.kg)}</td>
                    <td className="py-2 text-right tabular-nums">{formatPct(x.gradePct, 2)}</td>
                    <td className="py-2 text-right tabular-nums">{formatNgn(x.valueNgn)}</td>
                    <td className="py-2 tabular-nums">
                      {x.lotId ? (
                        <a href={`/portal/admin?lot=${encodeURIComponent(x.lotId)}`} className="font-semibold text-[#1f4b6b] hover:underline">
                          {x.lotId}
                        </a>
                      ) : (
                        <span className="text-xs text-[var(--ink-soft)]">Unallocated</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card icon="beaker" title={`Inspections (${d.inspections.length})`}>
          {d.inspections.length === 0 ? (
            <p className="p-4 text-sm text-[var(--ink-muted)]">No lots have been submitted for assay.</p>
          ) : (
            <ul className="px-4 py-1">
              {d.inspections.map((i) => (
                <li key={i.id} className="data-row">
                  <span className="data-label">
                    <a href={`/portal/admin?lot=${encodeURIComponent(i.lotId)}`} className="tabular-nums font-semibold text-[#1f4b6b] hover:underline">
                      {i.lotId}
                    </a>
                    <span className="block text-xs text-[var(--ink-soft)]">{i.warehouse}</span>
                  </span>
                  <span className="data-value text-xs">{INSPECTION_STATUS_LABEL[i.status]}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card icon="cert" title={`Certificates (${d.certificates.length})`}>
          {d.certificates.length === 0 ? (
            <p className="p-4 text-sm text-[var(--ink-muted)]">No certificate names this participant yet.</p>
          ) : (
            <ul className="px-4 py-1">
              {d.certificates.map((c) => (
                <li key={c.certNo} className="data-row">
                  <span className="data-label">
                    <a href={`/certificates/${c.certNo}`} className="tabular-nums font-semibold text-[#1f4b6b] hover:underline">
                      {c.certNo}
                    </a>
                    <span className="block text-xs text-[var(--ink-soft)]">
                      {CERT_CLASS_LABEL[c.cls]} ·{" "}
                      <a href={`/portal/admin?lot=${encodeURIComponent(c.lotId)}`} className="hover:underline">
                        {c.lotId}
                      </a>
                    </span>
                  </span>
                  <CertStatusPill status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {(d.soldTo.length > 0 || d.boughtLots.length > 0) && (
        <Card icon="chain" title="Counterparties">
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="py-2">Direction</th>
                  <th className="py-2">Lot</th>
                  <th className="py-2">Counterparty</th>
                  <th className="py-2">Certificate</th>
                  <th className="py-2 text-right">Payable</th>
                  <th className="py-2">Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]">
                {d.soldTo.map((a) => (
                  <tr key={`s-${a.id}`}>
                    <td className="py-2 font-semibold text-[#1b4d38]">Sold</td>
                    <td className="py-2 tabular-nums">
                      <a href={`/portal/admin?lot=${encodeURIComponent(a.lotId)}`} className="text-[#1f4b6b] hover:underline">
                        {a.lotId}
                      </a>
                    </td>
                    <td className="py-2">{participantName(state, a.acceptorId)}</td>
                    <td className="py-2 tabular-nums">
                      <a href={`/certificates/${a.certNo}`} className="text-[#1f4b6b] hover:underline">
                        {a.certNo}
                      </a>
                    </td>
                    <td className="py-2 text-right tabular-nums">{formatNgn(a.valuation.totalPayableNgn)}</td>
                    <td className="py-2 text-xs text-[var(--ink-muted)]">
                      {a.collectionStatus === "collected" ? "Collected" : a.paymentStatus === "paid" ? "Paid" : "Pending"}
                    </td>
                  </tr>
                ))}
                {d.boughtLots.map((a) => (
                  <tr key={`b-${a.id}`}>
                    <td className="py-2 font-semibold text-[#1f4b6b]">Bought</td>
                    <td className="py-2 tabular-nums">
                      <a href={`/portal/admin?lot=${encodeURIComponent(a.lotId)}`} className="text-[#1f4b6b] hover:underline">
                        {a.lotId}
                      </a>
                    </td>
                    <td className="py-2">{participantName(state, state.lots.find((l) => l.id === a.lotId)?.ownerId ?? null)}</td>
                    <td className="py-2 tabular-nums">
                      <a href={`/certificates/${a.certNo}`} className="text-[#1f4b6b] hover:underline">
                        {a.certNo}
                      </a>
                    </td>
                    <td className="py-2 text-right tabular-nums">{formatNgn(a.valuation.totalPayableNgn)}</td>
                    <td className="py-2 text-xs text-[var(--ink-muted)]">
                      {a.collectionStatus === "collected" ? "Collected" : a.paymentStatus === "paid" ? "Paid" : "Pending"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card icon="audit" title={`Audit trail (${d.audit.length})`}>
        {d.audit.length === 0 ? (
          <Empty>Nothing recorded against this participant.</Empty>
        ) : (
          <div className="max-h-[26rem] overflow-y-auto">
            <table className="data-table w-full text-sm">
              <thead className="table-head sticky top-0">
                <tr>
                  <th className="py-2">When</th>
                  <th className="py-2">Actor</th>
                  <th className="py-2">Action</th>
                  <th className="py-2">Subject</th>
                  <th className="py-2">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]">
                {d.audit.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 whitespace-nowrap tabular-nums text-[var(--ink-muted)]">{formatDateTime(e.at)}</td>
                    <td className="py-2 whitespace-nowrap">{e.actorLabel}</td>
                    <td className="py-2 whitespace-nowrap font-medium">{e.action}</td>
                    <td className="py-2 whitespace-nowrap tabular-nums text-[var(--ink-muted)]">{e.subjectId}</td>
                    <td className="py-2 text-[var(--ink-muted)]">{e.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}


