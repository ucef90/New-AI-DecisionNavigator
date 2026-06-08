"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"
import { complete } from "@/lib/llm"
import { retrieve, buildKnowledgeBlock } from "@/lib/rag"
import { generateDecision } from "@/lib/engine/generate"
import { generateReport } from "@/lib/report/generate"
import { generateSolution } from "@/lib/solution/generate"
import {
  buildReformulationPrompt,
  parseReformulation,
  type ReformulationResult,
} from "@/lib/prompts/reformulate"
import type { Prisma } from "@prisma/client"

type AnswerValue = string | string[]

/** Autosave d'une réponse (upsert sur projectId + questionKey). */
export async function saveAnswer(
  projectId: string,
  questionKey: string,
  value: AnswerValue,
): Promise<{ ok: boolean }> {
  await db.answer.upsert({
    where: { projectId_questionKey: { projectId, questionKey } },
    update: { value: value as Prisma.InputJsonValue, answeredAt: new Date() },
    create: {
      projectId,
      questionKey,
      value: value as Prisma.InputJsonValue,
    },
  })

  await db.auditLog.create({
    data: { projectId, action: "ANSWER_SAVED", detail: { questionKey } },
  })

  return { ok: true }
}

/** Sauvegarde Q1 puis appelle le LLM (Prompt 1) pour reformuler le besoin. */
export async function reformulateQ1(
  projectId: string,
  text: string,
): Promise<ReformulationResult | null> {
  const trimmed = text.trim()
  if (!trimmed) return null

  // RAG : repères réglementaires / méthodo + motifs de décisions passés.
  const knowledge = buildKnowledgeBlock(
    await retrieve(trimmed, {
      projectId,
      k: 3,
      sources: ["REFERENCE", "DECISION"],
    }),
  )

  const prompt = buildReformulationPrompt(trimmed, knowledge)
  let result: ReformulationResult | null = null
  try {
    const raw = await complete(prompt, {
      json: true,
      timeoutMs: 120_000,
    })
    result = parseReformulation(raw)
  } catch (e) {
    console.error("[reformulateQ1] LLM error:", e)
  }

  await db.answer.upsert({
    where: { projectId_questionKey: { projectId, questionKey: "Q1" } },
    update: {
      value: trimmed as Prisma.InputJsonValue,
      llmReformulation: result?.problemReformulated ?? null,
      answeredAt: new Date(),
    },
    create: {
      projectId,
      questionKey: "Q1",
      value: trimmed as Prisma.InputJsonValue,
      llmReformulation: result?.problemReformulated ?? null,
    },
  })

  return result
}

/** Marque le parcours terminé et redirige vers les résultats. */
export async function completeWizard(projectId: string): Promise<void> {
  // Génère la décision (scoring + règles + alertes) à partir des réponses.
  await generateDecision(projectId)
  // Génère le rapport (Prompt 3 → markdown stocké).
  await generateReport(projectId)
  // Génère la proposition de solution technique détaillée (Prompt 4).
  // Best-effort : ne doit jamais bloquer la clôture du parcours.
  try {
    await generateSolution(projectId)
  } catch (e) {
    console.error("[completeWizard] generateSolution:", e)
  }

  await db.project.update({
    where: { id: projectId },
    data: { status: "DONE" },
  })
  await db.auditLog.create({
    data: { projectId, action: "WIZARD_COMPLETED" },
  })
  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/projects/${projectId}/results`)
  revalidatePath("/dashboard")
  redirect(`/projects/${projectId}/results`)
}
