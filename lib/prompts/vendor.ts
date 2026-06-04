import type { LLMPrompt } from "@/lib/llm"

// Prompt 2 — Analyse fournisseur (enrichie)

export interface VendorRedFlag {
  severity: "high" | "medium" | "low"
  claim: string
  concern: string
}
export interface VendorQuestion {
  question: string
  why: string
}
export interface VendorResult {
  vendorName: string
  solutionType: string
  solutionSummary: string // ce que fait la solution + architecture
  relevance: string // pertinence au regard du besoin
  fitScore: number // 1-5
  maturityScore: number // 0-20 (fiabilité / maturité)
  maturityJustification: string
  fitJustification: string
  redFlags: VendorRedFlag[]
  hiddenDependencies: string[]
  questionsToAsk: VendorQuestion[]
  regulatoryGaps: string[]
  recommendation: "PROCEED" | "CAUTION" | "AVOID"
  recommendationReason: string
}

export interface VendorProfile {
  problem: string
  verdict: string
  tech: string
  dataTypes: string
  regLevel: string
}

const SYSTEM = `Tu es un analyste technique senior spécialisé dans l'évaluation de solutions IA pour le secteur public français.
Tu analyses des documents fournisseurs (propositions, fiches techniques, réponses à appel d'offres).

Tes règles absolues :
- Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après.
- Sois factuel et précis : appuie chaque point sur des éléments du document.
- Décris réellement la solution proposée ET son architecture technique (composants, hébergement, intégrations).
- Évalue la pertinence par rapport au besoin du projet fourni en contexte.
- Donne une note de fiabilité / maturité sur 20, justifiée.
- Reste neutre et critique : repère promesses non vérifiables, dépendances cachées, coûts non mentionnés.
- Termine par des questions concrètes à poser au fournisseur.`

function truncate(text: string, max = 4000): string {
  if (text.length <= max) return text
  const head = text.slice(0, max * 0.7)
  const tail = text.slice(-max * 0.3)
  return `${head}\n[…]\n${tail}`
}

export function buildVendorPrompt(
  profile: VendorProfile,
  documentContent: string,
): LLMPrompt {
  return {
    system: SYSTEM,
    user: `PROFIL DU PROJET :
- Besoin : ${profile.problem}
- Décision recommandée : ${profile.verdict}
- Type d'IA recommandé : ${profile.tech}
- Données personnelles : ${profile.dataTypes}
- Niveau de risque réglementaire : ${profile.regLevel}

DOCUMENT FOURNISSEUR :
${truncate(documentContent)}

Analyse ce document et réponds avec ce JSON exact :
{
  "vendorName": "nom du fournisseur ou Non identifié",
  "solutionType": "type de solution en 5 mots max",
  "solutionSummary": "3-4 phrases : ce que fait la solution ET son architecture technique (composants, hébergement, intégrations)",
  "relevance": "2-3 phrases : pertinence au regard du besoin et de la techno recommandée",
  "fitScore": 1 à 5,
  "fitJustification": "2 phrases sur l'adéquation",
  "maturityScore": 0 à 20,
  "maturityJustification": "2 phrases justifiant la note de fiabilité/maturité (références, sécurité, performances prouvées, etc.)",
  "redFlags": [{ "severity": "high|medium|low", "claim": "affirmation du document", "concern": "pourquoi c'est problématique" }],
  "hiddenDependencies": ["dépendance 1"],
  "regulatoryGaps": ["obligation non couverte 1"],
  "recommendation": "PROCEED|CAUTION|AVOID",
  "recommendationReason": "1 phrase",
  "questionsToAsk": [{ "question": "question précise", "why": "pourquoi" }]
}

Règles : minimum 5 questions adaptées au profil ; redFlags vide si le document est honnête ; croise regulatoryGaps avec le niveau de risque.`,
  }
}

export function parseVendor(raw: string): VendorResult | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim()
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    if (start === -1 || end === -1) return null
    const o = JSON.parse(cleaned.slice(start, end + 1))

    const recommendation = ["PROCEED", "CAUTION", "AVOID"].includes(
      o.recommendation,
    )
      ? o.recommendation
      : "CAUTION"

    return {
      vendorName: String(o.vendorName ?? "Non identifié"),
      solutionType: String(o.solutionType ?? "—"),
      solutionSummary: String(o.solutionSummary ?? ""),
      relevance: String(o.relevance ?? ""),
      fitScore: Math.max(1, Math.min(5, Number(o.fitScore) || 3)),
      maturityScore: Math.max(0, Math.min(20, Math.round(Number(o.maturityScore) || 10))),
      maturityJustification: String(o.maturityJustification ?? ""),
      fitJustification: String(o.fitJustification ?? ""),
      redFlags: Array.isArray(o.redFlags) ? o.redFlags : [],
      hiddenDependencies: Array.isArray(o.hiddenDependencies)
        ? o.hiddenDependencies.map(String)
        : [],
      questionsToAsk: Array.isArray(o.questionsToAsk) ? o.questionsToAsk : [],
      regulatoryGaps: Array.isArray(o.regulatoryGaps)
        ? o.regulatoryGaps.map(String)
        : [],
      recommendation,
      recommendationReason: String(o.recommendationReason ?? ""),
    }
  } catch {
    return null
  }
}
