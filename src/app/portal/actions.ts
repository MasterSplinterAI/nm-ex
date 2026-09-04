"use server";

import { redirect } from "next/navigation";
import { clearSession } from "@/lib/dmo/session";

export async function logout(): Promise<void> {
  await clearSession();
  redirect("/login");
}
