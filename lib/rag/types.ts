/** Origine d'un document indexé (miroir de l'enum Prisma KnowledgeSource). */
export type KnowledgeSource =
  | "REFERENCE"
  | "ATTACHMENT"
  | "VENDOR"
  | "DECISION"
  | "REPORT"
  | "ANSWER"
  | "MANUAL"

export const SOURCE_LABELS: Record<KnowledgeSource, string> = {
  REFERENCE: "Référence",
  ATTACHMENT: "Document projet",
  VENDOR: "Analyse fournisseur",
  DECISION: "Décision",
  REPORT: "Rapport",
  ANSWER: "Réponses",
  MANUAL: "Saisie manuelle",
}

export interface RetrievedChunk {
  documentId: string
  title: string
  source: KnowledgeSource
  content: string
  score: number
}
