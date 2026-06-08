import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Gear, Sparkle } from "@phosphor-icons/react/dist/ssr"

import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { resolveActiveProviderName } from "@/lib/llm"
import { PageContainer, PageHeader } from "@/components/layout/page-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { StepButton } from "@/components/v2/step-button"
import { QuestionsForm } from "@/components/v2/questions-form"
import { V2Results } from "@/components/v2/v2-results"
import type {
  DocAnalysis,
  GeneratedQuestion,
  ScoringResult,
} from "@/lib/prompts/framework"
import {
  resetV2,
  runAnalyze,
  runQuestions,
  runReport,
  submitAnswers,
} from "./actions"

export const metadata = { title: "Cadrage V2 — Framework 6 socles" }

const STEPS = ["Analyse", "Questions", "Scoring", "Rapport"]
const STEP_INDEX: Record<string, number> = {
  CREATED: 0,
  ANALYZED: 1,
  QUESTIONS: 1,
  SCORED: 2,
  REPORTED: 3,
}

export default async function CadrageV2Page({
  params,
}: {
  params: { id: string }
}) {
  await requireUser()
  const project = await db.project.findUnique({
    where: { id: params.id },
    include: { attachments: true, frameworkAssessment: true },
  })
  if (!project) notFound()

  const a = project.frameworkAssessment
  const status = a?.status ?? "CREATED"
  const docAnalysis = (a?.docAnalysis as unknown as DocAnalysis | null) ?? null
  const questions = (a?.questions as unknown as GeneratedQuestion[] | null) ?? []
  const scoring = (a?.scoring as unknown as ScoringResult | null) ?? null

  const isStub = (await resolveActiveProviderName()) === "stub"
  const nbDocs = project.attachments.filter((x) => x.text?.trim()).length
  const current = STEP_INDEX[status] ?? 0

  const reset = resetV2.bind(null, project.id)

  return (
    <PageContainer className="max-w-4xl space-y-6">
      <Link
        href={`/projects/${project.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour au projet
      </Link>

      <PageHeader
        title="Cadrage V2 — Framework 6 socles"
        description="Analyse documentaire → questions personnalisées → scoring 11 axes → décision GO/NO GO, pilotée par le framework méthodologique."
        actions={
          a ? (
            <form action={reset}>
              <Button type="submit" variant="outline" size="sm">
                Recommencer
              </Button>
            </form>
          ) : undefined
        }
      />

      {/* Stepper */}
      <div className="flex items-center gap-2 text-xs">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full font-semibold",
                i < current
                  ? "bg-primary text-primary-foreground"
                  : i === current
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {i + 1}
            </span>
            <span className={cn(i <= current ? "font-medium" : "text-muted-foreground")}>{s}</span>
            {i < STEPS.length - 1 ? <span className="text-muted-foreground">→</span> : null}
          </div>
        ))}
      </div>

      {isStub ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
          <Gear className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p>Aucun moteur IA réel n&apos;est configuré — le cadrage V2 ne pourra pas s&apos;exécuter.</p>
            <Link href="/settings" className="font-medium underline">
              Configurer Anthropic / Ollama dans Paramètres
            </Link>
          </div>
        </div>
      ) : null}

      {/* Étape 1 — Analyse documentaire */}
      {status === "CREATED" ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Étape 1 — Analyser les documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {nbDocs > 0
                ? `${nbDocs} document(s) exploitable(s) détecté(s). L'analyse extrait le problème métier, les tâches, métriques, contraintes et zones floues.`
                : "Aucun document exploitable. Importe d'abord des documents de cadrage (page projet) avant de lancer l'analyse."}
            </p>
            <StepButton
              action={runAnalyze.bind(null, project.id)}
              label="Lancer l'analyse documentaire"
              pendingLabel="Analyse en cours…"
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Étape 2 — Générer les questions */}
      {status === "ANALYZED" && docAnalysis ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Étape 2 — Questions personnalisées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5 text-sm">
              <p><span className="font-medium">Problème métier : </span><span className="text-muted-foreground">{docAnalysis.probleme_metier || "non mentionné"}</span></p>
              {docAnalysis.zones_floues.length > 0 ? (
                <p><span className="font-medium">Zones floues : </span><span className="text-muted-foreground">{docAnalysis.zones_floues.join(" · ")}</span></p>
              ) : null}
            </div>
            <StepButton
              action={runQuestions.bind(null, project.id)}
              label="Générer 20 questions de cadrage"
              pendingLabel="Génération en cours…"
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Étape 2b — Répondre aux questions */}
      {status === "QUESTIONS" && questions.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkle className="size-4 text-violet-500" weight="fill" aria-hidden />
              {questions.length} questions de cadrage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionsForm
              questions={questions}
              action={submitAnswers.bind(null, project.id)}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Étape 3/4 — Résultats + rapport */}
      {(status === "SCORED" || status === "REPORTED") && scoring ? (
        <div className="space-y-6">
          <V2Results scoring={scoring} report={a?.report} />
          {status === "SCORED" ? (
            <StepButton
              action={runReport.bind(null, project.id)}
              label="Générer le rapport de cadrage"
              pendingLabel="Rédaction du rapport…"
            />
          ) : null}
        </div>
      ) : null}
    </PageContainer>
  )
}
