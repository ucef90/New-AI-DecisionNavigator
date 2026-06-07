"use server"

import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth"
import { reindexExisting, seedReferenceKnowledge } from "@/lib/rag"

/** (Ré)indexe le corpus de référence uniquement. */
export async function seedKnowledge(): Promise<void> {
  await requireUser()
  await seedReferenceKnowledge()
  revalidatePath("/knowledge")
}

/** Réindexe TOUTES les sources (référentiel + documents + analyses + décisions). */
export async function reindexKnowledge(): Promise<void> {
  await requireUser()
  await reindexExisting()
  revalidatePath("/knowledge")
}
