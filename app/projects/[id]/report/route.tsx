import { renderToBuffer } from "@react-pdf/renderer"
import type { Verdict } from "@prisma/client"

import { db } from "@/lib/db"
import { computeTechAffinities } from "@/lib/engine"
import type { AnswerMap } from "@/lib/questions"
import {
  VERDICT_STYLES,
  VERDICT_MEANING,
  TECH_LABELS,
  TECH_EXPLANATION,
  TECH_SHORT,
  AXIS_LABELS,
  REG_LEVEL_STYLES,
  FRAMEWORK_LABELS,
  ALERT_STYLES,
  type DecisionScore,
} from "@/lib/decision/labels"
import { ReportDocument, type ReportData } from "@/lib/pdf/report-document"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NEXT_STEPS: Record<Verdict, string[]> = {
  GO: [
    "Constituer l'équipe projet, le budget et le planning.",
    "Cadrer le périmètre de déploiement et les critères de réussite.",
    "Vérifier l'intégration au système d'information avec la DSI.",
  ],
  POC: [
    "Définir le périmètre du POC : échantillon, critères de réussite, durée.",
    "Réunir et préparer les données nécessaires.",
    "Cadrer la faisabilité technique avec la DSI.",
  ],
  STUDY: [
    "Lancer une étude de faisabilité (données disponibles, besoin réel).",
    "Consulter les équipes métier concernées.",
    "Réévaluer la décision à l'issue de l'étude.",
  ],
  AUTOMATION: [
    "Cadrer un projet d'automatisation classique (RPA ou règles métier).",
    "Identifier l'outil ou l'éditeur adapté.",
    "Mesurer le gain de temps attendu avant généralisation.",
  ],
  NOGO: [
    "Reformuler le besoin métier avec les parties prenantes.",
    "Identifier et réunir les prérequis manquants.",
    "Réévaluer le projet ultérieurement.",
  ],
}

const VENDOR_RECO_LABEL: Record<string, string> = {
  PROCEED: "Avancer",
  CAUTION: "Prudence",
  AVOID: "À éviter",
}

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      decision: true,
      regulatoryAlerts: true,
      answers: true,
      vendorAnalyses: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  })
  if (!project || !project.decision) {
    return new Response("Aucune décision disponible pour ce projet.", {
      status: 404,
    })
  }

  const d = project.decision
  const score = d.score as unknown as DecisionScore
  const answersMap: AnswerMap = {}
  for (const a of project.answers) {
    answersMap[a.questionKey] = a.value as string | string[]
  }

  const axes = (Object.keys(AXIS_LABELS) as (keyof typeof AXIS_LABELS)[]).map(
    (k) => ({ label: AXIS_LABELS[k], value: score[k] ?? 0 }),
  )
  const affinities = computeTechAffinities(answersMap).map((t) => ({
    label: TECH_SHORT[t.tech],
    value: t.value,
  }))

  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const
  const alerts = [...project.regulatoryAlerts]
    .sort((a, b) => order[a.level] - order[b.level])
    .map((al) => ({
      framework: FRAMEWORK_LABELS[al.framework],
      article: al.article,
      level: ALERT_STYLES[al.level].label,
      obligation: al.obligation,
      action: al.action,
      deadline: al.deadline,
    }))

  const steps = [...NEXT_STEPS[d.verdict]]
  if (alerts.some((a) => a.article?.includes("35"))) {
    steps.unshift("Lancer ou finaliser l'analyse d'impact (AIPD) avec le DPO.")
  }

  const v = project.vendorAnalyses[0]
  const vendor: ReportData["vendor"] = v
    ? {
        documentName: v.documentName ?? "Document fournisseur",
        fitScore: v.fitScore ?? 0,
        maturityScore: v.maturityScore ?? 0,
        recommendationLabel:
          VENDOR_RECO_LABEL[v.recommendation ?? "CAUTION"] ?? "Prudence",
        solutionSummary: v.solutionSummary ?? "",
        relevance: v.relevance ?? "",
        fitJustification: v.fitJustification ?? "",
        questions: (v.questions as unknown as { question: string; why: string }[]) ?? [],
      }
    : null

  const data: ReportData = {
    projectName: project.name,
    direction: project.direction,
    userName: project.user?.name ?? "—",
    date: dateFmt.format(d.generatedAt),
    verdict: d.verdict,
    verdictLabel: VERDICT_STYLES[d.verdict].label,
    verdictMeaning: VERDICT_MEANING[d.verdict],
    justification: d.justification,
    scoreTotal: score.total,
    axes,
    techLabel: d.techRecommendation ? TECH_LABELS[d.techRecommendation] : null,
    techExplanation: d.techRecommendation
      ? TECH_EXPLANATION[d.techRecommendation]
      : null,
    affinities,
    regulatoryLevelLabel: REG_LEVEL_STYLES[d.regulatoryLevel].label.toLowerCase(),
    regulatoryLevelKey: d.regulatoryLevel,
    alerts,
    steps,
    vendor,
  }

  const buffer = await renderToBuffer(<ReportDocument data={data} />)
  const slug = project.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="precadrage-${slug}.pdf"`,
    },
  })
}
