import Link from "next/link"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr"

import { PageContainer } from "@/components/layout/page-container"
import { Reveal } from "@/components/motion/reveal"
import { NewProjectForm } from "@/components/projects/new-project-form"
import { requireUser } from "@/lib/auth"

export const metadata = { title: "Nouveau projet" }

export default async function NewProjectPage() {
  await requireUser()
  return (
    <PageContainer className="max-w-xl">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Tableau de bord
      </Link>

      <Reveal>
        <div className="mb-8 space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            Nouveau projet de pré-cadrage
          </h1>
          <p className="text-sm text-muted-foreground">
            Quelques informations pour démarrer. Le parcours complet prend moins
            de 15 minutes.
          </p>
        </div>
        <NewProjectForm />
      </Reveal>
    </PageContainer>
  )
}
