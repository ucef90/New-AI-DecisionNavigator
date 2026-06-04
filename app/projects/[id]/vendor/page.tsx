import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr"

import { db } from "@/lib/db"
import { PageContainer } from "@/components/layout/page-container"
import { Reveal } from "@/components/motion/reveal"
import { Card, CardContent } from "@/components/ui/card"
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
      vendorAnalyses: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  })
  if (!project) notFound()

  const analysis = project.vendorAnalyses[0]

  return (
    <PageContainer className="max-w-3xl space-y-8">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Retour au projet
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Analyse d&apos;une proposition fournisseur
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Importez la proposition reçue : l&apos;outil l&apos;évalue au regard de
          votre projet et prépare les questions à poser.
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

      {analysis ? (
        <Reveal delay={0.08}>
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              Dernière analyse
            </h2>
            <VendorResult analysis={analysis} />
          </div>
        </Reveal>
      ) : null}
    </PageContainer>
  )
}
