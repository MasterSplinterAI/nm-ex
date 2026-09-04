import { revalidatePath } from "next/cache";
import { WorkflowError } from "./types";

export type ActionResult = { error?: string; ok?: string } | null;

/** Run a server-action body, mapping domain errors to a form-friendly result. */
export async function guarded(
  fn: () => Promise<string | void>,
  revalidate: string[] = ["/portal", "/verify", "/certificates"],
): Promise<ActionResult> {
  try {
    const ok = await fn();
    for (const path of revalidate) revalidatePath(path, "layout");
    return ok ? { ok } : { ok: "Done." };
  } catch (error) {
    if (error instanceof WorkflowError) return { error: error.message };
    if (error && typeof error === "object" && "digest" in error) throw error; // redirect()
    console.error(error);
    return { error: "Something went wrong. Try again or reset the scenario from the officer console." };
  }
}

export function num(formData: FormData, name: string, fallback?: number): number {
  const raw = String(formData.get(name) ?? "").replace(/,/g, "").trim();
  const value = Number.parseFloat(raw);
  if (Number.isFinite(value)) return value;
  if (fallback !== undefined) return fallback;
  throw new WorkflowError(`Enter a number for ${name.replace(/([A-Z])/g, " $1").toLowerCase()}.`);
}

export function str(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export function strList(formData: FormData, name: string): string[] {
  return formData.getAll(name).map((v) => String(v)).filter(Boolean);
}
