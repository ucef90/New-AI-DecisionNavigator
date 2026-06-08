import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { complete, resolveActiveProviderName } from "@/lib/llm"
import { getAppSettings } from "@/lib/settings"
import { getFramework } from "@/lib/framework"
import {
  buildDocAnalysisPrompt,
  buildQuestionsPrompt,
  buildScoringPrompt,
  buildV2ReportPrompt,
  parseDocAnalysis,
  parseQuestions,
  parseScoring,
  type DocAnalysis,
  type GeneratedQuestion,
  type ScoringResult,
} from "@/lib/prompts/framework"

// V2 — Orchestration du cadrage 6 socles. 4 étapes séquentielles, chacune
// persiste son artefact dans FrameworkAssessment. Le LLM configuré (Anthropic
// en prod) est le "cerveau" ; aucun repli stub silencieux.

const MAX_DOC_CHARS = 40_000

export interface V2Answer {
  id: number
  socle: number
  question: string
  answer: string
}

export class NoRealLLMError extends Error {
  constructor() {
    super(
      "Aucun moteur IA réel n'est configuré. Active Anthropic ou Ollama dans Paramètres avant de lancer le cadrage V2.",
    )
    this.name = "NoRealLLMError"
  }
}

async function assertRealLLM(): Promise<void> {
  if ((await resolveActiveProviderName()) === "stub") throw new NoRealLLMError()
}

async function timeoutMs(): Promise<number> {
  return (await getAppSettings()).llmTimeoutMs
}

// Crée la ligne d'évaluation si absente.
async function ensureAssessment(projectId: string) {
  return db.frameworkAssessment.upsert({
    where: { projectId },
    update: {},
    create: { projectId, status: "CREATED" },
  })
}

// --- Étape 1 : analyse des documents importés ------------------------------
export async function analyzeDocuments(projectId: string): Promise<DocAnalysis> {
  await assertRealLLM()

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { attachments: true },
  })
  if (!project) throw new Error("Projet introuvable.")

  const parts: string[] = []
  if (project.description) parts.push(`Description projet : ${project.description}`)
  if (project.contextBrief) parts.push(`Contexte : ${project.contextBrief}`)
  for (const a of project.attachments) {
    if (a.text?.trim()) parts.push(`--- Document : ${a.name} ---\n${a.text}`)
  }
  const documentsText = parts.join("\n\n").slice(0, MAX_DOC_CHARS)
  if (documentsText.trim().length < 20) {
    throw new Error(
      "Aucun document exploitable. Importe au moins un document de cadrage lisible avant de lancer l'analyse.",
    )
  }

  const provider = await resolveActiveProviderName()
  const raw = await complete(buildDocAnalysisPrompt(documentsText), {
    json: true,
    timeoutMs: await timeoutMs(),
  })
  const analysis = parseDocAnalysis(raw)
  if (!analysis) throw new Error("Analyse documentaire illisible (réponse LLM invalide).")

  await ensureAssessment(projectId)
  await db.frameworkAssessment.update({
    where: { projectId },
    data: {
      docAnalysis: analysis as unknown as Prisma.InputJsonValue,
      status: "ANALYZED",
      llmProvider: provider,
    },
  })
  return analysis
}

// --- Étape 2 : génération des 20 questions personnalisées ------------------
export async function generateQuestions(
  projectId: string,
): Promise<GeneratedQuestion[]> {
  await assertRealLLM()

  const a = await db.frameworkAssessment.findUnique({ where: { projectId } })
  if (!a?.docAnalysis) {
    throw new Error("Lance d'abord l'analyse des documents (étape 1).")
  }

  const raw = await complete(
    buildQuestionsPrompt(JSON.stringify(a.docAnalysis), getFramework()),
    { json: true, timeoutMs: await timeoutMs() },
  )
  const questions = parseQuestions(raw)
  if (questions.length === 0) {
    throw new Error("Génération des questions illisible (réponse LLM invalide).")
  }

  await db.frameworkAssessment.update({
    where: { projectId },
    data: {
      questions: questions as unknown as Prisma.InputJsonValue,
      status: "QUESTIONS",
    },
  })
  return questions
}

// --- Enregistrement des réponses (avant scoring) ---------------------------
export async function saveAnswers(
  projectId: string,
  answers: V2Answer[],
): Promise<void> {
  await db.frameworkAssessment.update({
    where: { projectId },
    data: { answers: answers as unknown as Prisma.InputJsonValue },
  })
}

// --- Étape 3 : scoring 11 axes + décision ----------------------------------
export async function scoreProject(projectId: string): Promise<ScoringResult> {
  await assertRealLLM()

  const a = await db.frameworkAssessment.findUnique({ where: { projectId } })
  if (!a?.docAnalysis) throw new Error("Analyse documentaire manquante.")
  if (!a?.answers) throw new Error("Réponses au questionnaire manquantes.")

  const raw = await complete(
    buildScoringPrompt(
      JSON.stringify(a.docAnalysis),
      JSON.stringify(a.answers),
      getFramework(),
    ),
    { json: true, timeoutMs: await timeoutMs() },
  )
  const scoring = parseScoring(raw)
  if (!scoring) throw new Error("Scoring illisible (réponse LLM invalide).")

  await db.frameworkAssessment.update({
    where: { projectId },
    data: {
      scoring: scoring as unknown as Prisma.InputJsonValue,
      decision: scoring.decision,
      scoreGlobal: scoring.scoreGlobal,
      pourcentage: scoring.pourcentage,
      status: "SCORED",
    },
  })
  return scoring
}

// --- Étape 4 : rapport final (markdown) ------------------------------------
export async function generateV2Report(projectId: string): Promise<string> {
  await assertRealLLM()

  const a = await db.frameworkAssessment.findUnique({ where: { projectId } })
  if (!a?.scoring) throw new Error("Lance d'abord le scoring (étape 3).")

  const markdown = await complete(
    buildV2ReportPrompt(JSON.stringify(a.scoring)),
    { timeoutMs: await timeoutMs() },
  )
  if (!markdown.trim()) throw new Error("Rapport vide (réponse LLM invalide).")

  await db.frameworkAssessment.update({
    where: { projectId },
    data: { report: markdown, status: "REPORTED" },
  })
  return markdown
}
