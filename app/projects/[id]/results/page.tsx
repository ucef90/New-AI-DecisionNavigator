import Link from "next/link"
import { notFound } from "next/navigation"
import type { Verdict } from "@prisma/client"
import {
  ArrowLeft,
  ArrowRight,
  FileArrowDown,
  Gauge,
  Cpu,
  ShieldWarning,
  ListChecks,
  PencilSimple,
  Storefront,
  Polygon,
} from "@phosphor-icons/react/dist/ssr"

import { db } from "@/lib/db"
import {
  computeTechAffinities,
  regulatoryFactors,
  techAffinityReasons,
} from "@/lib/engine"
import type { AnswerMap } from "@/lib/questions"
import {
  TECH_LABELS,
  TECH_EXPLANATION,
  VERDICT_MEANING,
  AXIS_LABELS,
  type DecisionScore,
} from "@/lib/decision/labels"
import { PageContainer } from "@/components/layout/page-container"
import {
  DecisionBanner,
  RegulatoryLevelBadge,
} from "@/components/decision/badges"
import { AlertItem } from "@/components/decision/alert-item"
import { TechRadar } from "@/components/decision/tech-radar"
import { TechRadarDetail } from "@/components/decision/tech-radar-detail"
import { SolutionBlueprint } from "@/components/decision/solution-blueprint"
import { RiskExplainer } from "@/components/decision/risk-explainer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Reveal } from "@/components/motion/reveal"
import { ScoreMeter } from "@/components/motion/score-meter"

export const metadata = { title: "Résultats" }

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

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

