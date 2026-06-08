"use client"

import { useActionState } from "react"
import { CircleNotch } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import type { V2State } from "@/app/projects/[id]/cadrage-v2/actions"

export function StepButton({
  action,
  label,
  pendingLabel,
  variant,
}: {
  action: (prev: V2State, form: FormData) => Promise<V2State>
  label: string
  pendingLabel: string
  variant?: "default" | "outline" | "secondary"
}) {
  const [state, formAction, pending] = useActionState<V2State, FormData>(
    action,
    {},
  )
  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" disabled={pending} variant={variant}>
        {pending ? (
          <>
            <CircleNotch className="size-4 animate-spin" aria-hidden />
            {pendingLabel}
          </>
        ) : (
          label
        )}
      </Button>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  )
}
