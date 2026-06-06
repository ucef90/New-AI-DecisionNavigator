import { db } from "@/lib/db"
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

  try {
    const embedder = await resolveEmbeddingProvider()
    const [qv] = await embedder.embed([q])
    if (!qv || qv.length === 0) return []

    const rows = await db.knowledgeChunk.findMany({
      where: {
        model: embedder.modelTag,
        OR: [{ projectId: null }, { projectId: projectId ?? undefined }],
        ...(sources && sources.length ? { source: { in: sources } } : {}),
      },
      select: {
        content: true,
        embedding: true,
        source: true,
        documentId: true,
        document: { select: { title: true } },
      },
      take: maxCandidates,
    })

    const scored = rows
      .map((r) => ({
        documentId: r.documentId,
        title: r.document?.title ?? "—",
        source: r.source as KnowledgeSource,
        content: r.content,
        score: cosine(qv, (r.embedding as number[]) ?? []),
      }))
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score)

    // Déduplique par document (un même doc ne sature pas le top-k).
    const seen = new Set<string>()
    const out: RetrievedChunk[] = []
    for (const r of scored) {
      if (seen.has(r.documentId)) continue
      seen.add(r.documentId)
      out.push(r)
      if (out.length >= k) break
    }
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
