"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFormState, useFormStatus } from "react-dom"
import { UploadSimple, CircleNotch } from "@phosphor-icons/react/dist/ssr"

import { analyzeVendor } from "@/app/projects/[id]/vendor/actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <CircleNotch className="size-4 animate-spin" aria-hidden />
          Analyse en cours…
        </>
      ) : (
        <>
          <UploadSimple className="size-4" aria-hidden />
          Analyser le document
        </>
      )}
    </Button>
  )
}

export function VendorForm({ projectId }: { projectId: string }) {
  const [state, formAction] = useFormState(analyzeVendor, {})
  const router = useRouter()

  // Rafraîchit la page pour afficher la nouvelle analyse.
  useEffect(() => {
    if (state.ok) router.refresh()
  }, [state.ok, router])

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="space-y-2">
        <Label htmlFor="file">Document fournisseur (PDF ou .txt)</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.txt"
          className="block w-full cursor-pointer rounded-md border border-input bg-transparent text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent"
        />
      </div>

      <div className="relative text-center">
        <span className="bg-background px-2 text-xs text-muted-foreground">
          ou collez le texte
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="text">Texte de la proposition</Label>
        <Textarea
          id="text"
          name="text"
          rows={6}
          placeholder="Collez ici le contenu de la proposition commerciale ou de la réponse à l'appel d'offres…"
          className="resize-none"
        />
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
