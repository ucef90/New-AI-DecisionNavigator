"use client"

import { useFormState, useFormStatus } from "react-dom"
import { ArrowRight } from "@phosphor-icons/react/dist/ssr"

import { createProjectAction } from "@/app/projects/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Création…" : "Créer et démarrer le parcours"}
      {!pending && <ArrowRight className="size-4" aria-hidden />}
    </Button>
  )
}

export function NewProjectForm() {
  const [state, formAction] = useFormState(createProjectAction, {})

  return (
    <form action={formAction} className="space-y-7">
      <div className="space-y-2">
        <Label htmlFor="name">
          Nom du projet <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          required
          minLength={2}
          autoFocus
          placeholder="Ex. : Automatisation des demandes d'aide sociale"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="direction">Direction / service</Label>
        <Input
          id="direction"
          name="direction"
          placeholder="Ex. : MDPH, PMI, DSI…"
        />
        <p className="text-xs text-muted-foreground">
          Facultatif. Permet de regrouper les projets par service.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description courte</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="En une ou deux phrases, le contexte du projet."
        />
        <p className="text-xs text-muted-foreground">
          Facultatif. Vous décrirez le besoin en détail dans le parcours.
        </p>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  )
}
