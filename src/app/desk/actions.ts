"use server";

import { redirect } from "next/navigation";
import {
  clearDeskSession,
  setDeskSession,
  verifyDeskPassword,
} from "@/lib/desk-auth";

export async function loginDesk(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const password = String(formData.get("password") ?? "");
  if (!verifyDeskPassword(password)) {
    return { error: "That password is not recognised." };
  }
  await setDeskSession();
  redirect("/desk");
}

export async function logoutDesk(): Promise<void> {
  await clearDeskSession();
  redirect("/desk/login");
}
