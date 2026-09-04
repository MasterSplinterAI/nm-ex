"use server";

import { redirect } from "next/navigation";
import { guarded, str, type ActionResult } from "@/lib/dmo/action-utils";
import { CATEGORY_ROLE } from "@/lib/dmo/labels";
import { mutate } from "@/lib/dmo/store";
import { WorkflowError, type ParticipantCategory, type UploadedDoc } from "@/lib/dmo/types";
import { submitRegistration } from "@/lib/dmo/workflow";

const CATEGORIES: ParticipantCategory[] = ["tin_shed", "mining_company", "aggregator", "smelter", "end_user"];

export async function submitRegistrationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let newId = "";
  const result = await guarded(async () => {
    const category = str(formData, "category") as ParticipantCategory;
    if (!CATEGORIES.includes(category)) throw new WorkflowError("Choose a participant type.");
    const documents: UploadedDoc[] = formData
      .getAll("documents")
      .filter((f): f is File => f instanceof File && f.size > 0)
      .map((f) => ({ name: f.name, type: f.type || "application/octet-stream" }));
    const participant = await mutate("anon", (state, ctx) =>
      submitRegistration(state, ctx, {
        role: CATEGORY_ROLE[category],
        category,
        legalName: str(formData, "legalName"),
        address: str(formData, "address"),
        contactName: str(formData, "contactName"),
        phone: str(formData, "phone"),
        email: str(formData, "email"),
        documents,
      }),
    );
    newId = participant.id;
  });
  if (result?.error) return result;
  redirect(`/register?submitted=${encodeURIComponent(newId)}`);
}
