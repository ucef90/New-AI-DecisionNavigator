"use server"

import { revalidatePath } from "next/cache"
import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { extractText } from "@/lib/extract"
import { complete, resolveActiveProviderName } from "@/lib/llm"
import {
  retrieve,
  buildKnowledgeBlock,
  ingestVendorAnalysis,
} from "@/lib/rag"
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
    const extracted = await extractText(file)
    if (!extracted.ok) {
      return { error: extracted.reason ?? "Impossible de lire le document." }
    }
    content = extracted.text
  }

  if (!content || content.trim().length < 20) {
    return {
      error:
        "Document vide ou trop court. Importez un PDF lisible, un Word (.docx), ou collez le texte de la proposition.",
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

  const problem = q1?.llmReformulation ?? project.description ?? project.name

  // RAG : référentiel réglementaire + analyses fournisseurs passées (global).
  const knowledge = buildKnowledgeBlock(
    await retrieve(`${problem}\n${content}`.slice(0, 2000), {
      projectId,
      k: 4,
      sources: ["REFERENCE", "VENDOR"],
    }),
  )

  const prompt = buildVendorPrompt(
    {
      problem,
      verdict: project.decision?.verdict ?? "non décidé",
      tech: project.decision?.techRecommendation ?? "non défini",
      dataTypes,
      regLevel: project.decision?.regulatoryLevel ?? "non évalué",
    },
    content,
    knowledge,
  )

  // Garde-fou : refuser l'analyse si aucun LLM réel n'est actif. Sinon le
  // StubProvider renverrait un résultat déterministe trompeur ("tout va bien").
  const activeProvider = await resolveActiveProviderName()
  if (activeProvider === "stub") {
    return {
      error:
        "Aucun moteur IA réel n'est configuré : l'analyse ne serait pas fiable. Configure Anthropic ou Ollama dans Paramètres, teste la connexion, puis relance l'analyse.",
    }
  }

  // Analyse par le LLM configuré (mode JSON). PAS de repli "stub" silencieux :
  // un échec renvoie une erreur claire plutôt qu'un faux résultat favorable.
  let result: VendorResult | null = null
  try {
    const raw = await complete(prompt, {
      json: true,
      timeoutMs: 60_000,
    })
    result = parseVendor(raw)
  } catch (e) {
    console.error("[analyzeVendor] LLM error:", e)
  }
  if (!result) {
    return {
      error:
        "Le moteur IA n'a pas pu analyser le document (indisponible ou réponse illisible). Vérifie la configuration dans Paramètres et réessaie.",
    }
  }

  // Document hors-sujet / pas une vraie offre : on n'enregistre PAS de fausse
  // analyse — c'est ce qui donnait l'impression que "n'importe quel document est bon".
  if (!result.documentIsRelevant) {
    return {
      error:
        result.irrelevantReason ||
        "Ce document ne semble pas être une proposition fournisseur en lien avec ce projet. Importe l'offre, le devis ou la réponse à appel d'offres du fournisseur.",
    }
  }

  const created = await db.vendorAnalysis.create({
    data: {
      projectId,
      documentName,
      documentContent: content.slice(0, 5000),
      solutionSummary: result.solutionSummary || null,
      relevance: result.relevance || null,
      maturityScore: result.maturityScore,
      maturityJustification: result.maturityJustification || null,
      fitScore: result.fitScore,
      fitJustification: result.fitJustification,
      redFlags: result.redFlags as unknown as Prisma.InputJsonValue,
      hiddenDependencies:
        result.hiddenDependencies as unknown as Prisma.InputJsonValue,
      questions: result.questionsToAsk as unknown as Prisma.InputJsonValue,
      recommendations: result.recommendationReason,
      recommendation: result.recommendation,
    },
  })
  await db.auditLog.create({
    data: { projectId, action: "VENDOR_UPLOADED", detail: { documentName } },
  })

  // Auto-enrichissement : cette analyse devient une connaissance réutilisable.
  await ingestVendorAnalysis(created.id)

  revalidatePath(`/projects/${projectId}/vendor`)
  return { ok: true }
}

// Enregistre la note manuelle (0-100) attribuée par l'utilisateur à une offre.
// Une valeur nulle/vide efface la note.
export async function setVendorScore(
  projectId: string,
  analysisId: string,
  score: number | null,
): Promise<void> {
  const clean =
    score === null || Number.isNaN(score)
      ? null
      : Math.max(0, Math.min(100, Math.round(score)))

  await db.vendorAnalysis.updateMany({
    where: { id: analysisId, projectId },
    data: { userScore: clean },
  })
  revalidatePath(`/projects/${projectId}/vendor`)
}

// Supprime une analyse fournisseur du projet.
export async function deleteVendorAnalysis(
  projectId: string,
  analysisId: string,
): Promise<void> {
  await db.vendorAnalysis.deleteMany({ where: { id: analysisId, projectId } })
  revalidatePath(`/projects/${projectId}/vendor`)
}
