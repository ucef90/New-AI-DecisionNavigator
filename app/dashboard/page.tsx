import Link from "next/link"
import { Plus, FileText } from "@phosphor-icons/react/dist/ssr"

import type { Verdict, TechType } from "@prisma/client"

import { db } from "@/lib/db"
import {
  VERDICT_STYLES,
  TECH_SHORT,
} from "@/lib/decision/labels"
import { PageContainer, PageHeader } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Reveal } from "@/components/motion/reveal"
import { CountUp } from "@/components/motion/count-up"
import {
  ProjectsTable,
  type ProjectRow,
} from "@/components/dashboard/projects-table"
import { VerdictDonut, TechBars } from "@/components/dashboard/charts"

const VERDICT_ORDER: Verdict[] = ["GO", "POC", "STUDY", "AUTOMATION", "NOGO"]
const VERDICT_COLOR: Record<Verdict, string> = {
  GO: "#059669",
  POC: "#2563eb",
  STUDY: "#d97706",
  AUTOMATION: "#7c3aed",
  NOGO: "#e11d48",
}
const TECH_ORDER: TechType[] = ["RPA", "ML", "LLM", "RAG", "OCR", "AGENT"]

export const metadata = { title: "Tableau de bord" }

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

export default async function DashboardPage() {
  const projects = await db.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { decision: true },
  })

  const total = projects.length
  const highRisk = projects.filter(
    (p) => p.decision?.regulatoryLevel === "HIGH",
  ).length
  const decided = projects.filter((p) => p.decision).length

  const stats = [
    { label: "Projets cadrés", value: total },
    { label: "Décisions générées", value: decided },
    { label: "Risque réglementaire élevé", value: highRisk },
  ]

  const verdictData = VERDICT_ORDER.map((v) => ({
    label: VERDICT_STYLES[v].label,
    value: projects.filter((p) => p.decision?.verdict === v).length,
    color: VERDICT_COLOR[v],
  })).filter((d) => d.value > 0)

  const techData = TECH_ORDER.map((t) => ({
    label: TECH_SHORT[t],
    value: projects.filter((p) => p.decision?.techRecommendation === t).length,
  })).filter((d) => d.value > 0)

  const rows: ProjectRow[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    direction: p.direction,
    verdict: p.decision?.verdict ?? null,
    tech: p.decision?.techRecommendation ?? null,
    level: p.decision?.regulatoryLevel ?? null,
    date: dateFmt.format(p.createdAt),
  }))

  return (
    <PageContainer>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de vos projets de pré-cadrage IA."
        actions={
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="size-4" weight="bold" aria-hidden />
              Nouveau projet
            </Link>
          </Button>
        }
      />

      {total === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          <Reveal>
            <div className="flex divide-x rounded-xl border">
              {stats.map((s) => (
                <div key={s.label} className="flex-1 px-6 py-5">
                  <CountUp
                    value={s.value}
                    className="text-3xl font-semibold tabular-nums"
                  />
                  <div className="mt-1 text-sm text-muted-foreground">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {decided > 0 ? (
            <Reveal delay={0.08}>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Répartition des décisions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VerdictDonut data={verdictData} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Technologies recommandées
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {techData.length > 0 ? (
                      <TechBars data={techData} />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Aucune technologie recommandée pour l&apos;instant.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </Reveal>
          ) : null}

          <Reveal delay={0.12}>
            <Card>
              <CardContent className="p-0">
                <ProjectsTable projects={rows} />
              </CardContent>
            </Card>
          </Reveal>
        </div>
      )}
    </PageContainer>
  )
}

function EmptyState() {
  return (
    <Reveal>
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <FileText className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold">
            Aucun projet pour l&apos;instant
          </h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Démarrez votre premier pré-cadrage : décrivez le besoin, répondez à
            10 questions, obtenez une décision argumentée en moins de 15 minutes.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="size-4" weight="bold" aria-hidden />
            Créer un projet
          </Link>
        </Button>
      </div>
    </Reveal>
  )
}
