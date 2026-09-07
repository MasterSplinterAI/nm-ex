import { redirect } from "next/navigation";
import { PublicShell } from "@/components/portal/public-shell";
import { readState } from "@/lib/dmo/store";
import { demoPassword, getSession, roleHome } from "@/lib/dmo/session";
import { LoginCards } from "./login-cards";
import { PriceLadder } from "./price-ladder";

export const dynamic = "force-dynamic";

/** Walkthrough order: tin moves supplier → smelter → buyer, then the registry side. */
const ORDER = ["supplier", "smelter", "buyer", "officer", "verifier"] as const;

/** Within suppliers, the producer comes before the shed that buys from it. */
const CATEGORY_ORDER = ["mining_company", "tin_shed", "aggregator"] as const;

function categoryRank(category: string | null): number {
  const i = CATEGORY_ORDER.indexOf(category as (typeof CATEGORY_ORDER)[number]);
  return i === -1 ? CATEGORY_ORDER.length : i;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await getSession();
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : null;
  if (session && !safeNext) redirect(roleHome(session.role));
  if (session && safeNext) redirect(safeNext);

  const state = await readState();
  const participants = [...state.participants].sort(
    (a, b) =>
      ORDER.indexOf(a.role) - ORDER.indexOf(b.role) ||
      categoryRank(a.category) - categoryRank(b.category) ||
      Number(b.status === "approved") - Number(a.status === "approved"),
  );
  const oneClick = process.env.DEMO_ONE_CLICK === "false" ? null : demoPassword();

  return (
    <PublicShell
      wide
      title="Choose a view"
      lede="One registry, seen through the eyes of each party to the trade. Open them in order to follow a single lot of tin from the miner who dug it to the certificate that clears it for export. A tin shed never sees a smelter’s plant; a verifier checks a certificate without ever seeing the commercial ledger."
    >
      <div className="space-y-8">
        <PriceLadder policy={state.policy} />
        <LoginCards
          participants={participants}
          oneClickPassword={oneClick}
          next={safeNext}
          coefMinerPct={state.policy.coefMinerToAggregator * 100}
          coefShedPct={state.policy.coefToSmelter * 100}
          vatPct={state.policy.vatPct}
        />
      </div>
      <p className="mt-10 text-sm text-[var(--ink-muted)]">
        Not registered?{" "}
        <a href="/register" className="font-semibold text-[var(--ink)] underline underline-offset-4">
          Apply to join NM-EX
        </a>
        .
      </p>
    </PublicShell>
  );
}
