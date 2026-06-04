"use server"

import { revalidatePath } from "next/cache"
import type { Prisma } from "@prisma/client"
import { PDFParse } from "pdf-parse"

import { db } from "@/lib/db"
import { getLLMProvider, StubProvider } from "@/lib/llm"
import {
  buildVendorPrompt,
  parseVendor,
  type VendorResult,
} from "@/lib/prompts/vendor"

export interface VendorState {
  error?: string
  ok?: boolean
}

const DATA_LABELS: Record<string, string> = {
  none: "aucune",
  identity: "identité",
  health: "santé",
  social: "situation sociale",
  hr: "RH / paie",
  legal: "données judiciaires",
  unknown: "à clarifier",
}

export async function analyzeVendor(
  _prev: VendorState,
  formData: FormData,
): Promise<VendorState> {
  const projectId = String(formData.get("projectId") ?? "")
  const pasted = String(formData.get("text") ?? "").trim()
  const file = formData.get("file") as File | null

  let content = pasted
  let documentName = "Texte collé"

  if (!content && file && file.size > 0) {
    documentName = file.name
    const buffer = Buffer.from(await file.arrayBuffer())
    try {
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const parser = new PDFParse({ data: new Uint8Array(buffer) })
        const parsed = await parser.getText()
        content = parsed.text
      } else {
        content = buffer.toString("utf-8")
      }
    } catch {
      return {
        error:
          "Impossible de lire le document. Importez un PDF texte (non scanné) ou collez le contenu.",
      }
    }
  }

  if (!content || content.trim().length < 20) {
    return {
      error:
        "Document vide ou trop court. Importez un PDF lisible ou collez le texte de la proposition.",
    }
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { decision: true, answers: true },
  })
  if (!project) return { error: "Projet introuvable." }

  const q1 = project.answers.find((a) => a.questionKey === "Q1")
  const q7 = project.answers.find((a) => a.questionKey === "Q7")
  const dataTypes = Array.isArray(q7?.value)
    ? (q7!.value as string[]).map((v) => DATA_LABELS[v] ?? v).join(", ")
    : "non précisé"

  const prompt = buildVendorPrompt(
    {
      problem:
        q1?.llmReformulation ?? project.description ?? project.name,
      verdict: project.decision?.verdict ?? "non décidé",
      tech: project.decision?.techRecommendation ?? "non défini",
      dataTypes,
      regLevel: project.decision?.regulatoryLevel ?? "non évalué",
    },
    content,
  )

  // 1) Tentative avec le provider configuré (mode JSON + timeout).
  let result: VendorResult | null = null
  try {
    const raw = await getLLMProvider().complete(prompt, {
      json: true,
      timeoutMs: 150_000,
    })
    result = parseVendor(raw)
  } catch (e) {
    console.error("[analyzeVendor] LLM error:", e)
  }

  // 2) Repli déterministe si l'IA est indisponible ou illisible (jamais d'échec bloquant).
  if (!result) {
    try {
      result = parseVendor(await new StubProvider().complete(prompt))
    } catch {
      result = null
    }
  }
  if (!result) return { error: "Analyse indisponible. Réessayez." }

  await db.vendorAnalysis.create({
    data: {
      projectId,
      documentName,
      documentContent: content.slice(0, 5000),
      fitScore: result.fitScore,
      fitJustification: result.fitJustification,
      redFlags: result.redFlags as unknown as Prisma.InputJsonValue,
      questions: result.questionsToAsk as unknown as Prisma.InputJsonValue,
      recommendations: result.recommendationReason,
      recommendation: result.recommendation,
    },
  })
  await db.auditLog.create({
    data: { projectId, action: "VENDOR_UPLOADED", detail: { documentName } },
  })

  revalidatePath(`/projects/${projectId}/vendor`)
  return { ok: true }
}
