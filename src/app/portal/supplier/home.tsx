import { DashCard } from "@/components/portal/dash-card";
import { formatKg } from "@/lib/format";
import { mmlKgForTier } from "@/lib/dmo/policy";
import { certificatesFor, inventoryFor, lotsFor } from "@/lib/dmo/queries";
import type { DemoState, Participant } from "@/lib/dmo/types";

export function SupplierHome({ state, me }: { state: DemoState; me: Participant }) {
  const inv = inventoryFor(state, me.id);
  const lots = lotsFor(state, me.id);
  const certs = certificatesFor(state, me.id);
  const mml1 = mmlKgForTier(1, state.policy);
  const mml2 = mmlKgForTier(2, state.policy);
  const short1 = Math.max(0, mml1 - inv.tier1Kg);
  const active = lots.filter((l) => !["utilized", "sold_domestic", "smelted", "aggregated", "collected"].includes(l.status)).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--forest)]">Supplier · tin shed / aggregator</p>
        <h1 className="font-display mt-1 text-2xl tracking-tight sm:text-3xl">{me.legalName}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">
          Registration {me.regNo}. Log every parcel. When eligible inventory reaches the minimum marketable lot, submit it for NM-EX
          verification and it enters the National Pool.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <DashCard
          href="/portal/supplier?tab=ledger"
          kicker="Ledger"
          title="Tier 1 inventory"
          value={formatKg(inv.tier1Kg)}
          hint={short1 > 0 ? `${formatKg(short1)} more to reach the ${formatKg(mml1)} MML.` : `MML reached. Submit ${formatKg(inv.tier1Kg)} for inspection.`}
          tone={short1 > 0 ? "warn" : "ok"}
        />
        <DashCard
          href="/portal/supplier?tab=ledger"
          kicker="Ledger"
          title="Tier 2 inventory"
          value={formatKg(inv.tier2Kg)}
          hint={`${formatKg(mml2)} MML for grade at or below ${state.policy.tier1MinGradePct}% Sn.`}
        />
        <DashCard href="/portal/supplier?tab=lots" kicker="Lots" title="Lots in flight" value={active} hint={`${lots.length} lots ever submitted. Track sample window, offer and certificate.`} />
        <DashCard href="/portal/supplier?tab=certificates" kicker="Register" title="Certificates" value={certs.length} hint="Acceptance and export-clearance certificates naming this shed." />
        <DashCard href="/portal/supplier?tab=ledger" kicker="Action" title="Log a purchase" hint="20 kg, 50 kg, 100 kg — each parcel stays a separate ledger line." />
        <DashCard href="/verify" kicker="Public" title="Verify a certificate" hint="Anyone can confirm a printed DMO document against the live record." />
      </div>
    </div>
  );
}
