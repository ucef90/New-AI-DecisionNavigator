"use server"

import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"
import type { GeneratedQuestion } from "@/lib/prompts/framework"
import {
  analyzeDocuments,
  generateQuestions,
  generateV2Report,
  saveAnswers,
  scoreProject,
  type V2Answer,
} from "@/lib/v2/pipeline"

export interface V2State {
  error?: string
  ok?: boolean
}

function p(id: string): string {
  return `/projects/${id}/cadrage-v2`
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : "Erreur inattendue."
}

export async function runAnalyze(
  projectId: string,
  _prev: V2State,
  _form: FormData,
): Promise<V2State> {
  try {
    await analyzeDocuments(projectId)
  } catch (e) {
    return { error: msg(e) }
  }
  revalidatePath(p(projectId))
  return { ok: true }
}

export async function runQuestions(
  projectId: string,
  _prev: V2State,
  _form: FormData,
): Promise<V2State> {
  try {
    await generateQuestions(projectId)
  } catch (e) {
    return { error: msg(e) }
  }
  revalidatePath(p(projectId))
  return { ok: true }
}

export async function submitAnswers(
  projectId: string,
  _prev: V2State,
  form: FormData,
): Promise<V2State> {
  const a = await db.frameworkAssessment.findUnique({ where: { projectId } })
  const questions = (a?.questions as unknown as GeneratedQuestion[] | null) ?? []
  if (questions.length === 0) return { error: "Questions manquantes." }

  const answers: V2Answer[] = questions.map((q) => ({
    id: q.id,
    socle: q.socle,
    question: q.question,
    answer: String(form.get(`q_${q.id}`) ?? "").trim(),
  }))

  try {
    await saveAnswers(projectId, answers)
    await scoreProject(projectId)
  } catch (e) {
    return { error: msg(e) }
  }
  revalidatePath(p(projectId))
  return { ok: true }
}

export async function runReport(
  projectId: string,
  _prev: V2State,
  _form: FormData,
): Promise<V2State> {
  try {
    await generateV2Report(projectId)
  } catch (e) {
    return { error: msg(e) }
  }
  revalidatePath(p(projectId))
  return { ok: true }
}

// Réinitialise l'évaluation V2 (pour relancer un cadrage propre).
export async function resetV2(projectId: string): Promise<void> {
  await db.frameworkAssessment.deleteMany({ where: { projectId } })
  revalidatePath(p(projectId))
}
