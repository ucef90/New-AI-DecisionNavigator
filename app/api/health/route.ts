import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { resolveActiveProviderName } from "@/lib/llm"
import { knowledgeStats } from "@/lib/rag"

export const dynamic = "force-dynamic"

/**
 * Sonde de santé opérationnelle (pour supervision). Ne renvoie AUCUN secret :
 * statut DB, fournisseur LLM effectif, modèle d'embedding, volumétrie RAG.
 */
export async function GET() {
  const out: Record<string, unknown> = { ok: true, time: new Date().toISOString() }

  try {
    await db.user.count()
    out.db = "ok"
  } catch {
    out.db = "down"
    out.ok = false
  }

  try {
    out.llm = await resolveActiveProviderName()
  } catch {
    out.llm = "unknown"
  }

  try {
    const s = await knowledgeStats()
    out.embedding = s.activeModel
    out.knowledge = { documents: s.documents, chunks: s.chunks }
  } catch {
    out.embedding = "unknown"
  }

  return NextResponse.json(out, { status: out.ok ? 200 : 503 })
}
