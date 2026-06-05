"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { PDFParse } from "pdf-parse"

import { db } from "@/lib/db"
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
  const file = formData.get("file") as File | null

  if (!file || file.size === 0) return { error: "Aucun fichier sélectionné." }
  if (file.size > MAX_SIZE) {
    return { error: "Fichier trop volumineux (10 Mo maximum)." }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  let text = ""
  try {
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const parser = new PDFParse({ data: new Uint8Array(buffer) })
      text = (await parser.getText()).text
    } else {
      text = buffer.toString("utf-8")
    }
  } catch {
    text = "" // l'aperçu texte échoue mais le document reste référencé
  }

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

  revalidatePath(`/projects/${projectId}`)
  return { ok: true }
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
