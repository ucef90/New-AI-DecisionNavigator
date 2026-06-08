import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { complete, resolveActiveProviderName } from "@/lib/llm"
import { getAppSettings } from "@/lib/settings"
import { retrieve, buildKnowledgeBlock } from "@/lib/rag"
import {
  buildSolutionPrompt,
  parseSolution,
  type SolutionProposalData,
} from "@/lib/prompts/solution"

const DATA_LABELS: Record<string, string> = {
  none: "aucune",
  identity: "identité",
  health: "santé",
  social: "situation sociale",
  hr: "RH / paie",
  legal: "données judiciaires",
  unknown: "à clarifier",
}

/**
 * Génère la proposition de solution technique détaillée (Prompt 4) à partir du
 * cadrage du projet, et la stocke (remplace la précédente). Renvoie la donnée
 * structurée, ou null si aucun LLM réel n'est configuré ou en cas d'échec —
 * dans ce cas l'UI retombe sur l'exemple statique (jamais de faux livrable).
 */
export async function generateSolution(
  projectId: string,
): Promise<SolutionProposalData | null> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { decision: true, answers: true, regulatoryAlerts: true },
  })
  if (!project || !project.decision) return null

  // Pas de moteur IA réel → on ne génère pas (éviter un livrable "stub" générique).
  const active = await resolveActiveProviderName()
  if (active === "stub") return null

  const q1 = project.answers.find((a) => a.questionKey === "Q1")
  const need = q1?.llmReformulation ?? project.description ?? project.name
  const q7 = project.answers.find((a) => a.questionKey === "Q7")
  const dataTypes = Array.isArray(q7?.value)
    ? (q7!.value as string[]).map((v) => DATA_LABELS[v] ?? v).join(", ")
    : "non précisé"

  const knowledge = buildKnowledgeBlock(
    await retrieve(
      `${need} ${project.decision.verdict} ${project.decision.techRecommendation ?? ""}`,
      { projectId, k: 5, sources: ["REFERENCE", "VENDOR", "DECISION"] },
    ),
  )

  const prompt = buildSolutionPrompt({
    projectName: project.name,
    need,
    verdict: project.decision.verdict,
    tech: project.decision.techRecommendation ?? "non défini",
    regulatoryLevel: project.decision.regulatoryLevel,
    justification: project.decision.justification,
    dataTypes,
    alertsJson: JSON.stringify(
      project.regulatoryAlerts.map((a) => ({
        level: a.level,
        framework: a.framework,
        article: a.article,
        obligation: a.obligation,
      })),
    ),
    knowledge,
  })

  const settings = await getAppSettings()

  let content = ""
  try {
    content = await complete(prompt, {
      json: true,
      timeoutMs: settings.llmTimeoutMs,
    })
  } catch (e) {
    console.error("[generateSolution] LLM error:", e)
    return null
  }

  const data = parseSolution(content)
  if (!data) {
    console.warn("[generateSolution] réponse LLM non exploitable.")
    return null
  }

  await db.solutionProposal.upsert({
    where: { projectId },
    update: {
      content: data as unknown as Prisma.InputJsonValue,
      llmProvider: active,
      generatedAt: new Date(),
    },
    create: {
      projectId,
      content: data as unknown as Prisma.InputJsonValue,
      llmProvider: active,
    },
  })
  await db.auditLog.create({
    data: { projectId, action: "SOLUTION_GENERATED", detail: { provider: active } },
  })

  return data
}
