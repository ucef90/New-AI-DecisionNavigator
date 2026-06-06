import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowRight,
  ClipboardText,
  FileText,
  UploadSimple,
} from "@phosphor-icons/react/dist/ssr"
import type { Icon } from "@phosphor-icons/react"

import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { TECH_SHORT } from "@/lib/decision/labels"
import { PageContainer, PageHeader } from "@/components/layout/page-container"
import { VerdictBadge, RegulatoryLevelBadge } from "@/components/decision/badges"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProjectDocuments } from "@/components/projects/project-documents"
import { DeleteProjectButton } from "@/components/projects/delete-project-button"

export const metadata = { title: "Projet" }

const STATUS_LABELS = {
  DRAFT: "Brouillon",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
} as const

export default async function ProjectPage({
  params,
}: {
  params: { id: string }
}) {
  await requireUser()
  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      decision: true,
      _count: { select: { answers: true } },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!project) notFound()

  const dateFmt = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const documents = project.attachments.map((a) => ({
    id: a.id,
    name: a.name,
    size: a.size,
    date: dateFmt.format(a.createdAt),
  }))

  const { decision } = project

  return (
    <PageContainer className="max-w-3xl space-y-8">
      <PageHeader
        title={project.name}
        description={
          project.direction
            ? `${project.direction} · ${project._count.answers} réponse(s)`
            : `${project._count.answers} réponse(s)`
        }
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{STATUS_LABELS[project.status]}</Badge>
            <DeleteProjectButton
              projectId={project.id}
              projectName={project.name}
            />
          </div>
        }
      />

      {project.description ? (
        <p className="-mt-4 max-w-[68ch] text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>
      ) : null}

      {decision ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Décision</CardTitle>
              <div className="flex items-center gap-2">
                {decision.techRecommendation ? (
                  <Badge variant="outline" className="font-normal">
                    {TECH_SHORT[decision.techRecommendation]}
                  </Badge>
                ) : null}
                <RegulatoryLevelBadge level={decision.regulatoryLevel} />
                <VerdictBadge verdict={decision.verdict} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-6">
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {decision.justification}
            </p>
            <Button asChild variant="outline" className="shrink-0">
              <Link href={`/projects/${project.id}/results`}>
                Voir les résultats
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Navigation du projet */}
      <div className="grid grid-cols-1 divide-y rounded-xl border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <NavTile
          href={`/projects/${project.id}/wizard`}
          icon={ClipboardText}
          title="Parcours"
          description="Répondre aux questions de cadrage."
        />
        <NavTile
          href={`/projects/${project.id}/results`}
          icon={FileText}
          title="Résultats"
          description="Décision, réglementation, rapport."
        />
        <NavTile
          href={`/projects/${project.id}/vendor`}
          icon={UploadSimple}
          title="Fournisseur"
          description="Analyser une proposition reçue."
        />
      </div>

      {/* Documents du projet */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Documents du projet</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectDocuments projectId={project.id} documents={documents} />
        </CardContent>
      </Card>
    </PageContainer>
  )
}

function NavTile({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: Icon
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 p-5 transition-colors hover:bg-muted/50"
    >
      <Icon
        className="size-5 text-muted-foreground transition-colors group-hover:text-primary"
        aria-hidden
      />
      <div className="space-y-0.5">
        <div className="flex items-center gap-1 text-sm font-medium">
          {title}
          <ArrowRight
            className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}
