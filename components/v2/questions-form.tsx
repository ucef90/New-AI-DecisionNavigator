"use client"

import { useFormState, useFormStatus } from "react-dom"
import { CircleNotch } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import type { V2State } from "@/app/projects/[id]/cadrage-v2/actions"
import type { GeneratedQuestion } from "@/lib/prompts/framework"

const SOCLE_TITLES: Record<number, string> = {
  1: "Socle 1 — Analyse métier",
  2: "Socle 2 — IA ou automatisation ?",
  3: "Socle 3 — Questionnaire de cadrage",
  4: "Socle 4 — Scoring & maturité",
  5: "Socle 5 — Cartographie IA",
  6: "Socle 6 — Gouvernance & conformité",
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? (
        <>
          <CircleNotch className="size-4 animate-spin" aria-hidden />
          Analyse en cours…
        </>
      ) : (
        "Calculer le score & la décision"
      )}
    </Button>
  )
}

export function QuestionsForm({
  questions,
  action,
}: {
  questions: GeneratedQuestion[]
  action: (prev: V2State, form: FormData) => Promise<V2State>
}) {
  const [state, formAction] = useFormState(action, {})

  // Regroupe par socle, dans l'ordre.
  const bySocle = new Map<number, GeneratedQuestion[]>()
  for (const q of questions) {
    const arr = bySocle.get(q.socle) ?? []
    arr.push(q)
    bySocle.set(q.socle, arr)
  }
  const socles = Array.from(bySocle.keys()).sort((a, b) => a - b)

  return (
    <form action={formAction} className="space-y-8">
      {socles.map((socle) => (
        <div key={socle} className="space-y-4">
          <h3 className="text-sm font-semibold text-primary">
            {SOCLE_TITLES[socle] ?? `Socle ${socle}`}
          </h3>
          {(bySocle.get(socle) ?? []).map((q) => (
            <div key={q.id} className="space-y-1.5 rounded-lg border p-4">
              <label
                htmlFor={`q_${q.id}`}
                className="block text-sm font-medium"
              >
                {q.question}
              </label>
              {q.pourquoi ? (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Pourquoi :</span> {q.pourquoi}
                </p>
              ) : null}

              {q.type === "scale" ? (
                <select
                  id={`q_${q.id}`}
                  name={`q_${q.id}`}
                  defaultValue=""
                  className="h-9 w-40 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="">— Note 1 à 5 —</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={String(n)}>
                      {n}
                    </option>
                  ))}
                </select>
              ) : q.type === "boolean" ? (
                <select
                  id={`q_${q.id}`}
                  name={`q_${q.id}`}
                  defaultValue=""
                  className="h-9 w-40 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="">— Oui / Non —</option>
                  <option value="Oui">Oui</option>
                  <option value="Non">Non</option>
                </select>
              ) : (
                <textarea
                  id={`q_${q.id}`}
                  name={`q_${q.id}`}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Votre réponse…"
                />
              )}

              {q.impact_decision ? (
                <p className="text-[11px] italic text-muted-foreground">
                  Impact : {q.impact_decision}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ))}

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="sticky bottom-4 flex justify-end">
        <SubmitButton />
      </div>
    </form>
  )
}
