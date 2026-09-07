import { formatPct } from "@/lib/format";
import type { DmoPolicy } from "@/lib/dmo/types";

/**
 * The coefficient ladder. Every view on this page sits at one rung of it, so
 * officials can see who is guaranteed what before they open a single dashboard.
 */
export function PriceLadder({ policy }: { policy: DmoPolicy }) {
  const minerPct = policy.coefMinerToAggregator * 100;
  const shedPct = policy.coefToSmelter * 100;
  const spread = Number((shedPct - minerPct).toFixed(2));

  const rungs = [
    {
      who: "Miner",
      pct: formatPct(minerPct, 1),
      of: "of the LME metal value",
      note: `A registered miner is guaranteed this floor when selling to a tin shed. NM-EX locks it — the shed cannot bid below it.`,
    },
    {
      who: "Tin shed",
      pct: formatPct(shedPct, 1),
      of: "of the LME metal value",
      note: `The shed buys at ${formatPct(minerPct, 1)} and sells into the National Pool at ${formatPct(shedPct, 1)}. That ${formatPct(spread, 1)} spread is its locked margin.`,
    },
    {
      who: "Smelter",
      pct: formatPct(shedPct, 1),
      of: `plus ${formatPct(policy.vatPct, 1)} VAT`,
      note: `Pays the listing price. The ${formatPct(policy.royaltyPct, 1)} royalty transfers to the smelter at ₦0 on acceptance.`,
    },
  ];

  return (
    <section className="portal-card overflow-hidden">
      <div className="card-head">
        <h2 className="card-title">How the price is set at every step</h2>
        <span className="text-xs text-[var(--ink-soft)]">Coefficients fixed by NM-EX policy</span>
      </div>
      <div className="grid gap-0 sm:grid-cols-3">
        {rungs.map((rung, i) => (
          <div
            key={rung.who}
            className="border-b border-[var(--rule)] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
          >
            <div className="flex items-baseline gap-2">
              <span className="eyebrow">
                {i + 1}. {rung.who}
              </span>
            </div>
            <p className="font-display mt-1 text-2xl tabular-nums text-[#1b4d38]">{rung.pct}</p>
            <p className="text-xs text-[var(--ink-soft)]">{rung.of}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{rung.note}</p>
          </div>
        ))}
      </div>
      <p className="border-t border-[var(--line-strong)] bg-[var(--copper)]/[0.08] px-4 py-3 text-sm leading-relaxed text-[var(--ink-muted)]">
        <strong className="font-semibold text-[var(--ink)]">Why registration matters.</strong> An unregistered miner may still sell
        to a tin shed, but nothing guarantees the {formatPct(minerPct, 1)} floor — that price is only enforceable for a registered
        miner. Registration is what turns a quoted coefficient into a guaranteed one.
      </p>
    </section>
  );
}
