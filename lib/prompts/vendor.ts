import type { LLMPrompt } from "@/lib/llm"

// Prompt 2 — Analyse fournisseur (enrichie)

export interface VendorRedFlag {
  severity: "high" | "medium" | "low"
  claim: string
  concern: string
  evidence?: string // citation verbatim tirée du document
}
export interface VendorQuestion {
  question: string
  why: string
}
export interface VendorResult {
  documentIsRelevant: boolean // false si le doc n'est pas une offre / hors-sujet
  irrelevantReason: string // explication si documentIsRelevant = false
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

RÈGLES ABSOLUES — anti-hallucination :
- Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après.
- Tu te fondes EXCLUSIVEMENT sur le texte du document fourni et le contexte du projet. Tu n'inventes JAMAIS un fait, un chiffre, un prix, une référence ou un engagement absent du document.
- VÉRIFIE D'ABORD LA PERTINENCE : le document est-il réellement une offre / proposition / réponse d'un fournisseur, ET en lien avec le besoin du projet ? Si NON (facture, article, note interne, document hors-sujet, ou simple texte sans rapport), mets "documentIsRelevant": false, explique pourquoi dans "irrelevantReason", mets recommendation="AVOID", fitScore=1, maturityScore=0, et NE fabrique PAS d'évaluation détaillée.
- Pour chaque point de vigilance (redFlag), le champ "evidence" doit contenir une CITATION VERBATIM courte, copiée mot pour mot depuis le document. Si aucune phrase ne soutient le point, n'invente pas : laisse "evidence" vide.
- L'absence d'information n'est jamais un point positif : si le document ne dit rien sur un sujet (prix, sécurité, RGPD, références…), baisse la note, signale-le et transforme-le en question à poser.
- Décris réellement la solution proposée ET son architecture technique (composants, hébergement, intégrations), uniquement si le document en parle.
- Donne une note de fiabilité / maturité sur 20, justifiée par des éléments du document.
- Termine par des questions concrètes à poser au fournisseur.`

function truncate(text: string, max = 48000): string {
  if (text.length <= max) return text
  const head = text.slice(0, max * 0.7)
  const tail = text.slice(-max * 0.3)
  return `${head}\n[…]\n${tail}`
}

export function buildVendorPrompt(
  profile: VendorProfile,
  documentContent: string,
  knowledge?: string,
): LLMPrompt {
  const kb = knowledge?.trim()
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
${kb ? `\n${kb}\n` : ""}
Analyse ce document et réponds avec ce JSON exact :
{
  "documentIsRelevant": true,
  "irrelevantReason": "si documentIsRelevant=false : pourquoi ce document n'est pas une offre fournisseur exploitable pour ce projet (sinon chaîne vide)",
  "vendorName": "nom du fournisseur ou Non identifié",
  "solutionType": "type de solution en 5 mots max",
  "solutionSummary": "3-4 phrases : ce que fait la solution ET son architecture technique (composants, hébergement, intégrations)",
  "relevance": "2-3 phrases : pertinence au regard du besoin et de la techno recommandée",
  "fitScore": 1 à 5,
  "fitJustification": "2 phrases sur l'adéquation",
  "maturityScore": 0 à 20,
  "maturityJustification": "2 phrases justifiant la note de fiabilité/maturité (références, sécurité, performances prouvées, etc.)",
  "redFlags": [{ "severity": "high|medium|low", "claim": "affirmation du document", "concern": "pourquoi c'est problématique", "evidence": "citation verbatim du document" }],
  "hiddenDependencies": ["dépendance 1"],
  "regulatoryGaps": ["obligation non couverte 1"],
  "recommendation": "PROCEED|CAUTION|AVOID",
  "recommendationReason": "1 phrase",
  "questionsToAsk": [{ "question": "question précise", "why": "pourquoi" }]
}

Règles : si documentIsRelevant=false, ne remplis pas redFlags/hiddenDependencies de façon inventée ; minimum 5 questions adaptées au profil ; chaque redFlag doit avoir une "evidence" citée du document ; croise regulatoryGaps avec le niveau de risque.`,
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

    // Pertinence : par défaut true (rétrocompat), false seulement si explicite.
    const documentIsRelevant = o.documentIsRelevant !== false

    const redFlags: VendorRedFlag[] = Array.isArray(o.redFlags)
      ? o.redFlags.map((f: Record<string, unknown>) => ({
          severity: (["high", "medium", "low"].includes(String(f?.severity))
            ? f.severity
            : "medium") as VendorRedFlag["severity"],
          claim: String(f?.claim ?? ""),
          concern: String(f?.concern ?? ""),
          evidence:
            typeof f?.evidence === "string" && f.evidence.trim().length > 0
              ? String(f.evidence)
              : undefined,
        }))
      : []

    return {
      documentIsRelevant,
      irrelevantReason: String(o.irrelevantReason ?? ""),
      vendorName: String(o.vendorName ?? "Non identifié"),
      solutionType: String(o.solutionType ?? "—"),
      solutionSummary: String(o.solutionSummary ?? ""),
      relevance: String(o.relevance ?? ""),
      fitScore: Math.max(1, Math.min(5, Number(o.fitScore) || 3)),
      maturityScore: Math.max(0, Math.min(20, Math.round(Number(o.maturityScore) || 10))),
      maturityJustification: String(o.maturityJustification ?? ""),
      fitJustification: String(o.fitJustification ?? ""),
      redFlags,
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
