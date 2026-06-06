"use server"

import { revalidatePath } from "next/cache"

import { reindexExisting, seedReferenceKnowledge } from "@/lib/rag"

/** (Ré)indexe le corpus de référence uniquement. */
export async function seedKnowledge(): Promise<void> {
  await seedReferenceKnowledge()
  revalidatePath("/knowledge")
}

/** Réindexe TOUTES les sources (référentiel + documents + analyses + décisions). */
export async function reindexKnowledge(): Promise<void> {
  await reindexExisting()
  revalidatePath("/knowledge")
}
