import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import type { AnswerMap } from "@/lib/questions"
import { parseContext, type ContextResult } from "@/lib/prompts/context"
import { PageContainer } from "@/components/layout/page-container"
import { Wizard } from "@/components/wizard/wizard"

export const metadata = { title: "Parcours de cadrage" }

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

export default async function WizardPage({
  params,
}: {
  params: { id: string }
}) {
  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      answers: true,
      attachments: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!project) notFound()

  const initialAnswers: AnswerMap = {}
  for (const a of project.answers) {
    initialAnswers[a.questionKey] = a.value as string | string[]
  }

  const initialDocuments = project.attachments.map((a) => ({
    id: a.id,
    name: a.name,
    size: a.size,
    date: dateFmt.format(a.createdAt),
  }))

  let initialContext: ContextResult | null = null
  if (project.contextBrief) {
    initialContext = parseContext(project.contextBrief)
  }

  return (
    <PageContainer>
      <Wizard
        projectId={project.id}
        projectName={project.name}
        initialAnswers={initialAnswers}
        initialDocuments={initialDocuments}
        initialContext={initialContext}
      />
    </PageContainer>
  )
}
