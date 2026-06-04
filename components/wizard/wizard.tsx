"use client"

import { useMemo, useState, useTransition } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Sparkle,
  CircleNotch,
} from "@phosphor-icons/react/dist/ssr"

import {
  getQuestionSequence,
  TOTAL_MAIN,
  type AnswerMap,
} from "@/lib/questions"
import type { ReformulationResult } from "@/lib/prompts/reformulate"
import { cn } from "@/lib/utils"
import { saveAnswer, reformulateQ1, completeWizard } from "@/app/projects/[id]/wizard/actions"
import { QuestionInput } from "@/components/wizard/question-input"
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
}: {
  projectId: string
  projectName: string
  initialAnswers: AnswerMap
}) {
  const reduce = useReducedMotion()
  const [answers, setAnswers] = useState<AnswerMap>(initialAnswers)
  const [direction, setDirection] = useState(1)
  const [reformulation, setReformulation] = useState<ReformulationResult | null>(
    null,
  )
  const [analyzedText, setAnalyzedText] = useState<string | null>(null)
  const [reformPending, startReform] = useTransition()
  const [savePending, startSave] = useTransition()
  const [navPending, startNav] = useTransition()

  const sequence = useMemo(() => getQuestionSequence(answers), [answers])

  const [step, setStep] = useState(() => {
    const seq = getQuestionSequence(initialAnswers)
    const firstUnanswered = seq.findIndex((q) => !isAnswered(initialAnswers[q.key]))
    return firstUnanswered === -1 ? 0 : firstUnanswered
  })

  const current = sequence[Math.min(step, sequence.length - 1)]
  const value = answers[current.key]
  const answered = isAnswered(value)
  const isRegulatory = current.block === "Réglementation"
  const isLast = step === sequence.length - 1
  const regCount = sequence.length - TOTAL_MAIN

  const setValue = (v: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [current.key]: v }))
    if (current.type !== "text") {
      startSave(() => {
        saveAnswer(projectId, current.key, v)
      })
    }
    // toute modif de Q1 invalide la reformulation précédente
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
    // Q1 : exiger une analyse avant d'avancer
    if (current.key === "Q1" && analyzedText !== ((value as string)?.trim() ?? "")) {
      handleAnalyzeQ1()
      return
    }
    if (current.type === "text" && current.key !== "Q1") {
      startSave(() => {
        saveAnswer(projectId, current.key, (value as string) ?? "")
      })
    }
    if (isLast) {
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

  // libellé de progression
  const progressLabel = isRegulatory
    ? `Réglementation · ${step - TOTAL_MAIN + 1} sur ${regCount}`
    : `Question ${step + 1} sur ${TOTAL_MAIN}`
  const percent = ((step + 1) / sequence.length) * 100

  const q1NeedsAnalysis =
    current.key === "Q1" &&
    analyzedText !== ((value as string)?.trim() ?? "") &&
    answered

  const xOffset = reduce ? 0 : 24

  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="mb-3 truncate text-sm font-medium text-muted-foreground">
        {projectName}
      </p>

      {/* Progression */}
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
          key={current.key}
          initial={{ opacity: 0, x: direction * xOffset }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -direction * xOffset }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">
            {current.block}
          </p>
          <h1 className="mb-2 text-xl font-semibold tracking-tight text-balance">
            {current.label}
          </h1>
          {current.help ? (
            <p className="mb-5 text-sm text-muted-foreground">{current.help}</p>
          ) : (
            <div className="mb-5" />
          )}

          <QuestionInput
            question={current}
            value={value}
            onChange={setValue}
          />

          {/* Panneau de reformulation Q1 */}
          {current.key === "Q1" && reformulation ? (
            <ReformulationPanel result={reformulation} />
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
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
          disabled={!answered || reformPending || navPending}
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
          ) : isLast ? (
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
          {result.detectedSignals.map((s) => (
            <Badge key={s} variant="secondary" className="font-normal">
              {s}
            </Badge>
          ))}
        </div>
      ) : null}
    </motion.div>
  )
}
