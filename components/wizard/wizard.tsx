"use client"

import { useMemo, useState, useTransition } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Sparkle,
  CircleNotch,
  FolderOpen,
} from "@phosphor-icons/react/dist/ssr"

import {
  getQuestionSequence,
  getActiveMainQuestions,
  type AnswerMap,
} from "@/lib/questions"
import type { ReformulationResult } from "@/lib/prompts/reformulate"
import type { ContextResult } from "@/lib/prompts/context"
import { cn } from "@/lib/utils"
import {
  saveAnswer,
  reformulateQ1,
  completeWizard,
} from "@/app/projects/[id]/wizard/actions"
import { analyzeContext } from "@/app/projects/[id]/actions"
import { QuestionInput } from "@/components/wizard/question-input"
import {
  ProjectDocuments,
  type DocItem,
} from "@/components/projects/project-documents"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

function isAnswered(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) return value.length > 0
  return typeof value === "string" && value.trim().length > 0
}

export function Wizard({
  projectId,
  projectName,
  initialAnswers,
  initialDocuments,
  initialContext,
}: {
  projectId: string
  projectName: string
  initialAnswers: AnswerMap
  initialDocuments: DocItem[]
  initialContext: ContextResult | null
}) {
  const reduce = useReducedMotion()
  const [answers, setAnswers] = useState<AnswerMap>(initialAnswers)
  const [direction, setDirection] = useState(1)
  const [reformulation, setReformulation] = useState<ReformulationResult | null>(
    null,
  )
  const [analyzedText, setAnalyzedText] = useState<string | null>(null)
  const [context, setContext] = useState<ContextResult | null>(initialContext)
  const [reformPending, startReform] = useTransition()
  const [savePending, startSave] = useTransition()
  const [navPending, startNav] = useTransition()
  const [ctxPending, startCtx] = useTransition()

  const sequence = useMemo(() => getQuestionSequence(answers), [answers])
  // Nombre de questions principales réellement affichées (certaines sont
  // masquées dynamiquement selon les réponses) — pour l'indicateur de progression.
  const mainCount = useMemo(
    () => getActiveMainQuestions(answers).length,
    [answers],
  )

  // Étape 0 = Contexte ; étapes 1..N = questions.
  const [step, setStep] = useState(() => {
    const seq = getQuestionSequence(initialAnswers)
    const answeredCount = seq.filter((q) =>
      isAnswered(initialAnswers[q.key]),
    ).length
    if (answeredCount === 0) return 0 // nouveau projet → Contexte
    const fu = seq.findIndex((q) => !isAnswered(initialAnswers[q.key]))
    return fu === -1 ? 1 : 1 + fu
  })

  const onContext = step === 0
  const qIndex = step - 1
  const current = sequence[Math.min(Math.max(qIndex, 0), sequence.length - 1)]
  const value = onContext ? undefined : answers[current.key]
  const answered = onContext ? true : isAnswered(value)
  const isRegulatory = !onContext && current.block === "Réglementation"
  const isLastQuestion = step === sequence.length

  const setValue = (v: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [current.key]: v }))
    if (current.type !== "text") {
      startSave(() => {
        saveAnswer(projectId, current.key, v)
      })
    }
    if (current.key === "Q1") {
      setReformulation(null)
      setAnalyzedText(null)
    }
  }

  const goTo = (next: number, dir: number) => {
    setDirection(dir)
    setStep(next)
    setReformulation(null)
  }

  const handleAnalyzeContext = () => {
    startCtx(async () => {
      const res = await analyzeContext(projectId)
      if (res) {
        setContext(res)
        // Pré-remplit, à partir du contexte, les questions textuelles si vides
        setAnswers((prev) => {
          const next = { ...prev }
          if (!isAnswered(next.Q1) && res.businessNeed) next.Q1 = res.businessNeed
          if (!isAnswered(next.Q15) && res.processes.length > 0)
            next.Q15 = res.processes.join(" ; ")
          return next
        })
      }
    })
  }

  const handleAnalyzeQ1 = () => {
    const text = (value as string)?.trim() ?? ""
    if (!text) return
    startReform(async () => {
      const result = await reformulateQ1(projectId, text)
      setReformulation(result)
      setAnalyzedText(text)
    })
  }

  const handleNext = () => {
    if (onContext) {
      goTo(1, 1)
      return
    }
    if (
      current.key === "Q1" &&
      analyzedText !== ((value as string)?.trim() ?? "")
    ) {
      handleAnalyzeQ1()
      return
    }
    if (current.type === "text" && current.key !== "Q1") {
      startSave(() => {
        saveAnswer(projectId, current.key, (value as string) ?? "")
      })
    }
    if (isLastQuestion) {
      startNav(async () => {
        await completeWizard(projectId)
      })
      return
    }
    goTo(step + 1, 1)
  }

  const handlePrev = () => {
    if (step === 0) return
    goTo(step - 1, -1)
  }

  const totalSteps = sequence.length + 1
  const progressLabel = onContext
    ? "Contexte du projet"
    : isRegulatory
      ? `Réglementation · ${step - mainCount} sur ${sequence.length - mainCount}`
      : `Question ${step} sur ${mainCount}`
  const percent = ((step + 1) / totalSteps) * 100

  const q1NeedsAnalysis =
    !onContext &&
    current.key === "Q1" &&
    analyzedText !== ((value as string)?.trim() ?? "") &&
    answered

  const xOffset = reduce ? 0 : 24

  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="mb-3 truncate text-sm font-medium text-muted-foreground">
        {projectName}
      </p>

      <div className="mb-8 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">
            {progressLabel}
          </span>
          <SaveStatus pending={savePending} />
        </div>
        <Progress value={percent} className="h-1.5" />
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={onContext ? "__context" : current.key}
          initial={{ opacity: 0, x: direction * xOffset }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -direction * xOffset }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          {onContext ? (
            <ContextStep
              projectId={projectId}
              documents={initialDocuments}
              context={context}
              pending={ctxPending}
              onAnalyze={handleAnalyzeContext}
            />
          ) : (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">
                {current.block}
              </p>
              <h1 className="mb-2 text-xl font-semibold tracking-tight text-balance">
                {current.label}
              </h1>
              {current.help ? (
                <p className="mb-5 text-sm text-muted-foreground">
                  {current.help}
                </p>
              ) : (
                <div className="mb-5" />
              )}

              <QuestionInput
                question={current}
                value={value}
                onChange={setValue}
              />

              {current.key === "Q1" && reformulation ? (
                <ReformulationPanel result={reformulation} />
              ) : null}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between border-t pt-5">
        <Button
          variant="ghost"
          onClick={handlePrev}
          disabled={step === 0 || navPending}
          className={cn(step === 0 && "invisible")}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Précédent
        </Button>

        <Button
          onClick={handleNext}
          disabled={(!onContext && !answered) || reformPending || navPending}
        >
          {reformPending ? (
            <>
              <CircleNotch className="size-4 animate-spin" aria-hidden />
              Analyse…
            </>
          ) : q1NeedsAnalysis ? (
            <>
              <Sparkle className="size-4" aria-hidden />
              Analyser ma réponse
            </>
          ) : onContext ? (
            <>
              Commencer le questionnaire
              <ArrowRight className="size-4" aria-hidden />
            </>
          ) : isLastQuestion ? (
            navPending ? (
              <>
                <CircleNotch className="size-4 animate-spin" aria-hidden />
                Finalisation…
              </>
            ) : (
              <>
                Terminer le parcours
                <ArrowRight className="size-4" aria-hidden />
              </>
            )
          ) : (
            <>
              Suivant
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function ContextStep({
  projectId,
  documents,
  context,
  pending,
  onAnalyze,
}: {
  projectId: string
  documents: DocItem[]
  context: ContextResult | null
  pending: boolean
  onAnalyze: () => void
}) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
        <FolderOpen className="size-3.5" aria-hidden />
        Contexte du projet
      </p>
      <h1 className="mb-2 text-xl font-semibold tracking-tight text-balance">
        Documents &amp; contexte
      </h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Importez les documents utiles (cadrage, note PPNUM, fiche projet…). L'outil
        les lit pour comprendre le besoin et adapter le questionnaire. Sans
        document, l'analyse se basera sur la description du projet.
      </p>

      <ProjectDocuments projectId={projectId} documents={documents} />

      <div className="mt-5">
        <Button
          variant="outline"
          onClick={onAnalyze}
          disabled={pending}
          className="w-full sm:w-auto"
        >
          {pending ? (
            <>
              <CircleNotch className="size-4 animate-spin" aria-hidden />
              Analyse du contexte…
            </>
          ) : (
            <>
              <Sparkle className="size-4" aria-hidden />
              {context ? "Réanalyser le contexte" : "Analyser le contexte"}
            </>
          )}
        </Button>
      </div>

      {context ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 space-y-3 rounded-lg border bg-accent/40 p-4 text-sm"
        >
          <div className="flex items-center gap-2 font-medium text-primary">
            <Sparkle className="size-4" weight="fill" aria-hidden />
            Compréhension du contexte
          </div>
          <p className="leading-relaxed">{context.summary}</p>
          {context.businessNeed ? (
            <p>
              <span className="font-medium">Besoin identifié : </span>
              <span className="text-muted-foreground">{context.businessNeed}</span>
            </p>
          ) : null}
          <ChipList label="Processus" items={context.processes} />
          <ChipList label="Données" items={context.dataPoints} />
          <ChipList label="Enjeux" items={context.stakes} />
          <p className="pt-1 text-xs text-muted-foreground">
            La description du besoin (Q1) a été pré-remplie à partir de cette
            analyse — vous pourrez l'ajuster.
          </p>
        </motion.div>
      ) : null}
    </div>
  )
}

function ChipList({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label} :</span>
      {items.map((it, i) => (
        <Badge key={i} variant="secondary" className="font-normal">
          {it}
        </Badge>
      ))}
    </div>
  )
}

