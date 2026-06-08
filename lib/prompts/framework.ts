import type { LLMPrompt } from "@/lib/llm"

// V2 — Pipeline de cadrage basé sur le Framework 6 socles (Beyond Expertise).
// 4 prompts séquencés : analyse docs → questions personnalisées → scoring 11
// axes → rapport. Le contenu de FRAMEWORK.md est injecté via lib/framework.ts.

// ---------------------------------------------------------------------------
// Types de sortie
// ---------------------------------------------------------------------------

export interface DocAnalysis {
  probleme_metier: string
  taches_identifiees: string[]
  metriques: { volume: string; delai: string; taux_erreur: string }
  contraintes: string[]
  acteurs: string[]
  donnees_disponibles: string[]
  zones_floues: string[]
  mots_cles_secteur: string[]
}

export type QuestionType = "open" | "scale" | "boolean"

export interface GeneratedQuestion {
  id: number
  socle: number // 1..6
  dimension: string
  question: string
  pourquoi: string
  type: QuestionType
  impact_decision: string
}

export interface ScoringAxis {
  axe: number // 1..11
  label: string
  score: number // 1..5
  justification: string
}

export interface ScoringRisk {
  risque: string
  p: number // 1..4
  i: number // 1..4
  criticite: number // p*i
  mitigation: string
}

export interface SocleAnalysis {
  socle: number // 1..6
  forces: string[]
  faiblesses: string[]
  pointsCritiques: string[]
}

export interface ScoringRecommendation {
  action: string
  responsable: string
  delai: string
}

export type FrameworkDecision =
  | "GO_PRODUCTION"
  | "GO_POC"
  | "CONDITIONNEL"
  | "NO_GO"

export interface ScoringResult {
  axes: ScoringAxis[]
  scoreGlobal: number // 0..55
  pourcentage: number // 0..100
  niveau: string // ex. "Projet intermédiaire"
  parSocle: SocleAnalysis[]
  risques: ScoringRisk[]
  pointsCritiques: string[]
  opportunites: string[]
  recommandations: ScoringRecommendation[]
  decision: FrameworkDecision
  conditions: string[]
  prochaineEtape: string
  blocageImmediat?: string // rempli si NO GO immédiat (RGPD, données absentes…)
}

// ---------------------------------------------------------------------------
// PROMPT 1 — Analyse des documents importés
// ---------------------------------------------------------------------------

export function buildDocAnalysisPrompt(documentsText: string): LLMPrompt {
  return {
    system: `Tu es un expert en cadrage de projets IA, formé sur le Framework Beyond Expertise en 6 socles.
L'utilisateur t'a fourni des documents de projet (cahier des charges, spec, courriers, etc.).
Réponds UNIQUEMENT en JSON valide, sans markdown ni texte autour.
Sois factuel : si une information n'est pas dans les documents, indique "non mentionné". N'invente jamais.`,
    user: `DOCUMENTS DU PROJET :
${documentsText}

Analyse ces documents et extrais les informations clés au format JSON exact :
{
  "probleme_metier": "le problème métier apparent, formulé sans technologie",
  "taches_identifiees": ["tâche du processus", "..."],
  "metriques": { "volume": "...", "delai": "...", "taux_erreur": "..." },
  "contraintes": ["contrainte technique ou réglementaire", "..."],
  "acteurs": ["acteur impliqué", "..."],
  "donnees_disponibles": ["donnée disponible ou mentionnée", "..."],
  "zones_floues": ["information manquante ou ambiguë", "..."],
  "mots_cles_secteur": ["mot-clé métier/secteur", "..."]
}`,
  }
}

// ---------------------------------------------------------------------------
// PROMPT 2 — Génération de 20 questions personnalisées
// ---------------------------------------------------------------------------

export function buildQuestionsPrompt(
  analysisJson: string,
  frameworkContent: string,
): LLMPrompt {
  return {
    system: `Tu es un expert en cadrage de projets IA appliquant le Framework Beyond Expertise en 6 socles.
Réponds UNIQUEMENT en JSON valide, sans markdown ni texte autour.`,
    user: `ANALYSE PRÉLIMINAIRE DU PROJET :
${analysisJson}

FRAMEWORK DE RÉFÉRENCE :
${frameworkContent}

Génère EXACTEMENT 20 questions de cadrage personnalisées pour CE projet.
Règles :
- Couvrir les 6 socles (au moins 2-3 questions par socle).
- Chaque question est SPÉCIFIQUE au contexte du projet — jamais générique.
- Les questions comblent les zones floues identifiées dans l'analyse.
- Formulées pour un chef de projet / directeur métier (pas un technicien).
- Chaque question a un impact direct sur la décision GO/NO GO.

Format JSON exact :
{
  "questions": [
    {
      "id": 1,
      "socle": 1,
      "dimension": "Clarté du besoin métier",
      "question": "...",
      "pourquoi": "Cette question est posée car [raison spécifique au projet]",
      "type": "open",
      "impact_decision": "Détermine si le besoin est assez mature pour avancer"
    }
  ]
}
"type" ∈ {"open","scale","boolean"}.`,
  }
}

