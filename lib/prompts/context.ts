import type { LLMPrompt } from "@/lib/llm"

// Analyse de contexte — à partir des documents (cadrage, notes…) et/ou de la description.

export interface ContextResult {
  summary: string // synthèse du contexte en 3-4 phrases
  businessNeed: string // le besoin reformulé, orienté problème (sert à pré-remplir Q1)
  processes: string[] // processus / étapes identifiés
  dataPoints: string[] // données / sources mentionnées
  stakes: string[] // enjeux, risques, contraintes
  detectedSignals: string[] // technologies / mots-clés détectés
}

const SYSTEM = `Tu es un analyste métier qui aide une collectivité publique à cadrer un besoin avant un éventuel projet IA.
À partir des documents fournis (cadrage, notes, fiches projet) et/ou de la description, tu produis une compréhension synthétique du CONTEXTE et du BESOIN MÉTIER.

Règles absolues :
- Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après.
- Ne propose aucune solution technologique : reste sur le problème et le contexte.
- Langage simple, factuel, basé sur le contenu fourni.`

function truncate(text: string, max = 6000): string {
  if (text.length <= max) return text
  return `${text.slice(0, max * 0.7)}\n[…]\n${text.slice(-max * 0.3)}`
}

export function buildContextPrompt(input: {
  projectName: string
  description: string
  documentsText: string
  knowledge?: string
}): LLMPrompt {
  const hasDocs = input.documentsText.trim().length > 0
  const knowledge = input.knowledge?.trim()
  return {
    system: SYSTEM,
    user: `PROJET : ${input.projectName}
DESCRIPTION FOURNIE : ${input.description || "(non renseignée)"}

${
  hasDocs
    ? `DOCUMENTS DE CONTEXTE :\n${truncate(input.documentsText)}`
    : "AUCUN DOCUMENT FOURNI — base-toi uniquement sur la description ci-dessus."
}
${knowledge ? `\n${knowledge}\n` : ""}
Analyse et réponds avec ce JSON exact :
{
  "summary": "3-4 phrases de synthèse du contexte et du besoin",
  "businessNeed": "le vrai problème métier en 1-2 phrases, orienté résultat, sans solution technologique",
  "processes": ["processus ou étape identifié"],
  "dataPoints": ["donnée ou source mentionnée"],
  "stakes": ["enjeu, risque ou contrainte"],
  "detectedSignals": ["mot-clé technologique éventuel"]
}`,
  }
}

export function parseContext(raw: string): ContextResult | null {
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
    const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : [])
    return {
      summary: String(o.summary ?? ""),
      businessNeed: String(o.businessNeed ?? ""),
      processes: arr(o.processes),
      dataPoints: arr(o.dataPoints),
      stakes: arr(o.stakes),
      detectedSignals: arr(o.detectedSignals),
    }
  } catch {
    return null
  }
}
