import { Card, Note, Row } from "@/components/portal/card";
import { CertStatusPill, LotStatusPill } from "@/components/portal/status-pill";
import { formatDate, formatKg, formatNgn, formatPct } from "@/lib/format";
import { CERT_CLASS_LABEL } from "@/lib/dmo/labels";
import { provenanceTree, type OriginLot } from "@/lib/dmo/provenance";
import { supplierVocab } from "@/lib/dmo/supplier-vocab";
import type { DemoState } from "@/lib/dmo/types";

/**
 * The whole chain on one page: from an export clearance back through smelting,
 * aggregation and each concentrate lot, down to the pits the ore came out of.
 */
export function ProvenanceView({ state, reference }: { state: DemoState; reference: string }) {
  const tree = provenanceTree(state, reference);
  if (!tree) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl">Trace</h1>
        <p className="text-sm text-[var(--ink-muted)]">
          Nothing on the register matches <span className="tabular-nums font-semibold">{reference}</span>. Enter a
          certificate number or a lot number.
        </p>
      </div>
    );
  }

  const { certificate, lot, campaign, smelter, parents, origins, sources, massBalance: mb } = tree;
  const refined = lot.kind === "refined";
  const loss = mb.inputContainedKg != null && mb.recoveredKg != null ? mb.inputContainedKg - mb.recoveredKg : null;

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--ink-soft)]">
        <a href="/portal/admin?tab=certificates" className="hover:underline">
          Certificates
        </a>{" "}
        › Trace
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-[1.75rem]">
            {certificate ? certificate.certNo : lot.id}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">
            {certificate ? `${CERT_CLASS_LABEL[certificate.cls]} — ` : ""}
            every step this metal passed through, back to the source.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {certificate && <CertStatusPill status={certificate.status} />}
          <a href="/portal/admin?tab=certificates" className="text-sm font-semibold text-[var(--forest)] hover:underline">
            Back
          </a>
        </div>
      </div>

      <Note tone="ok" title="Reading the chain.">
        Each block below sits one step further back in the supply chain. Contained tin is carried at every hop, so the
        weights must reconcile from the pit to the ingot — anything that does not add up is visible here.
      </Note>

      {/* Mass balance across the whole chain. */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Declared at purchase" value={formatKg(mb.declaredContainedKg)} hint="Contained Sn, supplier's figures" />
        <Stat label="Verified by NM-EX" value={formatKg(mb.verifiedContainedKg)} hint="Contained Sn after assay" tone="ok" />
        <Stat
          label="Charged to the furnace"
          value={mb.inputContainedKg == null ? "—" : formatKg(mb.inputContainedKg)}
          hint={refined ? "Contained Sn into the campaign" : "Not smelted"}
        />
        <Stat
          label="Recovered as metal"
          value={mb.recoveredKg == null ? "—" : formatKg(mb.recoveredKg)}
          hint={mb.recoveryPct == null ? "Not smelted" : `${mb.recoveryPct}% recovery · ${formatKg(loss ?? 0)} to slag`}
          tone={mb.recoveredKg == null ? undefined : "ok"}
        />
      </div>

      {/* Step 1 — the metal the certificate was issued against. */}
      <Step n={1} title={refined ? "Refined metal on the clearance" : "Concentrate on the certificate"}>
        <Card icon="refined" title={lot.id} action={<LotStatusPill status={lot.status} />}>
          <div className="px-4 py-1">
            <Row label="Commodity" value={refined ? "Refined tin / ingot" : "Tin (Sn) concentrate"} />
            <Row label="Weight" value={formatKg(lot.verifiedKg ?? lot.declaredKg)} />
            <Row label="Purity / grade" value={formatPct(lot.verifiedGradePct ?? lot.declaredGradePct, 2)} />
            {certificate && <Row label="Issued" value={formatDate(certificate.issuedAt)} />}
            {smelter && (
              <Row
                label="Produced by"
                value={
                  <a
                    href={`/portal/admin?tab=registrations&entity=${encodeURIComponent(smelter.id)}`}
                    className="text-[#1f4b6b] hover:underline"
                  >
                    {smelter.legalName}
                  </a>
                }
              />
            )}
          </div>
        </Card>
      </Step>

      {/* Step 2 — the campaign, only when metal was smelted. */}
      {campaign && (
        <Step n={2} title="Smelting campaign that produced it">
          <Card icon="plant" title={campaign.id}>
            <div className="px-4 py-1">
              <Row label="Contained tin charged" value={formatKg(campaign.inputContainedKg)} />
              <Row label="Refined tin recovered" value={formatKg(campaign.recoveredKg)} />
              <Row label="Recovery" value={`${campaign.recoveryPct}%`} />
              <Row label="Parent lots consumed" value={campaign.parentLotIds.join(", ")} />
              <Row label="Smelted" value={formatDate(campaign.createdAt)} />
            </div>
          </Card>
        </Step>
      )}

      {/* Step 3 — aggregation. */}
      {parents.length > 0 && (
        <Step n={campaign ? 3 : 2} title={`Parent lots aggregated by the smelter (${parents.length})`}>
          <div className="grid gap-3 lg:grid-cols-2">
            {parents.map((p) => (
              <Card key={p.parentLot.id} icon="inventory" title={p.parentLot.id}>
                <div className="px-4 py-1">
                  <Row label="Child lots" value={String(p.parentLot.childLotIds.length)} />
                  <Row label="Total weight" value={formatKg(p.parentLot.totalKg)} />
                  <Row label="Contained tin" value={formatKg(p.containedKg)} />
                  <Row label="Weighted grade" value={formatPct(p.parentLot.avgGradePct, 2)} />
                </div>
              </Card>
            ))}
          </div>
        </Step>
      )}

      {/* Step 4 — the concentrate lots that were bought. */}
      <Step
        n={campaign ? 4 : parents.length > 0 ? 3 : 2}
        title={`Concentrate lots at the base of the chain (${origins.length})`}
      >
        <div className="space-y-3">
          {origins.map((origin) => (
            <OriginCard key={origin.lot.id} origin={origin} />
          ))}
        </div>
      </Step>

      {/* Step 5 — the ground. */}
      <Step n={campaign ? 5 : parents.length > 0 ? 4 : 3} title={`Source pits and cooperatives (${sources.length})`}>
        <Card icon="chain" title="Where the ore came out of the ground">
          <div className="overflow-x-auto">
            <table className="data-table w-full text-[13px]">
              <thead className="table-head">
                <tr>
                  <th className="py-2">Source</th>
                  <th className="py-2">Sold or raised by</th>
                  <th className="py-2 text-right">Parcels</th>
                  <th className="py-2 text-right">Weight</th>
                  <th className="py-2 text-right">Contained Sn</th>
                  <th className="py-2 text-right">Paid at source</th>
                  <th className="py-2 text-right">Share of chain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]">
                {sources.map((src) => (
                  <tr key={`${src.ownerId}-${src.source}`} className="hover:bg-[#1b4d38]/[0.04]">
                    <td className="py-2 font-semibold">{src.source}</td>
                    <td className="py-2">
                      <a
                        href={`/portal/admin?tab=registrations&entity=${encodeURIComponent(src.ownerId)}`}
                        className="text-[#1f4b6b] hover:underline"
                      >
                        {src.owner}
                      </a>
                    </td>
                    <td className="py-2 text-right tabular-nums">{src.parcels}</td>
                    <td className="py-2 text-right tabular-nums">{formatKg(src.kg)}</td>
                    <td className="py-2 text-right tabular-nums font-semibold">{formatKg(src.containedKg)}</td>
                    <td className="py-2 text-right tabular-nums">{formatNgn(src.valueNgn)}</td>
                    <td className="py-2 text-right tabular-nums text-[var(--ink-muted)]">
                      {mb.declaredContainedKg > 0 ? formatPct((src.containedKg / mb.declaredContainedKg) * 100, 1) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--line-strong)] bg-[#f4f7f5] font-bold">
                  <td className="py-2.5" colSpan={2}>
                    Total from source
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{sources.reduce((n, s) => n + s.parcels, 0)}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatKg(sources.reduce((n, s) => n + s.kg, 0))}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatKg(mb.declaredContainedKg)}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatNgn(sources.reduce((n, s) => n + s.valueNgn, 0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </Step>
    </div>
  );
}

/** A numbered rung of the chain. */
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2.5">
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1b4d38] text-xs font-bold text-white">
          {n}
        </span>
        <h2 className="font-display text-lg">{title}</h2>
      </div>
      <div className="border-l-2 border-[var(--line-strong)] pl-4">{children}</div>
    </section>
  );
}

