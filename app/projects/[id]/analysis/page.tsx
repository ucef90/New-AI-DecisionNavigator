import Link from "next/link"
import { notFound } from "next/navigation"
import type { Icon } from "@phosphor-icons/react"
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Scales,
  Gauge,
  Polygon,
  ShieldCheck,
  MapTrifold,
  ListChecks,
  CheckCircle,
  Warning,
  Circle,
} from "@phosphor-icons/react/dist/ssr"

import { db } from "@/lib/db"
import { computeTechAffinities } from "@/lib/engine"
import { buildGlobalAnalysis } from "@/lib/analysis/global"
import type { AnswerMap } from "@/lib/questions"
import { cn } from "@/lib/utils"
import { PageContainer } from "@/components/layout/page-container"
import { DecisionBanner } from "@/components/decision/badges"
import { TechRadar } from "@/components/decision/tech-radar"
import { Reveal } from "@/components/motion/reveal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Analyse globale" }

const QUAL_STYLE: Record<string, string> = {
  Automatisation: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
  IA: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  "IA avancée": "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
}

function gaugeColor(v: number, invert = false) {
  const good = invert ? v < 40 : v >= 66
  const mid = v >= 40 && v < 66
  return good ? "bg-emerald-500" : mid ? "bg-amber-500" : "bg-rose-500"
}

