"use client"

import { useTransition } from "react"
import { Trash, CircleNotch } from "@phosphor-icons/react/dist/ssr"

import { deleteProject } from "@/app/projects/[id]/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string
  projectName: string
}) {
  const [pending, start] = useTransition()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash className="size-4" aria-hidden />
          Supprimer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer ce projet ?</DialogTitle>
          <DialogDescription>
            « {projectName} » et toutes ses données (réponses, décision, alertes,
            documents) seront définitivement supprimés. Cette action est
            irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              start(() => {
                deleteProject(projectId)
              })
            }
          >
            {pending ? (
              <>
                <CircleNotch className="size-4 animate-spin" aria-hidden />
                Suppression…
              </>
            ) : (
              <>
                <Trash className="size-4" aria-hidden />
                Supprimer définitivement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