function SaveStatus({ pending }: { pending: boolean }) {
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      {pending ? (
        <>
          <CircleNotch className="size-3 animate-spin" aria-hidden />
          Enregistrement…
        </>
      ) : (
        <>
          <CheckCircle className="size-3 text-emerald-600" aria-hidden />
          Enregistré
        </>
      )}
    </span>
  )
}

function ReformulationPanel({ result }: { result: ReformulationResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mt-5 space-y-3 rounded-lg border bg-accent/50 p-4"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Sparkle className="size-4" weight="fill" aria-hidden />
        Reformulation du besoin
      </div>

      {result.isSolutionOriented ? (
        <p className="text-sm text-muted-foreground">
          Vous décrivez plutôt une solution que le problème. Voici le besoin
          reformulé :
        </p>
      ) : null}

      <p className="text-sm leading-relaxed">{result.problemReformulated}</p>

      {result.clarifyingQuestion ? (
        <p className="text-sm text-muted-foreground">
          Pour préciser : {result.clarifyingQuestion}
        </p>
      ) : null}

      {result.detectedSignals.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-muted-foreground">
            Signaux détectés :
          </span>
          {result.detectedSignals.map((sig) => (
            <Badge key={sig} variant="secondary" className="font-normal">
              {sig}
            </Badge>
          ))}
        </div>
      ) : null}
    </motion.div>
  )
}
