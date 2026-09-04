import { redirect } from "next/navigation";
import { getSession, roleHome } from "@/lib/dmo/session";

export const dynamic = "force-dynamic";

export default async function PortalIndex() {
  const session = await getSession();
  redirect(session ? roleHome(session.role) : "/login");
}
