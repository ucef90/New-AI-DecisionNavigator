import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Trash } from "@phosphor-icons/react/dist/ssr"

import { deleteVendorAnalysis } from "@/app/projects/[id]/vendor/actions"
import { db } from "@/lib/db"
import { PageContainer } from "@/components/layout/page-container"
import { Reveal } from "@/components/motion/reveal"
import { Card, CardContent } from "@/components/ui/card"
import { VendorComparison, type VendorRow } from "@/components/vendor/vendor-comparison"
import { VendorForm } from "@/components/vendor/vendor-form"
import { VendorResult } from "@/components/vendor/vendor-result"

export const metadata = { title: "Analyse fournisseur" }

export default async function VendorPage({
  params,
}: {
  params: { id: string }
}) {
  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      decision: true,
      vendorAnalyses: { orderBy: { createdAt: "desc" } },
    },
  })
  if (!project) notFound()

  const analyses = project.vendorAnalyses
  const rows: VendorRow[] = analyses.map((a) => ({
    id: a.id,
    label: a.documentName ?? "Offre",
    fitScore: a.fitScore,
    maturityScore: a.maturityScore,
    recommendation: a.recommendation,
    userScore: a.userScore,
  }))

  return (
    <PageContainer className="max-w-4xl space-y-8">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Retour au projet
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Analyse &amp; comparaison des propositions fournisseurs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Importez chaque proposition reçue : l&apos;outil les évalue au regard de
          votre projet, prépare les questions à poser, et vous aide à désigner la
          meilleure offre.
        </p>
      </div>

      {!project.decision ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Terminez d&apos;abord le parcours de cadrage : l&apos;analyse
            s&apos;appuie sur la décision et le profil de risque du projet.
          </CardContent>
        </Card>
      ) : (
        <Reveal>
          <Card>
            <CardContent className="pt-6">
              <VendorForm projectId={project.id} />
            </CardContent>
          </Card>
        </Reveal>
      )}

      {/* Tableau comparatif (dès 2 offres) */}
      {rows.length >= 2 ? (
        <Reveal delay={0.05}>
          <VendorComparison projectId={project.id} rows={rows} />
        </Reveal>
      ) : null}

      {/* Détail de chaque analyse */}
      {analyses.length > 0 ? (
        <Reveal delay={0.08}>
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              {analyses.length > 1
                ? `${analyses.length} analyses`
                : "Dernière analyse"}
            </h2>
            {analyses.map((a) => {
              const del = deleteVendorAnalysis.bind(null, project.id, a.id)
              return (
                <div key={a.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {a.documentName ?? "Offre"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.createdAt.toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <form action={del}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600"
                      >
                        <Trash className="size-3.5" aria-hidden />
                        Supprimer
                      </button>
                    </form>
                  </div>
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground">
                      Voir l&apos;analyse détaillée
                    </summary>
                    <div className="mt-4">
                      <VendorResult analysis={a} />
                    </div>
                  </details>
                </div>
              )
            })}
          </div>
        </Reveal>
      ) : null}
    </PageContainer>
  )
}