/** One concentrate lot, with its parcels behind an accordion. */
function OriginCard({ origin }: { origin: OriginLot }) {
  const vocab = supplierVocab(origin.owner.category);
  const variancePct =
    origin.declaredParcelKg > 0 ? ((origin.kg - origin.declaredParcelKg) / origin.declaredParcelKg) * 100 : null;

  return (
    <Card
      icon="lots"
      title={origin.lot.id}
      action={
        <a
          href={`/portal/admin?lot=${encodeURIComponent(origin.lot.id)}`}
          className="text-sm font-semibold text-[var(--forest)] hover:underline"
        >
          Open lot
        </a>
      }
    >
      <div className="grid gap-0 md:grid-cols-2">
        <div className="border-b border-[var(--rule)] px-4 py-1 md:border-b-0 md:border-r">
          <Row
            label="Supplied by"
            value={
              <a
                href={`/portal/admin?tab=registrations&entity=${encodeURIComponent(origin.owner.id)}`}
                className="text-[#1f4b6b] hover:underline"
              >
                {origin.owner.legalName}
              </a>
            }
          />
          <Row label="Verified weight" value={formatKg(origin.kg)} />
          <Row label="Verified grade" value={formatPct(origin.gradePct, 4)} />
          <Row label="Contained tin" value={formatKg(origin.containedKg)} />
          <Row
            label="Against declaration"
            value={variancePct == null ? "—" : `${variancePct > 0 ? "+" : ""}${formatPct(variancePct, 2)}`}
          />
        </div>
        <div className="px-4 py-1">
          {origin.dmoA ? (
            <>
              <Row
                label="Bought under"
                value={
                  <a href={`/certificates/${origin.dmoA.certNo}`} className="text-[#1f4b6b] hover:underline">
                    {origin.dmoA.certNo}
                  </a>
                }
              />
              <Row label="Buyer" value={origin.buyer?.legalName ?? "—"} />
              <Row label="Accepted" value={formatDate(origin.acceptance!.acceptedAt)} />
              <Row label="Royalty moved with it" value={formatNgn(origin.dmoA.valuation.royaltyNgn)} />
              <Row
                label="Royalty received"
                value={
                  origin.dmoA.royaltySettlement
                    ? `Yes — ${formatDate(origin.dmoA.royaltySettlement.at)}`
                    : "Not yet"
                }
              />
            </>
          ) : (
            <Row label="Sale" value="Not sold domestically" />
          )}
        </div>
      </div>

      <details className="border-t border-[var(--line-strong)]">
        <summary className="cursor-pointer bg-[#f4f7f5] px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[#eef2ef]">
          {origin.parcels.length} {vocab.recordNoun}
          {origin.parcels.length === 1 ? "" : "s"} inside this lot — {formatKg(origin.declaredParcelKg)} declared
        </summary>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-[13px]">
            <thead className="table-head">
              <tr>
                <th className="py-2">Purchase ID</th>
                <th className="py-2">Date</th>
                <th className="py-2">{vocab.sourceColumn}</th>
                <th className="py-2">Their reference</th>
                <th className="py-2 text-right">Weight</th>
                <th className="py-2 text-right">Grade</th>
                <th className="py-2 text-right">Contained Sn</th>
                <th className="py-2 text-right">{vocab.costColumn}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule)]">
              {origin.parcels.map(({ purchase, containedKg }) => (
                <tr key={purchase.id}>
                  <td className="py-2 tabular-nums font-semibold">{purchase.id}</td>
                  <td className="py-2 tabular-nums">{purchase.date}</td>
                  <td className="py-2">{purchase.source}</td>
                  <td className="py-2 tabular-nums text-[var(--ink-muted)]">{purchase.reference || "—"}</td>
                  <td className="py-2 text-right tabular-nums">{formatKg(purchase.kg)}</td>
                  <td className="py-2 text-right tabular-nums">{formatPct(purchase.gradePct, 2)}</td>
                  <td className="py-2 text-right tabular-nums">{formatKg(containedKg)}</td>
                  <td className="py-2 text-right tabular-nums">{formatNgn(purchase.valueNgn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </Card>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "ok" }) {
  return (
    <div className="portal-card p-4">
      <p className="eyebrow">{label}</p>
      <p className={`font-display mt-1 text-2xl tabular-nums ${tone === "ok" ? "text-[#1b4d38]" : ""}`}>{value}</p>
      {hint && <p className="text-xs text-[var(--ink-soft)]">{hint}</p>}
    </div>
  );
}