// ---------------------------------------------------------------------------
// PROMPT 3 — Analyse des réponses et scoring 11 axes
// ---------------------------------------------------------------------------

export function buildScoringPrompt(
  analysisJson: string,
  qaPairsJson: string,
  frameworkContent: string,
): LLMPrompt {
  return {
    system: `Tu es un expert en cadrage de projets IA appliquant le Framework Beyond Expertise en 6 socles.
Réponds UNIQUEMENT en JSON valide, sans markdown ni texte autour.
Ne jamais inventer d'informations non présentes dans les documents ou les réponses.
Garde-fou : si une zone critique est détectée (blocage RGPD rédhibitoire, données inexistantes,
SI totalement incompatible), renseigne "blocageImmediat" et mets "decision":"NO_GO".`,
    user: `DOCUMENTS ANALYSÉS :
${analysisJson}

QUESTIONS POSÉES ET RÉPONSES :
${qaPairsJson}

FRAMEWORK DE RÉFÉRENCE :
${frameworkContent}

Produis l'analyse complète au format JSON exact :
{
  "axes": [{ "axe": 1, "label": "Maturité métier", "score": 1, "justification": "tirée des réponses" }],
  "scoreGlobal": 0,
  "pourcentage": 0,
  "niveau": "Projet immature|fragile|intermédiaire|mature|très mature",
  "parSocle": [{ "socle": 1, "forces": ["..."], "faiblesses": ["..."], "pointsCritiques": ["..."] }],
  "risques": [{ "risque": "...", "p": 1, "i": 1, "criticite": 1, "mitigation": "..." }],
  "pointsCritiques": ["ce qui peut faire échouer le projet"],
  "opportunites": ["..."],
  "recommandations": [{ "action": "...", "responsable": "...", "delai": "S+1" }],
  "decision": "GO_PRODUCTION|GO_POC|CONDITIONNEL|NO_GO",
  "conditions": ["ce qui doit être vérifié ou fait"],
  "prochaineEtape": "...",
  "blocageImmediat": ""
}
Règles : 11 axes notés de 1 à 5 (scoreGlobal = somme /55, pourcentage = scoreGlobal/55*100).
Top 5 risques max (criticite = p*i). 5 recommandations max.
Décision selon le framework : NO_GO (<40%) · CONDITIONNEL (40-60%) · GO_POC (60-80%) · GO_PRODUCTION (>=80%).`,
  }
}

// ---------------------------------------------------------------------------
// PROMPT 4 — Rapport final (markdown)
// ---------------------------------------------------------------------------

export function buildV2ReportPrompt(scoringJson: string): LLMPrompt {
  return {
    system: `Tu es un consultant senior Beyond Expertise spécialisé en transformation IA.
Rédige en français un rapport de cadrage professionnel, directement présentable en comité de pilotage.
Réponds en markdown structuré uniquement. Chaque affirmation doit être fondée sur l'analyse fournie — n'invente rien.`,
    user: `ANALYSE COMPLÈTE DU PROJET (scoring framework 6 socles) :
${scoringJson}

Structure attendue du rapport :
# Résumé exécutif (3-4 phrases, pour un DG)
# Contexte et problème analysé
# Score de maturité (rappelle le score /55, le pourcentage et le niveau)
# Analyse par socle (forces et faiblesses pour chacun des 6 socles)
# Risques principaux (top 5 avec niveau de criticité)
# Recommandations prioritaires (5 actions avec responsable et délai)
# Décision (GO PRODUCTION / GO POC / CONDITIONNEL / NO GO, argumentée)
# Conditions et prochaines étapes

Style : professionnel, direct, sans jargon technique inutile.`,
  }
}

// ---------------------------------------------------------------------------
// Parsing tolérant
// ---------------------------------------------------------------------------

function extractJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim()
  const start = cleaned.indexOf("{")
  const end = cleaned.lastIndexOf("}")
  if (start === -1 || end === -1 || end < start) return null
  try {
    return JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    return null
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v : ""
}
function strArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : []
}
function num(v: unknown, def = 0): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : def
}
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)))
}

