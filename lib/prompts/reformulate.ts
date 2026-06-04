import type { LLMPrompt } from "@/lib/llm"

// Prompt 1 — Reformulation du besoin (Q1)

export interface ReformulationResult {
  problemReformulated: string
  isSolutionOriented: boolean
  detectedSignals: string[]
  clarifyingQuestion: string | null
  confidence: "high" | "medium" | "low"
}

const SYSTEM = `Tu es un assistant de pré-cadrage IA pour des chefs de projet de collectivités publiques françaises.
Tu les aides à formuler clairement leur problème métier avant de décider si l'IA est pertinente.

Tes règles absolues :
- Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après.
- Ne propose jamais de solution technologique dans ta réponse.
- Utilise un langage simple, sans jargon technique.
- Sois concis : 2 phrases maximum par champ texte.
- Si le besoin est déjà bien formulé, garde-le tel quel.`

export function buildReformulationPrompt(q1Value: string): LLMPrompt {
  return {
    system: SYSTEM,
    user: `Le chef de projet a décrit son besoin ainsi :
"${q1Value}"

Analyse cette description et réponds avec ce JSON exact :
{
  "problemReformulated": "Le vrai problème en 1 phrase claire, orienté résultat",
  "isSolutionOriented": true ou false,
  "detectedSignals": ["signal1", "signal2"],
  "clarifyingQuestion": "Une question à poser si le besoin est flou, sinon null",
  "confidence": "high|medium|low"
}`,
  }
}

/** Parse robuste de la réponse LLM (tolère les fences markdown ```json). */
export function parseReformulation(raw: string): ReformulationResult | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim()
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    if (start === -1 || end === -1) return null
    const obj = JSON.parse(cleaned.slice(start, end + 1))

    return {
      problemReformulated: String(obj.problemReformulated ?? ""),
      isSolutionOriented: Boolean(obj.isSolutionOriented),
      detectedSignals: Array.isArray(obj.detectedSignals)
        ? obj.detectedSignals.map(String)
        : [],
      clarifyingQuestion: obj.clarifyingQuestion
        ? String(obj.clarifyingQuestion)
        : null,
      confidence: ["high", "medium", "low"].includes(obj.confidence)
        ? obj.confidence
        : "medium",
    }
  } catch {
    return null
  }
}
