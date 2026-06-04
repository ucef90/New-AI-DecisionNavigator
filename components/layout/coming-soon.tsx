import { Wrench } from "@phosphor-icons/react/dist/ssr"

import { PageContainer } from "@/components/layout/page-container"

interface ComingSoonProps {
  title: string
  /** Session du plan qui livrera cet écran. */
  session: number
  description?: string
}

/**
 * Placeholder pour les écrans construits dans une session ultérieure.
 * Permet à toute la navigation de fonctionner dès la Session 1.
 */
export function ComingSoon({ title, session, description }: ComingSoonProps) {
  return (
    <PageContainer>
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Wrench className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {description ??
              "Cet écran sera construit dans une prochaine étape du projet."}
          </p>
        </div>
        <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Prévu en Session {session}
        </span>
      </div>
    </PageContainer>
  )
}
