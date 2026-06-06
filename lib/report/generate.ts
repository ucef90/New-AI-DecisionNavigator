import { db } from "@/lib/db"
import { complete, StubProvider } from "@/lib/llm"
import { getAppSettings } from "@/lib/settings"
import { retrieve, buildKnowledgeBlock, ingestText } from "@/lib/rag"
import { buildReportPrompt } from "@/lib/prompts/report"

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

/**
 * Génère le rapport markdown (Prompt 3) à partir des données du projet
 * et le stocke (remplace le précédent). Renvoie le markdown.
 */
export async function generateReport(projectId: string): Promise<string | null> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      user: true,
      decision: true,
      answers: true,
      regulatoryAlerts: true,
      vendorAnalyses: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  })
  if (!project || !project.decision) return null

  const answersMap: Record<string, unknown> = {}
  for (const a of project.answers) answersMap[a.questionKey] = a.value

  const vendor = project.vendorAnalyses[0]

  // RAG : ancre le rapport sur le référentiel réglementaire + l'historique
  // (analyses fournisseurs et décisions passées) pertinents pour ce projet.
  const q1 = project.answers.find((a) => a.questionKey === "Q1")
  const needText =
    q1?.llmReformulation ?? project.description ?? project.name
  const knowledge = buildKnowledgeBlock(
    await retrieve(
      `${needText} ${project.decision.verdict} ${project.decision.techRecommendation ?? ""}`,
      { projectId, k: 5, sources: ["REFERENCE", "VENDOR", "DECISION"] },
    ),
  )

  const prompt = buildReportPrompt({
    projectName: project.name,
    userName: project.user?.name ?? "—",
    date: dateFmt.format(new Date()),
    answersJson: JSON.stringify(answersMap),
    decisionJson: JSON.stringify({
      verdict: project.decision.verdict,
      techRecommendation: project.decision.techRecommendation,
      justification: project.decision.justification,
      score: project.decision.score,
      regulatoryLevel: project.decision.regulatoryLevel,
    }),
    alertsJson: JSON.stringify(
      project.regulatoryAlerts.map((a) => ({
        level: a.level,
        framework: a.framework,
        article: a.article,
        obligation: a.obligation,
        action: a.action,
        deadline: a.deadline,
      })),
    ),
    vendorJson: vendor
      ? JSON.stringify({
          fitScore: vendor.fitScore,
          questions: vendor.questions,
          recommendation: vendor.recommendation,
        })
      : undefined,
    knowledge,
  })

  const settings = await getAppSettings()

  let content = ""
  let usedFallback = false
  try {
    content = await complete(prompt, { timeoutMs: settings.llmTimeoutMs })
  } catch (e) {
    console.error("[generateReport] LLM error:", e)
  }
  if (!content.trim()) {
    // Repli déterministe : garantit un rapport même si le LLM échoue/expire
    // (modèle local lent). Dégradé mais exploitable — jamais d'écran vide.
    try {
      content = await new StubProvider().complete(prompt)
      usedFallback = true
      console.warn("[generateReport] repli déterministe (stub) utilisé.")
    } catch (e) {
      console.error("[generateReport] échec du repli stub:", e)
    }
  }
  if (!content.trim()) return null

  await db.report.deleteMany({ where: { projectId, format: "MARKDOWN" } })
  await db.report.create({
    data: { projectId, format: "MARKDOWN", content },
  })
  await db.auditLog.create({
    data: {
      projectId,
      action: "REPORT_GENERATED",
      detail: { provider: usedFallback ? "stub-fallback" : "llm" },
    },
  })

  // Auto-enrichissement : le rapport devient une connaissance réutilisable
  // (global ou cloisonné au projet selon le périmètre configuré).
  const knowledgeScope = settings.knowledgeScope
  await ingestText({
    title: `Rapport — ${project.name}`,
    text: content,
    source: "REPORT",
    sourceRef: `report:${projectId}`,
    projectId: knowledgeScope === "project" ? projectId : null,
    tags: ["rapport", project.decision.verdict],
  })

  return content
}

/** Renvoie le markdown du rapport (en le générant si nécessaire). */
export async function getOrCreateReport(
  projectId: string,
): Promise<string | null> {
  const existing = await db.report.findFirst({
    where: { projectId, format: "MARKDOWN" },
    orderBy: { generatedAt: "desc" },
  })
  if (existing) return existing.content
  return generateReport(projectId)
}
