import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import type { AnswerMap } from "@/lib/questions"
import { PageContainer } from "@/components/layout/page-container"
import { Wizard } from "@/components/wizard/wizard"

export const metadata = { title: "Parcours de cadrage" }

export default async function WizardPage({
  params,
}: {
  params: { id: string }
}) {
  const project = await db.project.findUnique({
    where: { id: params.id },
    include: { answers: true },
  })

  if (!project) notFound()

  const initialAnswers: AnswerMap = {}
  for (const a of project.answers) {
    initialAnswers[a.questionKey] = a.value as string | string[]
  }

  return (
    <PageContainer>
      <Wizard
        projectId={project.id}
        projectName={project.name}
        initialAnswers={initialAnswers}
      />
    </PageContainer>
  )
}
