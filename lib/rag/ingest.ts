import { db } from "@/lib/db"
import { chunkText } from "./chunk"
import { resolveEmbeddingProvider } from "./embeddings"
import { sha256 } from "./store"
import type { KnowledgeSource } from "./types"

export interface IngestInput {
  title: string
  text: string
  source: KnowledgeSource
  /** id d'origine stable (attachmentId, vendorAnalysisId, slug…) → mise à jour idempotente. */
  sourceRef?: string
  /** null/absent = connaissance globale (réutilisable par tous les projets). */
  projectId?: string | null
  tags?: string[]
  uri?: string
}

/**
 * Indexe un texte dans la base de connaissances : chunking → embeddings →
 * stockage des vecteurs. Idempotent par (source, sourceRef) : si le contenu
 * n'a pas changé, on ne refait rien ; sinon on réindexe le document.
 *
 * Ne lève jamais d'exception vers l'appelant (l'enrichissement ne doit jamais
 * bloquer un parcours métier) — retourne null en cas d'échec.
 */
export async function ingestText(
  input: IngestInput,
): Promise<{ documentId: string; chunks: number; skipped?: boolean } | null> {
  try {
    const text = (input.text ?? "").trim()
    if (text.length < 40) return null

    const contentHash = await sha256(text)
    const projectId = input.projectId ?? null
    const embedder = await resolveEmbeddingProvider()

    // Document existant pour cette source ? (mise à jour idempotente)
    const existing = input.sourceRef
      ? await db.knowledgeDocument.findFirst({
          where: { source: input.source, sourceRef: input.sourceRef },
        })
      : null

    // On saute UNIQUEMENT si le contenu ET le modèle d'embedding sont identiques.
    if (existing && existing.contentHash === contentHash) {
      const sample = await db.knowledgeChunk.findFirst({
        where: { documentId: existing.id },
        select: { model: true },
      })
      if (sample?.model === embedder.modelTag) {
        return {
          documentId: existing.id,
          chunks: existing.chunkCount,
          skipped: true,
        }
      }
      // sinon : le modèle a changé → on réindexe pour homogénéiser l'espace vectoriel
    }

    const pieces = chunkText(text)
    if (pieces.length === 0) return null

    const vectors = await embedder.embed(pieces)
    if (vectors.length !== pieces.length) return null
    const dim = vectors[0]?.length ?? 0
    if (dim === 0) return null

    const documentId = existing?.id

    const result = await db.$transaction(async (tx) => {
      const doc = existing
        ? await tx.knowledgeDocument.update({
            where: { id: documentId },
            data: {
              title: input.title,
              uri: input.uri ?? null,
              tags: input.tags ?? undefined,
              contentHash,
              chunkCount: pieces.length,
            },
          })
        : await tx.knowledgeDocument.create({
            data: {
              title: input.title,
              source: input.source,
              sourceRef: input.sourceRef ?? null,
              projectId,
              uri: input.uri ?? null,
              tags: input.tags ?? undefined,
              contentHash,
              chunkCount: pieces.length,
            },
          })

      if (existing) {
        await tx.knowledgeChunk.deleteMany({ where: { documentId: doc.id } })
      }

      await tx.knowledgeChunk.createMany({
        data: pieces.map((content, idx) => ({
          documentId: doc.id,
          idx,
          content,
          embedding: vectors[idx],
          model: embedder.modelTag,
          dim,
          source: input.source,
          projectId,
        })),
      })

      return doc.id
    })

    return { documentId: result, chunks: pieces.length }
  } catch (e) {
    console.error("[rag.ingest] échec:", e)
    return null
  }
}

/** Supprime un document indexé (et ses chunks) par origine. */
export async function removeBySource(
  source: KnowledgeSource,
  sourceRef: string,
): Promise<void> {
  try {
    await db.knowledgeDocument.deleteMany({ where: { source, sourceRef } })
  } catch (e) {
    console.error("[rag.remove] échec:", e)
  }
}
