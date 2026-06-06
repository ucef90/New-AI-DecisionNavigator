import { getAppSettings, type AppSettings } from "@/lib/settings"
import { timeoutSignal } from "@/lib/llm/provider"

/**
 * Couche d'embeddings du RAG. Même philosophie que les providers LLM :
 *  - Ollama (on-premise) par défaut,
 *  - OpenAI si clé,
 *  - repli "hash" 100 % local et déterministe → le RAG fonctionne TOUJOURS,
 *    même sans modèle d'embedding installé (qualité dégradée mais opérationnel).
 *
 * Chaque provider expose un `modelTag` : il étiquette les vecteurs stockés pour
 * ne comparer que des vecteurs produits par le MÊME modèle (dimensions/espace).
 */
export interface EmbeddingProvider {
  readonly name: string
  /** Identifiant stable du modèle (stocké sur chaque chunk). */
  readonly modelTag: string
  embed(texts: string[]): Promise<number[][]>
}

/* ---------------------------- Ollama ---------------------------- */

class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly name = "ollama"
  readonly modelTag: string

  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
  ) {
    this.modelTag = `ollama:${model}`
  }

  async embed(texts: string[]): Promise<number[][]> {
    // API batch moderne (/api/embed) ; repli sur /api/embeddings (un par un).
    try {
      const res = await fetch(`${this.baseUrl}/api/embed`, {
        method: "POST",
        signal: timeoutSignal(60_000),
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, input: texts }),
      })
      if (res.ok) {
        const data = (await res.json()) as { embeddings?: number[][] }
        if (data.embeddings?.length === texts.length) return data.embeddings
      }
    } catch {
      // bascule vers l'API historique
    }

    const out: number[][] = []
    for (const t of texts) {
      const res = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: "POST",
        signal: timeoutSignal(60_000),
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, prompt: t }),
      })
      if (!res.ok) {
        throw new Error(`Ollama embeddings ${res.status}: ${await res.text()}`)
      }
      const data = (await res.json()) as { embedding?: number[] }
      out.push(data.embedding ?? [])
    }
    return out
  }
}

/* ---------------------------- OpenAI ---------------------------- */

class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly name = "openai"
  readonly modelTag: string

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly baseUrl: string,
  ) {
    this.modelTag = `openai:${model}`
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY manquante (embeddings).")
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      signal: timeoutSignal(60_000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, input: texts }),
    })
    if (!res.ok) {
      throw new Error(`OpenAI embeddings ${res.status}: ${await res.text()}`)
    }
    const data = (await res.json()) as { data?: { embedding: number[] }[] }
    return (data.data ?? []).map((d) => d.embedding)
  }
}

/* -------------------- Repli local déterministe -------------------- */

const HASH_DIM = 384

/**
 * Embedding local sans modèle : sac de mots (unigrammes + bigrammes) projeté
 * par hachage dans un vecteur de dimension fixe, puis normalisé L2.
 * Déterministe, hors-ligne, zéro dépendance — suffisant pour une recherche
 * lexicale/sémantique légère quand aucun modèle n'est disponible.
 */
class HashEmbeddingProvider implements EmbeddingProvider {
  readonly name = "hash"
  readonly modelTag = `hash:v1:${HASH_DIM}`

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => hashEmbed(t))
  }
}

function hashEmbed(text: string): number[] {
  const v = new Array<number>(HASH_DIM).fill(0)
  const tokens = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1)

  const add = (term: string, weight: number) => {
    const h = hashString(term)
    const idx = h % HASH_DIM
    const sign = ((h >>> 16) & 1) === 0 ? 1 : -1
    v[idx] += sign * weight
  }

  for (let i = 0; i < tokens.length; i++) {
    add(tokens[i], 1)
    if (i + 1 < tokens.length) add(`${tokens[i]}_${tokens[i + 1]}`, 0.6)
  }

  // Normalisation L2 → cosinus = produit scalaire.
  let norm = 0
  for (const x of v) norm += x * x
  norm = Math.sqrt(norm) || 1
  return v.map((x) => x / norm)
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/* ---------------------------- Résolution ---------------------------- */

function instantiate(
  mode: Exclude<AppSettings["embeddingMode"], "auto">,
  s: AppSettings,
): EmbeddingProvider {
  switch (mode) {
    case "ollama":
      return new OllamaEmbeddingProvider(s.ollamaBaseUrl, s.ollamaEmbedModel)
    case "openai":
      return new OpenAIEmbeddingProvider(
        s.openaiApiKey,
        s.openaiEmbedModel,
        s.openaiBaseUrl,
      )
    case "hash":
    default:
      return new HashEmbeddingProvider()
  }
}

// Cache court de la décision "auto" : évite de re-sonder Ollama à chaque appel.
let autoCache: { provider: EmbeddingProvider; at: number } | null = null
const AUTO_TTL_MS = 30_000

/** Résout le provider d'embeddings effectif (mode auto inclus). */
export async function resolveEmbeddingProvider(): Promise<EmbeddingProvider> {
  const s = await getAppSettings()
  if (s.embeddingMode !== "auto") return instantiate(s.embeddingMode, s)

  if (autoCache && Date.now() - autoCache.at < AUTO_TTL_MS) {
    return autoCache.provider
  }

  // auto : teste RÉELLEMENT un embedding Ollama (le serveur peut tourner sans
  // modèle d'embedding installé) ; sinon repli sur le mode local déterministe.
  let provider: EmbeddingProvider = instantiate("hash", s)
  try {
    const ollama = instantiate("ollama", s)
    const [v] = await ollama.embed(["test"])
    if (v && v.length > 0) provider = ollama
  } catch {
    // garde le repli hash
  }

  autoCache = { provider, at: Date.now() }
  return provider
}
