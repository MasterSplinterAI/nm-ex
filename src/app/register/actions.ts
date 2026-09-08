"use server";

import { redirect } from "next/navigation";
import { guarded, str, type ActionResult } from "@/lib/dmo/action-utils";
import { CATEGORY_ROLE } from "@/lib/dmo/labels";
import { mutate } from "@/lib/dmo/store";
import { WorkflowError, type ParticipantCategory, type UploadedDoc } from "@/lib/dmo/types";
import { submitRegistration } from "@/lib/dmo/workflow";

const CATEGORIES: ParticipantCategory[] = ["tin_shed", "mining_company", "aggregator", "smelter", "end_user"];
const DOCUMENT_NAME = /\.(pdf|jpe?g|png)$/i;

function documentType(name: string): string {
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "application/pdf";
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  return "application/octet-stream";
}

export async function submitRegistrationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let newId = "";
  const result = await guarded(async () => {
    const category = str(formData, "category") as ParticipantCategory;
    if (!CATEGORIES.includes(category)) throw new WorkflowError("Choose a participant type.");
    // This demonstration records document metadata only; file bytes never leave the browser.
    const documentNames = formData.getAll("documentNames");
    if (
      documentNames.length > 10 ||
      documentNames.some(
        (name) => typeof name !== "string" || name.length === 0 || name.length > 255 || !DOCUMENT_NAME.test(name),
      )
    ) {
      throw new WorkflowError("Documents must be PDF, JPG, or PNG files with valid file names.");
    }
    const documents: UploadedDoc[] = documentNames.map((name) => {
      const fileName = name as string;
      return { name: fileName, type: documentType(fileName) };
    });
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
