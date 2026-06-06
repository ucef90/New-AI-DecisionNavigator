import { db } from "@/lib/db"
import { logEvent } from "@/lib/observability"
import { resolveEmbeddingProvider } from "./embeddings"
import { cosine } from "./store"
import type { KnowledgeSource, RetrievedChunk } from "./types"

export interface RetrieveOptions {
  /** Scope projet : récupère le global (projectId null) + ce projet. */
  projectId?: string | null
  /** Nombre de fragments retournés. */
  k?: number
  /** Restreint aux sources données (sinon toutes). */
  sources?: KnowledgeSource[]
  /** Score cosinus minimum (0..1). */
  minScore?: number
  /** Plafond de chunks chargés en mémoire pour le calcul. */
  maxCandidates?: number
}

/**
 * Récupère les fragments les plus pertinents pour une requête, par similarité
 * cosinus. Ne compare que les vecteurs produits par le MÊME modèle d'embedding
 * (sinon il faut réindexer). Robuste : retourne [] en cas de problème.
 */
export async function retrieve(
  query: string,
  opts: RetrieveOptions = {},
): Promise<RetrievedChunk[]> {
  const {
    projectId = null,
    k = 5,
    sources,
    minScore = 0.12,
    maxCandidates = 6000,
  } = opts

  const q = (query ?? "").trim()
  if (q.length < 3) return []

  const start = Date.now()
  try {
    const embedder = await resolveEmbeddingProvider()
    const [qv] = await embedder.embed([q])
    if (!qv || qv.length === 0) return []

    const where = {
      model: embedder.modelTag,
      OR: [{ projectId: null }, { projectId: projectId ?? undefined }],
      ...(sources && sources.length ? { source: { in: sources } } : {}),
    }

    // Phase 1 — scoring : on ne charge QUE les vecteurs (pas le contenu) pour
    // limiter la mémoire. On lit maxCandidates+1 pour détecter une troncature.
    const candidates = await db.knowledgeChunk.findMany({
      where,
      select: { id: true, embedding: true, source: true, documentId: true },
      take: maxCandidates + 1,
    })
    if (candidates.length > maxCandidates) {
      console.warn(
        `[rag.retrieve] corpus > ${maxCandidates} fragments : recherche tronquée (force brute). Passer à pgvector — voir docs/RAG-SCALING.md.`,
      )
    }

    const scored = candidates
      .slice(0, maxCandidates)
      .map((r) => ({
        id: r.id,
        documentId: r.documentId,
        source: r.source as KnowledgeSource,
        score: cosine(qv, (r.embedding as number[]) ?? []),
      }))
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score)

    // Déduplique par document, garde le top-k.
    const seen = new Set<string>()
    const picked: typeof scored = []
    for (const r of scored) {
      if (seen.has(r.documentId)) continue
      seen.add(r.documentId)
      picked.push(r)
      if (picked.length >= k) break
    }
    if (!picked.length) return []

    // Phase 2 — on ne charge le contenu + titre que pour le top-k retenu.
    const details = await db.knowledgeChunk.findMany({
      where: { id: { in: picked.map((p) => p.id) } },
      select: {
        id: true,
        content: true,
        document: { select: { title: true } },
      },
    })
    const byId = new Map(details.map((d) => [d.id, d]))

    const out = picked.map((p) => {
      const d = byId.get(p.id)
      return {
        documentId: p.documentId,
        title: d?.document?.title ?? "—",
        source: p.source,
        content: d?.content ?? "",
        score: p.score,
      }
    })
    logEvent("rag.retrieve", {
      model: embedder.modelTag,
      candidates: candidates.length,
      results: out.length,
      ms: Date.now() - start,
    })
    return out
  } catch (e) {
    console.error("[rag.retrieve] échec:", e)
    return []
  }
}

/** Formate les fragments récupérés en bloc injectable dans un prompt. */
export function buildKnowledgeBlock(chunks: RetrievedChunk[]): string {
  if (!chunks.length) return ""
  const lines = chunks.map(
    (c, i) =>
      `[${i + 1}] (${c.source} — « ${c.title} »)\n${c.content.trim()}`,
  )
  return [
    "CONNAISSANCES INTERNES PERTINENTES (corpus de l'organisation — utilise-les si pertinent, sans inventer) :",
    ...lines,
  ].join("\n\n")
}
