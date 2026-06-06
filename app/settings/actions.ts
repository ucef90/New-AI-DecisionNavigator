"use server"

import { revalidatePath } from "next/cache"

import {
  updateAppSettings,
  LLM_MODES,
  EMBEDDING_MODES,
  type AppSettings,
  type LlmMode,
  type EmbeddingMode,
  type KnowledgeScope,
} from "@/lib/settings"

export interface SettingsState {
  ok?: boolean
  error?: string
}

/**
 * Enregistre le choix du fournisseur LLM depuis la page Paramètres.
 * Les clés API laissées vides ne sont PAS écrasées (on conserve l'existante).
 * Renvoie un état (pour afficher une confirmation côté formulaire).
 */
export async function updateLlmSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const get = (k: string) => (formData.get(k)?.toString() ?? "").trim()

  const rawMode = get("llmMode")
  const llmMode = (LLM_MODES as string[]).includes(rawMode)
    ? (rawMode as LlmMode)
    : "auto"

  const rawEmbed = get("embeddingMode")
  const embeddingMode = (EMBEDDING_MODES as string[]).includes(rawEmbed)
    ? (rawEmbed as EmbeddingMode)
    : "auto"

  const knowledgeScope: KnowledgeScope =
    get("knowledgeScope") === "project" ? "project" : "global"

  const sec = Number(get("llmTimeoutSec"))
  const llmTimeoutMs = Number.isFinite(sec)
    ? Math.max(10, Math.min(600, Math.round(sec))) * 1000
    : 180_000

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
    knowledgeScope,
    llmTimeoutMs,
  }

  // Clés sensibles : ne les écrire que si une nouvelle valeur est fournie.
  const anthropicApiKey = get("anthropicApiKey")
  if (anthropicApiKey) partial.anthropicApiKey = anthropicApiKey
  const openaiApiKey = get("openaiApiKey")
  if (openaiApiKey) partial.openaiApiKey = openaiApiKey
  const mistralApiKey = get("mistralApiKey")
  if (mistralApiKey) partial.mistralApiKey = mistralApiKey

  try {
    await updateAppSettings(partial)
    revalidatePath("/settings")
    return { ok: true }
  } catch (e) {
    console.error("[updateLlmSettings] échec:", e)
    return { error: "Échec de l'enregistrement. Réessayez." }
  }
}