export default async function AnalysisPage({
  params,
}: {
  params: { id: string }
}) {
  const project = await db.project.findUnique({
    where: { id: params.id },
    include: { decision: true, answers: true, regulatoryAlerts: true },
  })
  if (!project) notFound()

  if (!project.decision) {
    return (
      <PageContainer className="max-w-3xl">
        <BackLink id={project.id} />
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Terminez le parcours de cadrage pour générer l&apos;analyse globale.
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  const answers: AnswerMap = {}
  for (const a of project.answers) answers[a.questionKey] = a.value as string | string[]

  const A = buildGlobalAnalysis(answers, project.decision, project.regulatoryAlerts)
  const affinities = computeTechAffinities(answers)
  const score = project.decision.score as unknown as { total: number }

  return (
    <PageContainer className="max-w-3xl space-y-8">
      <header>
        <BackLink id={project.id} />
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Analyse globale — {project.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Synthèse multi-ateliers générée à partir du questionnaire.
        </p>
      </header>

      {/* Atelier 1 — Diagnostic métier */}
      <Reveal>
        <Atelier n={1} title="Diagnostic métier" icon={Briefcase}>
          <Field label="Besoin">{A.diagnostic.need}</Field>
          {A.diagnostic.processes ? (
            <Field label="Processus actuel">{A.diagnostic.processes}</Field>
          ) : null}
          <Chips label="Gains visés" items={A.diagnostic.gains} />
          <Chips label="Acteurs" items={A.diagnostic.actors} />
          <Chips label="Enjeux" items={A.diagnostic.stakes} />
        </Atelier>
      </Reveal>

      {/* Atelier 2 — Qualification IA vs Automatisation */}
      <Reveal delay={0.06}>
        <Atelier n={2} title="Qualification IA vs Automatisation" icon={Scales}>
          <p className="text-sm">{A.qualification.summary}</p>
          {A.qualification.items.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {A.qualification.items.map((it, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span>{it.capability}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium",
                      QUAL_STYLE[it.type],
                    )}
                  >
                    {it.type}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </Atelier>
      </Reveal>

      {/* Atelier 3 — Cadrage IA */}
      <Reveal delay={0.1}>
        <div className="space-y-3">
          <AtelierTitle n={3} title="Cadrage IA" icon={ListChecks} />
          <DecisionBanner
            verdict={project.decision.verdict}
            total={score.total}
          />
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6 text-sm">
              <span className="text-muted-foreground">
                {project.decision.techRecommendation
                  ? `Technologie : ${project.decision.techRecommendation}`
                  : "Technologie à préciser"}
              </span>
              <Link
                href={`/projects/${project.id}/results`}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Détail de la décision
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </CardContent>
          </Card>
        </div>
      </Reveal>

      {/* Atelier 4 — Maturité + scores */}
      <Reveal delay={0.14}>
        <Atelier n={4} title="Maturité, risque & faisabilité" icon={Gauge}>
          <div className="space-y-3">
            {A.maturity.dimensions.map((d) => (
              <div key={d.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="font-medium tabular-nums">{d.score}/5</span>
                </div>
                <Bar pct={(d.score / 5) * 100} color="bg-primary" />
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ScoreCard label="Maturité" value={A.maturity.global} />
            <ScoreCard label="Risque" value={A.riskScore.value} invert sub={A.riskScore.level} />
            <ScoreCard label="Faisabilité" value={A.feasibilityScore.value} sub={A.feasibilityScore.label} />
          </div>
        </Atelier>
      </Reveal>

      {/* Atelier 5 — Cartographie IA */}
      <Reveal delay={0.18}>
        <Atelier n={5} title="Cartographie IA" icon={Polygon}>
          <TechRadar data={affinities} recommended={project.decision.techRecommendation} />
          <ul className="mt-4 space-y-2">
            {A.techMap.map((t) => (
              <li key={t.tech} className="flex items-start gap-2 text-sm">
                {t.needed ? (
                  <CheckCircle className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" aria-hidden />
                )}
                <span className={cn(!t.needed && "text-muted-foreground")}>
                  <span className="font-medium">{t.tech}</span>
                  {" — "}
                  {t.reason}
                </span>
              </li>
            ))}
          </ul>
        </Atelier>
      </Reveal>

      {/* Atelier 6 — Gouvernance & conformité */}
      <Reveal delay={0.22}>
        <Atelier n={6} title="Gouvernance, risques & conformité" icon={ShieldCheck}>
          <ul className="space-y-3">
            {A.governance.map((g, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                {g.status === "ok" ? (
                  <CheckCircle className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
                ) : g.status === "warn" ? (
                  <Warning className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <span>
                  <span className="font-medium">{g.label}.</span>{" "}
                  <span className="text-muted-foreground">{g.note}</span>
                </span>
              </li>
            ))}
          </ul>
        </Atelier>
      </Reveal>

      {/* Roadmap */}
      <Reveal delay={0.26}>
        <Atelier n={7} title="Roadmap" icon={MapTrifold}>
          <ol className="space-y-3">
            {A.roadmap.map((p, i) => (
              <li key={i} className="flex gap-3">
                <Badge variant="secondary" className="mt-0.5 h-6 shrink-0 rounded-full px-2 tabular-nums">
                  {p.duration}
                </Badge>
                <div>
                  <p className="text-sm font-medium">{p.phase}</p>
                  <p className="text-sm text-muted-foreground">{p.items.join(" · ")}</p>
                </div>
              </li>
            ))}
          </ol>
        </Atelier>
      </Reveal>

      {/* Recommandations */}
      <Reveal delay={0.3}>
        <Card className="border-primary/20 bg-accent/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recommandations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1.5 pl-5 text-sm">
              {A.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </Reveal>
    </PageContainer>
  )
}

function Atelier({
  n,
  title,
  icon: Icon,
  children,
}: {
  n: number
  title: string
  icon: Icon
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
            {n}
          </span>
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">{children}</CardContent>
    </Card>
  )
}

function AtelierTitle({
  n,
  title,
  icon: Icon,
}: {
  n: number
  title: string
  icon: Icon
}) {
  return (
    <div className="flex items-center gap-2 text-base font-semibold">
      <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
        {n}
      </span>
      <Icon className="size-4 text-muted-foreground" aria-hidden />
      {title}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="leading-relaxed">{children}</p>
    </div>
  )
}

function Chips({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label} :</span>
      {items.map((it, i) => (
        <Badge key={i} variant="secondary" className="font-normal">
          {it}
        </Badge>
      ))}
    </div>
  )
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

function ScoreCard({
  label,
  value,
  sub,
  invert = false,
}: {
  label: string
  value: number
  sub?: string
  invert?: boolean
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-lg font-semibold tabular-nums">{value}</span>
      </div>
      <div className="mt-1.5">
        <Bar pct={value} color={gaugeColor(value, invert)} />
      </div>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

function BackLink({ id }: { id: string }) {
  return (
    <Link
      href={`/projects/${id}/results`}
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Retour aux résultats
    </Link>
  )
}
