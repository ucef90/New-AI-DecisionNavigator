import { db } from "@/lib/db"
import { encryptSecret, decryptSecret } from "@/lib/secret"

/** Champs sensibles : chiffrés en base, déchiffrés à la lecture. */
const SECRET_FIELDS = [
  "anthropicApiKey",
  "openaiApiKey",
  "mistralApiKey",
] as const

/** Mode de sélection du fournisseur LLM. */
export type LlmMode =
  | "auto"
  | "ollama"
  | "anthropic"
  | "openai"
  | "mistral"
  | "stub"

export const LLM_MODES: LlmMode[] = [
  "auto",
  "ollama",
  "anthropic",
  "openai",
  "mistral",
  "stub",
]

/** Fournisseur d'embeddings (RAG). */
export type EmbeddingMode = "auto" | "ollama" | "openai" | "hash"

export const EMBEDDING_MODES: EmbeddingMode[] = [
  "auto",
  "ollama",
  "openai",
  "hash",
]

/**
 * Périmètre d'indexation des connaissances dérivées (analyses fournisseurs,
 * décisions, rapports) :
 *  - "global"  : réutilisable par TOUS les projets (apprentissage transverse).
 *  - "project" : cloisonné au projet d'origine (anti-fuite multi-service).
 */
export type KnowledgeScope = "global" | "project"
export const KNOWLEDGE_SCOPES: KnowledgeScope[] = ["global", "project"]

export interface AppSettings {
  llmMode: LlmMode
  anthropicApiKey: string
  anthropicModel: string
  ollamaBaseUrl: string
  ollamaModel: string
  openaiApiKey: string
  openaiModel: string
  openaiBaseUrl: string
  mistralApiKey: string
  mistralModel: string
  /** Patience max (ms) pour les générations longues (rapport). */
  llmTimeoutMs: number
  // --- RAG / embeddings ---
  embeddingMode: EmbeddingMode
  ollamaEmbedModel: string
  openaiEmbedModel: string
  knowledgeScope: KnowledgeScope
}

const SINGLETON = "singleton"

/** Valeurs par défaut, dérivées de l'environnement (compatibilité ascendante). */
function envDefaults(): AppSettings {
  const envMode = (process.env.LLM_PROVIDER ?? "").toLowerCase()
  const llmMode = (LLM_MODES as string[]).includes(envMode)
    ? (envMode as LlmMode)
    : "auto"
  return {
    llmMode,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
    anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8",
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
    ollamaModel: process.env.OLLAMA_MODEL ?? "mistral",
    openaiApiKey: process.env.OPENAI_API_KEY ?? "",
    openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    openaiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    mistralApiKey: process.env.MISTRAL_API_KEY ?? "",
    mistralModel: process.env.MISTRAL_MODEL ?? "mistral-small-latest",
    llmTimeoutMs: clampInt(process.env.LLM_TIMEOUT_MS, 180_000, 10_000, 600_000),
    embeddingMode: (EMBEDDING_MODES as string[]).includes(
      (process.env.EMBEDDING_PROVIDER ?? "").toLowerCase(),
    )
      ? ((process.env.EMBEDDING_PROVIDER ?? "").toLowerCase() as EmbeddingMode)
      : "auto",
    ollamaEmbedModel: process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text",
    openaiEmbedModel:
      process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-small",
    knowledgeScope:
      process.env.KNOWLEDGE_SCOPE === "project" ? "project" : "global",
  }
}

/** Entier borné, avec valeur par défaut si invalide. */
function clampInt(
  raw: string | number | undefined,
  def: number,
  min: number,
  max: number,
): number {
  const n = typeof raw === "number" ? raw : Number(raw)
  if (!Number.isFinite(n)) return def
  return Math.max(min, Math.min(max, Math.round(n)))
}

/** Ne garde que les champs réellement renseignés (les vides retombent sur l'env). */
function pruneEmpty(o: Partial<AppSettings>): Partial<AppSettings> {
  const out: Partial<AppSettings> = {}
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined && v !== null && v !== "") {
      // @ts-expect-error indexation dynamique contrôlée
      out[k] = v
    }
  }
  return out
}

/** Lit les paramètres effectifs (DB par-dessus l'environnement). Jamais d'exception. */
export async function getAppSettings(): Promise<AppSettings> {
  const defaults = envDefaults()
  try {
    const row = await db.appSetting.findUnique({ where: { id: SINGLETON } })
    if (!row) return defaults
    const stored = (row.data ?? {}) as Partial<AppSettings>
    const merged: AppSettings = { ...defaults, ...pruneEmpty(stored) }
    // Déchiffre les secrets (les valeurs d'env en clair passent inchangées).
    for (const f of SECRET_FIELDS) merged[f] = decryptSecret(merged[f])
    return merged
  } catch {
    // Table absente (migration non appliquée) → on retombe sur l'environnement.
    return defaults
  }
}

/** Met à jour (fusionne) les paramètres persistés. */
export async function updateAppSettings(
  partial: Partial<AppSettings>,
): Promise<void> {
  const existing = await db.appSetting.findUnique({ where: { id: SINGLETON } })
  const current = (existing?.data ?? {}) as Partial<AppSettings>
  // Chiffre les secrets fournis avant de persister.
  const incoming: Partial<AppSettings> = { ...partial }
  for (const f of SECRET_FIELDS) {
    if (incoming[f]) incoming[f] = encryptSecret(incoming[f] as string)
  }
  const merged = { ...current, ...incoming }
  await db.appSetting.upsert({
    where: { id: SINGLETON },
    create: { id: SINGLETON, data: merged },
    update: { data: merged },
  })
}