export default async function ResultsPage({
  params,
}: {
  params: { id: string }
}) {
  const project = await db.project.findUnique({
    where: { id: params.id },
    include: { decision: true, regulatoryAlerts: true, answers: true },
  })

  if (!project) notFound()

  const { decision } = project

  if (!decision) {
    return (
      <PageContainer className="max-w-3xl">
        <BackLink id={project.id} />
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center text-sm text-muted-foreground">
            Aucune décision n&apos;a encore été générée. Terminez le parcours de
            cadrage pour obtenir un résultat.
            <Button asChild>
              <Link href={`/projects/${project.id}/wizard`}>
                Reprendre le parcours
              </Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  const score = decision.score as unknown as DecisionScore
  const axes = (Object.keys(AXIS_LABELS) as (keyof typeof AXIS_LABELS)[]).map(
    (key) => ({ key, label: AXIS_LABELS[key], value: score[key] ?? 0 }),
  )

  const answersMap: AnswerMap = {}
  for (const a of project.answers) {
    answersMap[a.questionKey] = a.value as string | string[]
  }
  const techAffinities = computeTechAffinities(answersMap)
  const techReasons = techAffinityReasons(answersMap)
  const riskFactors = regulatoryFactors(answersMap)

  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const
  const alerts = [...project.regulatoryAlerts].sort(
    (a, b) => order[a.level] - order[b.level],
  )

  const steps = [...NEXT_STEPS[decision.verdict]]
  if (alerts.some((a) => a.article?.includes("35"))) {
    steps.unshift("Lancer ou finaliser l'analyse d'impact (AIPD) avec le DPO.")
  }

  return (
    <PageContainer className="max-w-3xl space-y-8">
      <header>
        <BackLink id={project.id} />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              {project.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {project.direction ? `${project.direction} · ` : ""}Pré-cadrage du{" "}
              {dateFmt.format(decision.generatedAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/projects/${project.id}/wizard`}>
                <PencilSimple className="size-4" aria-hidden />
                Modifier
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a
                href={`/projects/${project.id}/report`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileArrowDown className="size-4" aria-hidden />
                Exporter le PDF
              </a>
            </Button>
          </div>
        </div>
      </header>

      <Reveal>
        <DecisionBanner verdict={decision.verdict} total={score.total} />
      </Reveal>

      {/* Ce que cela signifie */}
      <Reveal delay={0.06}>
        <Card className="border-primary/20 bg-accent/40">
          <CardContent className="space-y-2 pt-6">
            <h2 className="text-sm font-semibold text-primary">
              Concrètement, que faire ?
            </h2>
            <p className="leading-relaxed">
              {VERDICT_MEANING[decision.verdict]}
            </p>
          </CardContent>
        </Card>
      </Reveal>

      {/* Justification */}
      <Reveal delay={0.1}>
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Pourquoi cette décision
          </h2>
          <p className="max-w-[68ch] leading-relaxed">
            {decision.justification}
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.14}>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Évaluation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="size-4 text-muted-foreground" aria-hidden />
                Évaluation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {axes.map((axis) => (
                <div key={axis.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{axis.label}</span>
                    <span className="font-medium tabular-nums">
                      {axis.value}/3
                    </span>
                  </div>
                  <ScoreMeter value={axis.value} />
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{score.total}/18</span>
              </div>
            </CardContent>
          </Card>

          {/* Technologie */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Cpu className="size-4 text-muted-foreground" aria-hidden />
                Technologie recommandée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {decision.techRecommendation ? (
                <>
                  <p className="font-medium">
                    {TECH_LABELS[decision.techRecommendation]}
                  </p>
                  <p className="leading-relaxed text-muted-foreground">
                    {TECH_EXPLANATION[decision.techRecommendation]}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Aucune technologie spécifique à ce stade : le besoin doit
                  d&apos;abord être précisé.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </Reveal>

      {/* Profil technologique (radar) */}
      <Reveal delay={0.16}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Polygon className="size-4 text-muted-foreground" aria-hidden />
              Profil technologique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TechRadar
              data={techAffinities}
              recommended={decision.techRecommendation}
            />
            <p className="mt-4 text-xs text-muted-foreground">
              Affinité du projet avec chaque technologie. Plus l&apos;aire
              s&apos;étend vers un axe, plus cette approche est pertinente.
            </p>
            <TechRadarDetail
              affinities={techAffinities}
              recommended={decision.techRecommendation}
              reasons={techReasons}
            />
          </CardContent>
        </Card>
      </Reveal>

      {/* Proposition de solution (exemple) */}
      <Reveal delay={0.18}>
        <SolutionBlueprint
          tech={decision.techRecommendation}
          verdict={decision.verdict}
        />
      </Reveal>

      {/* Prochaines étapes */}
      <Reveal delay={0.18}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="size-4 text-muted-foreground" aria-hidden />
              Prochaines étapes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <Badge
                    variant="secondary"
                    className="mt-0.5 size-6 shrink-0 justify-center rounded-full p-0 tabular-nums"
                  >
                    {i + 1}
                  </Badge>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </Reveal>

      {/* Réglementation */}
      <Reveal delay={0.22}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldWarning
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
                Obligations réglementaires
              </CardTitle>
              <RegulatoryLevelBadge level={decision.regulatoryLevel} />
            </div>
          </CardHeader>
          <CardContent>
            <RiskExplainer
              level={decision.regulatoryLevel}
              factors={riskFactors}
            />
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune obligation réglementaire particulière pour ce projet.
              </p>
            ) : (
              <ul className="divide-y">
                {alerts.map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={{
                      id: alert.id,
                      framework: alert.framework,
                      article: alert.article,
                      level: alert.level,
                      obligation: alert.obligation,
                      action: alert.action,
                      deadline: alert.deadline,
                    }}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </Reveal>

      {/* Analyse fournisseur */}
      <Reveal delay={0.26}>
        <Card className="bg-muted/30">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <div className="flex items-start gap-3">
              <Storefront
                className="mt-0.5 size-5 text-muted-foreground"
                aria-hidden
              />
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">
                  Vous avez reçu une proposition d&apos;un fournisseur ?
                </h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  Importez-la (PDF ou texte) : l&apos;outil évalue son adéquation
                  à ce projet et prépare les questions à poser.
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0">
              <Link href={`/projects/${project.id}/vendor`}>
                Analyser un fournisseur
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </Reveal>
    </PageContainer>
  )
}

function BackLink({ id }: { id: string }) {
  return (
    <Link
      href={`/projects/${id}`}
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Retour au projet
    </Link>
  )
}
