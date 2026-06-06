// API publique du RAG.
export { ingestText, removeBySource } from "./ingest"
export { retrieve, buildKnowledgeBlock } from "./retrieve"
export {
  ingestAttachment,
  ingestVendorAnalysis,
  ingestDecisionForProject,
  seedReferenceKnowledge,
  reindexExisting,
  knowledgeStats,
  type KnowledgeStats,
} from "./enrich"
export { SOURCE_LABELS } from "./types"
export type { KnowledgeSource, RetrievedChunk } from "./types"
