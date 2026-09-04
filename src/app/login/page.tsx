import { redirect } from "next/navigation";
import { PublicShell } from "@/components/portal/public-shell";
import { readState } from "@/lib/dmo/store";
import { demoPassword, getSession, roleHome } from "@/lib/dmo/session";
import { LoginCards } from "./login-cards";

export const dynamic = "force-dynamic";

const ORDER = ["supplier", "smelter", "buyer", "officer", "verifier"] as const;

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
      Number(b.status === "approved") - Number(a.status === "approved"),
  );
  const oneClick = process.env.DEMO_ONE_CLICK === "false" ? null : demoPassword();

  return (
    <PublicShell
      title="Choose a port"
      lede="Each card is a login into a different view of the national tin registry. A tin shed never sees a smelter’s plant; a NESS officer verifies a certificate without the commercial ledger."
    >
      <LoginCards participants={participants} oneClickPassword={oneClick} next={safeNext} />
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
