"use server"

import { revalidatePath } from "next/cache"

import {
  updateAppSettings,
  LLM_MODES,
  EMBEDDING_MODES,
  type AppSettings,
  type LlmMode,
  type EmbeddingMode,
} from "@/lib/settings"

/**
 * Enregistre le choix du fournisseur LLM depuis la page Paramètres.
 * Les clés API laissées vides ne sont PAS écrasées (on conserve l'existante).
 */
export async function updateLlmSettings(formData: FormData): Promise<void> {
  const get = (k: string) => (formData.get(k)?.toString() ?? "").trim()

  const rawMode = get("llmMode")
  const llmMode = (LLM_MODES as string[]).includes(rawMode)
    ? (rawMode as LlmMode)
    : "auto"

  const rawEmbed = get("embeddingMode")
  const embeddingMode = (EMBEDDING_MODES as string[]).includes(rawEmbed)
    ? (rawEmbed as EmbeddingMode)
    : "auto"

  const partial: Partial<AppSettings> = {
    llmMode,
    anthropicModel: get("anthropicModel"),
    ollamaBaseUrl: get("ollamaBaseUrl"),
    ollamaModel: get("ollamaModel"),
    openaiModel: get("openaiModel"),
    openaiBaseUrl: get("openaiBaseUrl"),
    mistralModel: get("mistralModel"),
    embeddingMode,
    ollamaEmbedModel: get("ollamaEmbedModel"),
    openaiEmbedModel: get("openaiEmbedModel"),
  }

  // Clés sensibles : ne les écrire que si une nouvelle valeur est fournie.
  const anthropicApiKey = get("anthropicApiKey")
  if (anthropicApiKey) partial.anthropicApiKey = anthropicApiKey
  const openaiApiKey = get("openaiApiKey")
  if (openaiApiKey) partial.openaiApiKey = openaiApiKey
  const mistralApiKey = get("mistralApiKey")
  if (mistralApiKey) partial.mistralApiKey = mistralApiKey

  await updateAppSettings(partial)
  revalidatePath("/settings")
}
