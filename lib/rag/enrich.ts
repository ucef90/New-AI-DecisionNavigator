import { db } from "@/lib/db"
import { getAppSettings } from "@/lib/settings"
import { logEvent } from "@/lib/observability"
import { ingestText } from "./ingest"
import { resolveEmbeddingProvider } from "./embeddings"
import { REFERENCE_DOCS } from "./knowledge/reference"
import type { KnowledgeSource } from "./types"

/**
 * Périmètre d'indexation d'une connaissance dérivée d'un projet :
 *  - "global"  → projectId null (réutilisable partout)
 *  - "project" → cloisonné au projet (pas de fuite inter-service)
 */
async function scopedProjectId(projectId: string): Promise<string | null> {
  const { knowledgeScope } = await getAppSettings()
  return knowledgeScope === "project" ? projectId : null
}

/* ------------------------- Helpers d'ingestion ------------------------- */

/** Indexe un document joint à un projet (confidentiel → scope projet). */
export async function ingestAttachment(att: {
  id: string
  name: string
  text: string | null
  projectId: string
}) {
  if (!att.text) return
  await ingestText({
    title: att.name,
    text: att.text,
    source: "ATTACHMENT",
    sourceRef: att.id,
    projectId: att.projectId,
  })
}

/**
 * Indexe une analyse fournisseur en connaissance GLOBALE : connaître une
 * solution/fournisseur profite à tous les futurs projets (auto-enrichissement).
 */
export async function ingestVendorAnalysis(vaId: string) {
  const va = await db.vendorAnalysis.findUnique({ where: { id: vaId } })
  if (!va) return
  const parts = [
    va.solutionSummary && `Solution : ${va.solutionSummary}`,
    va.relevance && `Pertinence : ${va.relevance}`,
    va.maturityScore != null &&
      `Maturité : ${va.maturityScore}/20. ${va.maturityJustification ?? ""}`,
    va.recommendation &&
      `Recommandation : ${va.recommendation}. ${va.recommendations ?? ""}`,
    va.documentContent && `Extrait : ${va.documentContent.slice(0, 1500)}`,
  ].filter(Boolean)
  await ingestText({
    title: `Analyse fournisseur — ${va.documentName ?? "document"}`,
    text: parts.join("\n"),
    source: "VENDOR",
    sourceRef: va.id,
    projectId: await scopedProjectId(va.projectId),
    tags: ["fournisseur"],
  })
}

/** Indexe la décision d'un projet en connaissance GLOBALE (motif réutilisable). */
export async function ingestDecisionForProject(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { decision: true },
  })
  const d = project?.decision
  if (!project || !d) return
  const text = [
    `Projet : ${project.name}.`,
    `Verdict : ${d.verdict}${d.techRecommendation ? `, technologie recommandée : ${d.techRecommendation}` : ""}.`,
    `Niveau réglementaire : ${d.regulatoryLevel}.`,
    d.justification && `Justification : ${d.justification}`,
  ]
    .filter(Boolean)
    .join("\n")
  await ingestText({
    title: `Décision — ${project.name} (${d.verdict})`,
    text,
    source: "DECISION",
    sourceRef: d.id,
    projectId: await scopedProjectId(projectId),
    tags: ["décision", d.verdict],
  })
}

/* ------------------------- Seed & réindexation ------------------------- */

/** (Ré)indexe le corpus de référence (global). Idempotent par slug. */
export async function seedReferenceKnowledge(): Promise<number> {
  let n = 0
  for (const doc of REFERENCE_DOCS) {
    const r = await ingestText({
      title: doc.title,
      text: doc.content,
      source: "REFERENCE",
      sourceRef: `ref:${doc.slug}`,
      projectId: null,
      tags: doc.tags,
    })
    if (r && !r.skipped) n++
  }
  return n
}

/**
 * Réindexe toutes les sources existantes de la base (utile après un changement
 * de modèle d'embedding, ou pour rattraper l'historique).
 */
export async function reindexExisting(): Promise<{
  references: number
  attachments: number
  vendors: number
  decisions: number
}> {
  const start = Date.now()
  logEvent("rag.reindex.start", {})
  const references = await seedReferenceKnowledge()

  const attachments = await db.attachment.findMany({
    where: { text: { not: null } },
    select: { id: true, name: true, text: true, projectId: true },
  })
  for (const a of attachments) await ingestAttachment(a)

  const vendors = await db.vendorAnalysis.findMany({ select: { id: true } })
  for (const v of vendors) await ingestVendorAnalysis(v.id)

  const decisions = await db.decision.findMany({ select: { projectId: true } })
  for (const d of decisions) await ingestDecisionForProject(d.projectId)

  const result = {
    references,
    attachments: attachments.length,
    vendors: vendors.length,
    decisions: decisions.length,
  }
  logEvent("rag.reindex.done", { ...result, ms: Date.now() - start })
  return result
}

/* ------------------------------ Statistiques ------------------------------ */

export interface KnowledgeStats {
  documents: number
  chunks: number
  bySource: { source: KnowledgeSource; count: number }[]
  activeModel: string
  staleChunks: number // chunks d'un autre modèle (réindexation conseillée)
}

export async function knowledgeStats(): Promise<KnowledgeStats> {
  const [documents, chunks, grouped] = await Promise.all([
    db.knowledgeDocument.count(),
    db.knowledgeChunk.count(),
    db.knowledgeDocument.groupBy({ by: ["source"], _count: { _all: true } }),
  ])

  let activeModel = "—"
  let staleChunks = 0
  try {
    const embedder = await resolveEmbeddingProvider()
    activeModel = embedder.modelTag
    staleChunks = await db.knowledgeChunk.count({
      where: { model: { not: embedder.modelTag } },
    })
  } catch {
    // ignore : pas de modèle résolu
  }

  return {
    documents,
    chunks,
    bySource: grouped
      .map((g) => ({
        source: g.source as KnowledgeSource,
        count: g._count._all,
      }))
      .sort((a, b) => b.count - a.count),
    activeModel,
    staleChunks,
  }
}
