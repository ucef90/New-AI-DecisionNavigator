import { Database, MagnifyingGlass, Sparkle, ArrowsClockwise } from "@phosphor-icons/react/dist/ssr"

import { PageContainer, PageHeader } from "@/components/layout/page-container"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { knowledgeStats, retrieve, SOURCE_LABELS } from "@/lib/rag"
import { seedKnowledge, reindexKnowledge } from "./actions"

export const metadata = { title: "Base de connaissances" }
export const dynamic = "force-dynamic"

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  await requireUser()
  const q = (searchParams.q ?? "").trim()

  const [stats, docs, results] = await Promise.all([
    knowledgeStats(),
    db.knowledgeDocument.findMany({
      orderBy: { updatedAt: "desc" },
      take: 40,
      select: {
        id: true,
        title: true,
        source: true,
        chunkCount: true,
        projectId: true,
        updatedAt: true,
      },
    }),
    q ? retrieve(q, { k: 6 }) : Promise.resolve([]),
  ])

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title="Base de connaissances"
        description="Le corpus interne qui enrichit l'IA : référentiel réglementaire, documents projet, analyses fournisseurs et décisions passées."
        actions={
          <div className="flex gap-2">
            <form action={seedKnowledge}>
              <Button type="submit" variant="outline" size="sm" className="gap-2">
                <Sparkle className="size-4" aria-hidden />
                Charger le référentiel
              </Button>
            </form>
            <form action={reindexKnowledge}>
              <Button type="submit" size="sm" className="gap-2">
                <ArrowsClockwise className="size-4" aria-hidden />
                Tout réindexer
              </Button>
            </form>
          </div>
        }
      />

      {/* Statistiques */}
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Stat label="Documents" value={stats.documents} />
        <Stat label="Fragments" value={stats.chunks} />
        <Stat label="Modèle d'embedding" value={stats.activeModel} mono />
        <Stat
          label="À réindexer"
          value={stats.staleChunks}
          warn={stats.staleChunks > 0}
        />
      </div>

      {stats.staleChunks > 0 ? (
        <p className="mb-6 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 text-xs text-foreground">
          {stats.staleChunks} fragment(s) proviennent d&apos;un autre modèle
          d&apos;embedding. Cliquez sur «&nbsp;Tout réindexer&nbsp;» pour les
          rendre interrogeables avec le modèle actuel.
        </p>
      ) : null}

      {/* Recherche sémantique de test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MagnifyingGlass className="size-4 text-muted-foreground" aria-hidden />
            Tester la recherche
          </CardTitle>
          <CardDescription>
            Interroge le corpus comme le fait l&apos;IA en interne (similarité
            sémantique).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="get" className="flex gap-2">
            <Input
              name="q"
              defaultValue={q}
              placeholder="ex : obligations RGPD pour une décision automatisée"
            />
            <Button type="submit">Rechercher</Button>
          </form>

          {q ? (
            results.length ? (
              <ul className="space-y-3">
                {results.map((r, i) => (
                  <li
                    key={`${r.documentId}-${i}`}
                    className="rounded-lg border bg-card p-3"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{r.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {SOURCE_LABELS[r.source]}
                        </Badge>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {(r.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <p className="line-clamp-3 text-xs text-muted-foreground">
                      {r.content}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun résultat. Le corpus est peut-être vide — chargez le
                référentiel ou réindexez.
              </p>
            )
          ) : null}
        </CardContent>
      </Card>

      {/* Liste des documents indexés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4 text-muted-foreground" aria-hidden />
            Documents indexés ({stats.documents})
          </CardTitle>
          <CardDescription>
            {stats.bySource
              .map((s) => `${SOURCE_LABELS[s.source]} : ${s.count}`)
              .join(" · ") || "Aucun document pour l'instant."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {docs.length ? (
            <ul className="divide-y">
              {docs.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span className="truncate">{d.title}</span>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">
                      {SOURCE_LABELS[d.source]}
                    </Badge>
                    <span>{d.chunkCount} frag.</span>
                    <span className="tabular-nums">
                      {dateFmt.format(d.updatedAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Base vide. Cliquez sur «&nbsp;Charger le référentiel&nbsp;» pour
              amorcer la base, puis «&nbsp;Tout réindexer&nbsp;» pour intégrer
              vos documents et analyses existants.
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}

function Stat({
  label,
  value,
  mono,
  warn,
}: {
  label: string
  value: number | string
  mono?: boolean
  warn?: boolean
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div
        className={`text-xl font-semibold ${mono ? "font-mono text-sm" : "tabular-nums"} ${
          warn ? "text-warning" : ""
        }`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
