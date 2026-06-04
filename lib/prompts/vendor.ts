import type { LLMPrompt } from "@/lib/llm"

// Prompt 2 — Analyse fournisseur

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
  fitScore: number
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
Tu analyses des documents fournisseurs (propositions commerciales, fiches techniques, réponses à appel d'offres).

Tes règles absolues :
- Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après.
- Sois factuel et précis : cite des éléments du document quand tu identifies un problème.
- Ne fais pas de publicité pour le fournisseur : reste neutre et critique.
- Identifie les promesses non vérifiables, les dépendances cachées, les coûts non mentionnés.
- Adapte les questions au profil du projet fourni en contexte.`

// Tronque le document pour rester dans une fenêtre de contexte raisonnable.
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
  "solutionType": "type de solution proposée en 5 mots max",
  "fitScore": 1 à 5,
  "fitJustification": "2 phrases expliquant l'adéquation au besoin",
  "redFlags": [{ "severity": "high|medium|low", "claim": "affirmation exacte du document", "concern": "pourquoi c'est problématique" }],
  "hiddenDependencies": ["dépendance 1"],
  "questionsToAsk": [{ "question": "Question précise à poser", "why": "Pourquoi c'est important" }],
  "regulatoryGaps": ["obligation non couverte 1"],
  "recommendation": "PROCEED|CAUTION|AVOID",
  "recommendationReason": "1 phrase de justification"
}

Règles : minimum 5 questions adaptées au profil ; redFlags vide si le document est honnête (ne pas inventer) ; croise regulatoryGaps avec le niveau de risque du projet.`,
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
      fitScore: Math.max(1, Math.min(5, Number(o.fitScore) || 3)),
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