export function parseDocAnalysis(raw: string): DocAnalysis | null {
  const o = extractJson(raw) as Record<string, unknown> | null
  if (!o) return null
  const m = (o.metriques ?? {}) as Record<string, unknown>
  return {
    probleme_metier: str(o.probleme_metier),
    taches_identifiees: strArray(o.taches_identifiees),
    metriques: {
      volume: str(m.volume),
      delai: str(m.delai),
      taux_erreur: str(m.taux_erreur),
    },
    contraintes: strArray(o.contraintes),
    acteurs: strArray(o.acteurs),
    donnees_disponibles: strArray(o.donnees_disponibles),
    zones_floues: strArray(o.zones_floues),
    mots_cles_secteur: strArray(o.mots_cles_secteur),
  }
}

const QUESTION_TYPES: QuestionType[] = ["open", "scale", "boolean"]

export function parseQuestions(raw: string): GeneratedQuestion[] {
  const o = extractJson(raw) as Record<string, unknown> | null
  const list = o && Array.isArray(o.questions) ? o.questions : []
  return (list as unknown[])
    .map((q, i) => {
      const r = (q ?? {}) as Record<string, unknown>
      const t = str(r.type) as QuestionType
      return {
        id: num(r.id, i + 1),
        socle: clamp(num(r.socle, 1), 1, 6),
        dimension: str(r.dimension),
        question: str(r.question),
        pourquoi: str(r.pourquoi),
        type: QUESTION_TYPES.includes(t) ? t : "open",
        impact_decision: str(r.impact_decision),
      }
    })
    .filter((q) => q.question.length > 0)
}

const DECISIONS: FrameworkDecision[] = [
  "GO_PRODUCTION",
  "GO_POC",
  "CONDITIONNEL",
  "NO_GO",
]

export function parseScoring(raw: string): ScoringResult | null {
  const o = extractJson(raw) as Record<string, unknown> | null
  if (!o) return null

  const axes: ScoringAxis[] = Array.isArray(o.axes)
    ? (o.axes as unknown[]).map((a, i) => {
        const r = (a ?? {}) as Record<string, unknown>
        return {
          axe: clamp(num(r.axe, i + 1), 1, 11),
          label: str(r.label),
          score: clamp(num(r.score, 0), 0, 5),
          justification: str(r.justification),
        }
      })
    : []

  const computedTotal = axes.reduce((s, a) => s + a.score, 0)
  const scoreGlobal = clamp(num(o.scoreGlobal, computedTotal), 0, 55)
  const pourcentage = o.pourcentage
    ? clamp(num(o.pourcentage), 0, 100)
    : Math.round((scoreGlobal / 55) * 100)

  const decisionRaw = str(o.decision) as FrameworkDecision
  const decision = DECISIONS.includes(decisionRaw) ? decisionRaw : "CONDITIONNEL"

  return {
    axes,
    scoreGlobal,
    pourcentage,
    niveau: str(o.niveau),
    parSocle: Array.isArray(o.parSocle)
      ? (o.parSocle as unknown[]).map((s, i) => {
          const r = (s ?? {}) as Record<string, unknown>
          return {
            socle: clamp(num(r.socle, i + 1), 1, 6),
            forces: strArray(r.forces),
            faiblesses: strArray(r.faiblesses),
            pointsCritiques: strArray(r.pointsCritiques),
          }
        })
      : [],
    risques: Array.isArray(o.risques)
      ? (o.risques as unknown[]).map((r) => {
          const x = (r ?? {}) as Record<string, unknown>
          const p = clamp(num(x.p, 1), 1, 4)
          const i = clamp(num(x.i, 1), 1, 4)
          return {
            risque: str(x.risque),
            p,
            i,
            criticite: num(x.criticite, p * i),
            mitigation: str(x.mitigation),
          }
        })
      : [],
    pointsCritiques: strArray(o.pointsCritiques),
    opportunites: strArray(o.opportunites),
    recommandations: Array.isArray(o.recommandations)
      ? (o.recommandations as unknown[]).map((r) => {
          const x = (r ?? {}) as Record<string, unknown>
          return {
            action: str(x.action),
            responsable: str(x.responsable),
            delai: str(x.delai),
          }
        })
      : [],
    decision,
    conditions: strArray(o.conditions),
    prochaineEtape: str(o.prochaineEtape),
    blocageImmediat: str(o.blocageImmediat) || undefined,
  }
}
