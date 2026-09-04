import { Panel } from "@/components/portal/panel";
import { Pipeline } from "@/components/portal/pipeline";
import { formatKg, formatMt, formatNgn } from "@/lib/format";
import { CATEGORY_LABEL, ROLE_LABEL } from "@/lib/dmo/labels";
import { certificateTally, containedTinMt, nationalPipeline, royaltyByHolder } from "@/lib/dmo/reports";
import type { DemoState } from "@/lib/dmo/types";

export function ReportsTab({ state }: { state: DemoState }) {
  const pipe = nationalPipeline(state);
  const mass = containedTinMt(state);
  const royalty = royaltyByHolder(state);
  const tally = certificateTally(state);
  const participants = state.participants.filter((p) => p.role !== "officer" && p.role !== "verifier");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--forest)]">National report</p>
        <h1 className="font-display mt-1 text-2xl tracking-tight sm:text-3xl">Tin traceability</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">
          Contained-metal mass balance for the demonstration register. Expand a section for the underlying holders, lots and certificates.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border border-[var(--line)] bg-white/80 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Still in Nigeria</p>
          <p className="font-display mt-1 text-3xl tabular-nums">{formatMt(mass.inSystem * 1000)}</p>
          <p className="text-xs text-[var(--ink-muted)]">Contained tin across ledgers, pool, plant and unused clearances.</p>
        </div>
        <div className="border border-[var(--line)] bg-white/80 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Exported (utilized)</p>
          <p className="font-display mt-1 text-3xl tabular-nums">{formatMt(mass.exported * 1000)}</p>
          <p className="text-xs text-[var(--ink-muted)]">Certificates marked utilized by NESS / Customs. Cannot be re-used.</p>
        </div>
        <div className="border border-[var(--line)] bg-white/80 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Sold to domestic industry</p>
          <p className="font-display mt-1 text-3xl tabular-nums">{formatMt(mass.domestic * 1000)}</p>
          <p className="text-xs text-[var(--ink-muted)]">Refined metal accepted by a Nigerian end user.</p>
        </div>
      </div>

      <Panel kicker="Physical flow" title="Where every kilogram sits">
        <Pipeline stages={pipe} />
      </Panel>

      <details className="border border-[var(--line)] bg-white/80 p-5" open>
        <summary className="cursor-pointer font-display text-xl text-[var(--ink)]">Royalty ledger by liability holder</summary>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          On a DMO-A the royalty moves to the smelter at ₦0. On a DMO-EC / DMO-ER it is due from the exporter before clearance. Cancelled
          certificates are excluded.
        </p>
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            <tr>
              <th className="pb-2 font-semibold">Holder</th>
              <th className="pb-2 font-semibold">Kind</th>
              <th className="pb-2 text-right font-semibold">Certificates</th>
              <th className="pb-2 text-right font-semibold">Royalty assessed</th>
              <th className="pb-2 text-right font-semibold">Due at this event</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {royalty.map((r) => (
              <tr key={r.holderId}>
                <td className="py-2">{r.holder}</td>
                <td className="py-2 text-[var(--ink-muted)]">{r.kind === "smelter" ? "Held at smelter" : "Due from exporter"}</td>
                <td className="py-2 text-right tabular-nums">{r.certs}</td>
                <td className="py-2 text-right tabular-nums">{formatNgn(r.royaltyNgn)}</td>
                <td className="py-2 text-right tabular-nums">{formatNgn(r.atTransferNgn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <details className="border border-[var(--line)] bg-white/80 p-5">
        <summary className="cursor-pointer font-display text-xl text-[var(--ink)]">Certificate register — {tally.total} issued</summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {Object.entries(tally.byClass).map(([cls, n]) => (
            <div key={cls} className="border border-[var(--line)] p-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">{cls}</p>
              <p className="font-display text-2xl tabular-nums">{n}</p>
            </div>
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--ink-muted)]">
          {Object.entries(tally.byStatus).map(([status, n]) => (
            <li key={status}>
              {status}: <span className="tabular-nums text-[var(--ink)]">{n}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          <a href="/portal/admin?tab=certificates" className="font-semibold underline underline-offset-4">
            Open the working register
          </a>
        </p>
      </details>

      <details className="border border-[var(--line)] bg-white/80 p-5">
        <summary className="cursor-pointer font-display text-xl text-[var(--ink)]">Lots on the register — {state.lots.length}</summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              <tr>
                <th className="pb-2 font-semibold">Lot</th>
                <th className="pb-2 font-semibold">Kind</th>
                <th className="pb-2 font-semibold">Owner</th>
                <th className="pb-2 text-right font-semibold">Weight</th>
                <th className="pb-2 text-right font-semibold">Contained Sn</th>
                <th className="pb-2 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {[...state.lots]
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((l) => {
                  const owner = state.participants.find((p) => p.id === l.ownerId);
                  const kg = l.verifiedKg ?? l.declaredKg;
                  const grade = l.verifiedGradePct ?? l.declaredGradePct;
                  return (
                    <tr key={l.id}>
                      <td className="py-2 tabular-nums">{l.id}</td>
                      <td className="py-2 text-[var(--ink-muted)]">{l.kind}</td>
                      <td className="py-2">{owner?.legalName ?? "—"}</td>
                      <td className="py-2 text-right tabular-nums">{formatKg(kg)}</td>
                      <td className="py-2 text-right tabular-nums">{formatKg(kg * (grade / 100))}</td>
                      <td className="py-2 text-right text-xs uppercase tracking-wide text-[var(--ink-muted)]">{l.status.replaceAll("_", " ")}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </details>

      <details className="border border-[var(--line)] bg-white/80 p-5">
        <summary className="cursor-pointer font-display text-xl text-[var(--ink)]">Registered participants — {participants.length}</summary>
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            <tr>
              <th className="pb-2 font-semibold">Registration</th>
              <th className="pb-2 font-semibold">Name</th>
              <th className="pb-2 font-semibold">Type</th>
              <th className="pb-2 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {participants.map((p) => (
              <tr key={p.id}>
                <td className="py-2 tabular-nums">{p.regNo ?? "—"}</td>
                <td className="py-2">{p.legalName}</td>
                <td className="py-2 text-[var(--ink-muted)]">{p.category ? CATEGORY_LABEL[p.category] : ROLE_LABEL[p.role]}</td>
                <td className="py-2 text-right uppercase tracking-wide text-xs">{p.status.replaceAll("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
