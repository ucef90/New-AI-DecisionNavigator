"use client"

import { useEffect, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useFormState, useFormStatus } from "react-dom"
import {
  FileText,
  UploadSimple,
  Trash,
  CircleNotch,
} from "@phosphor-icons/react/dist/ssr"

import { uploadDocument, deleteDocument } from "@/app/projects/[id]/actions"
import { Button } from "@/components/ui/button"

export interface DocItem {
  id: string
  name: string
  size: number
  date: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? (
        <>
          <CircleNotch className="size-4 animate-spin" aria-hidden />
          Import…
        </>
      ) : (
        <>
          <UploadSimple className="size-4" aria-hidden />
          Importer
        </>
      )}
    </Button>
  )
}

export function ProjectDocuments({
  projectId,
  documents,
}: {
  projectId: string
  documents: DocItem[]
}) {
  const router = useRouter()
  const [state, formAction] = useFormState(uploadDocument, {})
  const [isDeleting, startDelete] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  // Réinitialise le champ fichier après un import réussi + rafraîchit la liste.
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset()
      router.refresh()
    }
  }, [state.ok, router])

  return (
    <div className="space-y-4">
      <form
        ref={formRef}
        action={formAction}
        className="flex flex-wrap items-center gap-3"
      >
        <input type="hidden" name="projectId" value={projectId} />
        <input
          name="file"
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,.csv"
          className="flex-1 cursor-pointer rounded-md border border-input bg-transparent text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent"
        />
        <SubmitButton />
      </form>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun document. Importez le cadrage du projet, une note PPNUM, ou tout
          document utile (PDF, txt).
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {documents.map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-3 px-3 py-2.5 text-sm"
            >
              <FileText
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="flex-1 truncate font-medium">{d.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {formatSize(d.size)} · {d.date}
              </span>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() =>
                  startDelete(async () => {
                    await deleteDocument(d.id, projectId)
                    router.refresh()
                  })
                }
                aria-label={`Supprimer ${d.name}`}
                className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
