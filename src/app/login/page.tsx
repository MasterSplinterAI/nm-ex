import { redirect } from "next/navigation";
import { PublicShell } from "@/components/portal/public-shell";
import { readState } from "@/lib/dmo/store";
import { demoPassword, getSession, roleHome } from "@/lib/dmo/session";
import { LoginCards } from "./login-cards";

export const dynamic = "force-dynamic";

const ORDER = ["supplier", "smelter", "buyer", "officer", "verifier"] as const;

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(roleHome(session.role));

  const state = await readState();
  const participants = [...state.participants].sort(
    (a, b) =>
      ORDER.indexOf(a.role) - ORDER.indexOf(b.role) ||
      Number(b.status === "approved") - Number(a.status === "approved"),
  );
  const oneClick = process.env.DEMO_ONE_CLICK === "false" ? null : demoPassword();

  return (
    <PublicShell title="Sign in" lede="NM-EX participant portal. Suppliers, smelters, domestic buyers, NM-EX officers and appointed verifiers.">
      <LoginCards participants={participants} oneClickPassword={oneClick} />
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
