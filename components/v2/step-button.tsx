"use client"

import { useFormState, useFormStatus } from "react-dom"
import { CircleNotch } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import type { V2State } from "@/app/projects/[id]/cadrage-v2/actions"

function Submit({
  label,
  pendingLabel,
  variant,
}: {
  label: string
  pendingLabel: string
  variant?: "default" | "outline" | "secondary"
}) {
  const { pending } = useFormStatus()
  return (
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
  )
}

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
  const [state, formAction] = useFormState(action, {})
  return (
    <form action={formAction} className="space-y-2">
      <Submit label={label} pendingLabel={pendingLabel} variant={variant} />
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  )
}
