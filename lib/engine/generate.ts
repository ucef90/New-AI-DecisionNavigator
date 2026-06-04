import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import type { AnswerMap } from "@/lib/questions"
import { runEngine, type EngineResult } from "@/lib/engine"

/**
 * Exécute le moteur sur les réponses d'un projet et persiste la décision
 * + les alertes réglementaires (remplace les précédentes).
 */
export async function generateDecision(
  projectId: string,
): Promise<EngineResult | null> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { answers: true },
  })
  if (!project) return null

  const answers: AnswerMap = {}
  for (const a of project.answers) {
    answers[a.questionKey] = a.value as string | string[]
  }

  const result = runEngine(answers)

  const decisionData = {
    verdict: result.verdict,
    techRecommendation: result.techRecommendation,
    justification: result.justification,
    score: result.score as unknown as Prisma.InputJsonValue,
    rulesTriggered: result.rulesTriggered as unknown as Prisma.InputJsonValue,
    regulatoryLevel: result.regulatoryLevel,
  }

  await db.decision.upsert({
    where: { projectId },
    update: { ...decisionData, generatedAt: new Date() },
    create: { projectId, ...decisionData },
  })

  await db.regulatoryAlert.deleteMany({ where: { projectId } })
  for (const al of result.alerts) {
    await db.regulatoryAlert.create({
      data: {
        projectId,
        level: al.level,
        framework: al.framework,
        article: al.article ?? null,
        obligation: al.obligation,
        action: al.action,
        deadline: al.deadline ?? null,
      },
    })
  }

  await db.auditLog.create({
    data: {
      projectId,
      action: "DECISION_GENERATED",
      detail: { verdict: result.verdict, level: result.regulatoryLevel },
    },
  })

  return result
}
