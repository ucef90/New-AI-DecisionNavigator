"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/auth"

export interface CreateProjectState {
  error?: string
}

export async function createProjectAction(
  _prev: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const name = String(formData.get("name") ?? "").trim()
  const direction = String(formData.get("direction") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()

  if (name.length < 2) {
    return { error: "Le nom du projet est obligatoire (2 caractères minimum)." }
  }

  const userId = await getCurrentUserId()

  const project = await db.project.create({
    data: {
      userId,
      name,
      direction: direction || null,
      description: description || null,
      status: "IN_PROGRESS",
    },
  })

  await db.auditLog.create({
    data: {
      projectId: project.id,
      userId,
      action: "PROJECT_CREATED",
      detail: { name },
    },
  })

  revalidatePath("/dashboard")
  redirect(`/projects/${project.id}/wizard`)
}
