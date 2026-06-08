"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { db } from "@/lib/db"
import { extractText } from "@/lib/extract"
import { analyzeProjectContext } from "@/lib/context/generate"
import type { ContextResult } from "@/lib/prompts/context"

export interface UploadState {
  error?: string
  ok?: boolean
}

const MAX_SIZE = 10 * 1024 * 1024 // 10 Mo

export async function uploadDocument(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const projectId = String(formData.get("projectId") ?? "")
  // Plusieurs fichiers peuvent être importés en une fois (champ "file" multiple).
  const files = formData
    .getAll("file")
    .filter((f): f is File => f instanceof File && f.size > 0)

  if (files.length === 0) return { error: "Aucun fichier sélectionné." }

  const skipped: string[] = []
  let imported = 0

  for (const file of files) {
    if (file.size > MAX_SIZE) {
      skipped.push(`${file.name} (trop volumineux, 10 Mo max)`)
      continue
    }

    // Extraction du texte (PDF texte, Word .docx, texte brut). Si elle échoue
    // (PDF scanné, format non géré…), le document reste référencé sans aperçu.
    const extracted = await extractText(file)
    const text = extracted.ok ? extracted.text : ""

    await db.attachment.create({
      data: {
        projectId,
        name: file.name,
        mimeType: file.type || null,
        size: file.size,
        text: text.slice(0, 20000) || null,
      },
    })
    await db.auditLog.create({
      data: { projectId, action: "DOCUMENT_UPLOADED", detail: { name: file.name } },
    })
    imported++
  }

  if (imported === 0) {
    return { error: `Aucun document importé. Ignoré : ${skipped.join(", ")}` }
  }

  revalidatePath(`/projects/${projectId}`)
  return skipped.length > 0
    ? { ok: true, error: `${imported} document(s) importé(s). Ignoré : ${skipped.join(", ")}` }
    : { ok: true }
}

export async function deleteDocument(
  attachmentId: string,
  projectId: string,
): Promise<void> {
  await db.attachment.deleteMany({ where: { id: attachmentId, projectId } })
  revalidatePath(`/projects/${projectId}`)
}

/** Analyse les documents + la description pour produire une synthèse de contexte. */
export async function analyzeContext(
  projectId: string,
): Promise<ContextResult | null> {
  return analyzeProjectContext(projectId)
}

/** Supprime définitivement un projet (cascade : réponses, décision, alertes…). */
export async function deleteProject(projectId: string): Promise<void> {
  await db.project.delete({ where: { id: projectId } })
  revalidatePath("/dashboard")
  redirect("/dashboard")
}
