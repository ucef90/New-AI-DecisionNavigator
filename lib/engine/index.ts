import type {
  Verdict,
  TechType,
  RegulatoryLevel,
  AlertLevel,
  RegulatoryFramework,
} from "@prisma/client"

import type { AnswerMap } from "@/lib/questions"
import type { DecisionScore } from "@/lib/decision/labels"

// ─────────────────────────────────────────────────────────────
// Moteur de décision — pur (aucune dépendance UI / DB).
// Entrée : AnswerMap (réponses Q1..Q10 + QR1..QR3).
// Sortie : EngineResult (verdict, techno, score, alertes, règles).
// ─────────────────────────────────────────────────────────────

export interface AlertInput {
  level: AlertLevel
  framework: RegulatoryFramework
  article?: string
  obligation: string
  action: string
  deadline?: string
}

export interface EngineResult {
  verdict: Verdict
  techRecommendation: TechType | null
  justification: string
  score: DecisionScore
  rulesTriggered: string[]
  regulatoryLevel: RegulatoryLevel
  alerts: AlertInput[]
}

const SENSITIVE = ["health", "social", "legal"]
const DOC_KEYWORDS = ["formulaire", "document", "courrier", "dossier"]
const KB_KEYWORDS = [
  "base de connaissance",
  "base de connaissances",
  "connaissance interne",
  "documentation interne",
  "faq",
]

// ── lecture des réponses ──────────────────────────────────────
function single(a: AnswerMap, key: string): string | undefined {
  const v = a[key]
  return Array.isArray(v) ? v[0] : v
}
function multi(a: AnswerMap, key: string): string[] {
  const v = a[key]
  if (Array.isArray(v)) return v
  return typeof v === "string" ? [v] : []
}
function text(a: AnswerMap, key: string): string {
  const v = a[key]
  return typeof v === "string" ? v : ""
}
function clamp(n: number): number {
  return Math.max(1, Math.min(3, Math.round(n)))
}

// ── niveau réglementaire ──────────────────────────────────────
export function computeRegulatoryLevel(a: AnswerMap): RegulatoryLevel {
  const q7 = multi(a, "Q7")
  const q8 = single(a, "Q8")
  const hasSensitive = q7.some((v) => SENSITIVE.includes(v))
  const hasHr = q7.includes("hr")
  const hasIdentity = q7.includes("identity")

  if (q7.length === 0 || (q7.includes("none") && q7.length === 1)) {
    return "MINIMAL"
  }
  if (hasSensitive && q8 === "auto_no_human") return "HIGH"
  if (hasSensitive) return "MEDIUM" // auto_with_human / assist_only / inconnu
  if (hasHr && q8 === "auto_no_human") return "MEDIUM"
  if (q7.includes("unknown")) return "MEDIUM"
  if (hasIdentity || hasHr) return "LOW"
  return "LOW"
}

// ── explication du niveau de risque (pour le graphe) ─────────
export interface RiskFactor {
  label: string
  impact: "up" | "down" | "neutral"
  note: string
}

export function regulatoryFactors(a: AnswerMap): RiskFactor[] {
  const q7 = multi(a, "Q7")
  const q8 = single(a, "Q8")
  const qr1 = single(a, "QR1")
  const factors: RiskFactor[] = []

  const hasSensitive = q7.some((v) => SENSITIVE.includes(v))
  const noData = q7.length === 0 || (q7.includes("none") && q7.length === 1)

  // Données personnelles
  if (noData) {
    factors.push({
      label: "Aucune donnée personnelle",
      impact: "down",
      note: "Niveau réglementaire minimal",
    })
  } else {
    if (hasSensitive)
      factors.push({
        label: "Données sensibles (santé, social, judiciaire)",
        impact: "up",
        note: "RGPD Art. 9 — facteur aggravant majeur",
      })
    if (q7.includes("hr"))
      factors.push({
        label: "Données RH / professionnelles",
        impact: "up",
        note: "Consultation CSE possible",
      })
    if (q7.includes("identity") && !hasSensitive)
      factors.push({
        label: "Données d'identité",
        impact: "up",
        note: "Risque modéré à faible",
      })
    if (q7.includes("unknown"))
      factors.push({
        label: "Nature des données à clarifier",
        impact: "up",
        note: "Prudence — à cartographier avec le DPO",
      })
  }

  // Automatisation de la décision
  if (q8 === "auto_no_human")
    factors.push({
      label: "Décision automatisée sans validation humaine",
      impact: "up",
      note: "RGPD Art. 22 — facteur aggravant majeur",
    })
  else if (q8 === "auto_with_human")
    factors.push({
      label: "Décision validée par un agent",
      impact: "neutral",
      note: "Supervision humaine en place",
    })
  else if (q8 === "assist_only")
    factors.push({
      label: "Aide à la décision uniquement",
      impact: "down",
      note: "Facteur atténuant",
    })

  // Hébergement
  if (qr1 === "no")
    factors.push({
      label: "Hébergement hors UE",
      impact: "up",
      note: "RGPD Art. 44-49 — transfert à encadrer",
    })
  else if (qr1 === "unknown")
    factors.push({
      label: "Hébergement à confirmer",
      impact: "up",
      note: "À vérifier avant lancement",
    })
  else if (qr1 === "yes_france" || qr1 === "yes_europe")
    factors.push({
      label: "Hébergement en France / UE",
      impact: "down",
      note: "Conforme à la localisation des données",
    })

  return factors
}

// ── score 6 axes ──────────────────────────────────────────────
const LEVEL_TO_RISK_SCORE: Record<RegulatoryLevel, number> = {
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  MINIMAL: 3,
}

export function computeScore(
  a: AnswerMap,
  level: RegulatoryLevel,
): DecisionScore {
  // Axe 1 — Clarté du besoin (Q1, heuristique de longueur)
  const q1len = text(a, "Q1").trim().length
  const axe1 = q1len >= 120 ? 3 : q1len >= 40 ? 2 : 1

  // Axe 2 — Pertinence IA (Q4 + Q5)
  const q4 = single(a, "Q4")
  const q5 = single(a, "Q5")
  const q4Score = { stable: 1, mostly_stable: 2, variable: 3, complex: 3 }[
    q4 ?? ""
  ] ?? 2
  const q5Relevance = {
    low_simple: 1,
    high_simple: 1,
    high_complex: 3,
    low_complex: 3,
  }[q5 ?? ""] ?? 2
  const axe2 = clamp((q4Score + q5Relevance) / 2)

  // Axe 3 — Maturité data (Q6)
  const q6 = single(a, "Q6")
  const axe3 =
    { yes_structured: 3, yes_scattered: 2, no: 1, unknown: 1 }[q6 ?? ""] ?? 1

  // Axe 4 — Valeur métier (Q2 + Q3, bonus usagers)
  const q2 = single(a, "Q2")
  const q2Score =
    { daily_multiple: 3, daily: 3, weekly: 2, occasional: 1 }[q2 ?? ""] ?? 1
  const usersBonus = multi(a, "Q3").includes("users") ? 0.5 : 0
  let axe4 = clamp(q2Score + usersBonus)
  if (q5 === "low_simple") axe4 = 1 // peu de cas simples : faible valeur

  // Axe 5 — Risques (inverse du niveau réglementaire)
  const axe5 = LEVEL_TO_RISK_SCORE[level]

  // Axe 6 — Faisabilité (Q9 + Q10)
  const q9 = single(a, "Q9")
  const q10 = single(a, "Q10")
  const q9Score = { yes_api: 3, to_check: 2, unknown: 2, no: 1 }[q9 ?? ""] ?? 2
  const q10Score =
    { ready: 3, partial: 2, resistant: 1, not_asked: 1 }[q10 ?? ""] ?? 2
  // Ajustements cadrage (Q11 outil existant, Q13 périmètre) — neutres si absents.
  const q11 = single(a, "Q11")
  const q13 = single(a, "Q13")
  let axe6Raw = (q9Score + q10Score) / 2
  if (q11 === "extend") axe6Raw += 0.4
  else if (q11 === "new") axe6Raw -= 0.2
  if (q13 === "multi_direction") axe6Raw -= 0.4
  const axe6 = clamp(axe6Raw)

  const total = axe1 + axe2 + axe3 + axe4 + axe5 + axe6
  return { axe1, axe2, axe3, axe4, axe5, axe6, total }
}

// ── verdict par défaut (grille) ───────────────────────────────
function verdictFromScore(total: number): Verdict {
  if (total >= 15) return "GO"
  if (total >= 10) return "POC"
  if (total >= 6) return "STUDY"
  return "NOGO"
}

const RANK: Record<string, number> = { GO: 4, POC: 3, STUDY: 2, NOGO: 1 }
function cap(verdict: Verdict, max: Verdict): Verdict {
  if (RANK[verdict] === undefined || RANK[max] === undefined) return verdict
  return RANK[verdict] > RANK[max] ? max : verdict
}

// ── arbre techRecommendation ──────────────────────────────────
export function recommendTech(a: AnswerMap): TechType | null {
  const q4 = single(a, "Q4")
  const q5 = single(a, "Q5")
  const q6 = single(a, "Q6")
  const q1 = text(a, "Q1").toLowerCase()

  if (q4 === "stable" && q5 === "high_simple") return "RPA"

  if (q4 === "variable" || q4 === "complex") {
    if (q6 === "yes_structured") return "ML"
    if (KB_KEYWORDS.some((k) => q1.includes(k))) return "RAG"
    if (q5 === "high_complex" || q5 === "low_complex") {
      if (DOC_KEYWORDS.some((k) => q1.includes(k))) return "OCR"
      return "LLM"
    }
    return "LLM"
  }

  // Processus assez stable et répétitif portant sur des documents → OCR
  if (
    q4 === "mostly_stable" &&
    q5 === "high_simple" &&
    DOC_KEYWORDS.some((k) => q1.includes(k))
  ) {
    return "OCR"
  }
  return null // mostly_stable / indéterminé : à préciser
}

// ── affinités technologiques (pour le radar) ─────────────────
// Score 0-100 par techno : « à quel point le projet ressemble à… »
export function computeTechAffinities(
  a: AnswerMap,
): { tech: TechType; value: number }[] {
  const q4 = single(a, "Q4")
  const q5 = single(a, "Q5")
  const q6 = single(a, "Q6")
  const q8 = single(a, "Q8")
  const q1 = text(a, "Q1").toLowerCase()

  const docs = DOC_KEYWORDS.some((k) => q1.includes(k))
  const kb = KB_KEYWORDS.some((k) => q1.includes(k))
  const variable = q4 === "variable" || q4 === "complex"
  const repetitive =
    (q4 === "stable" || q4 === "mostly_stable") && q5 === "high_simple"
  const structured = q6 === "yes_structured"
  const highVolume = q5 === "high_simple" || q5 === "high_complex"

  const s = { RPA: 8, ML: 8, LLM: 8, RAG: 6, OCR: 8, AGENT: 4 }

  if (q4 === "stable") s.RPA += 45
  if (q5 === "high_simple") s.RPA += 35
  if (repetitive) s.RPA += 8

  if (variable && structured) s.ML += 55
  else if (structured) s.ML += 25
  if (q5 === "high_complex" || q5 === "low_complex") s.ML += 10

  if (variable) s.LLM += 35
  if (!structured) s.LLM += 18
  if (!docs && !kb) s.LLM += 17
  if (highVolume) s.LLM += 8

  if (kb) s.RAG += 65
  if (variable && !structured) s.RAG += 18

  if (docs) s.OCR += 55
  if (highVolume) s.OCR += 15
  if (repetitive) s.OCR += 12

  if (q8 === "auto_no_human") s.AGENT += 72
  else if (q8 === "auto_with_human") s.AGENT += 22

  const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
  return (["RPA", "ML", "LLM", "RAG", "OCR", "AGENT"] as TechType[]).map(
    (tech) => ({ tech, value: clamp100(s[tech]) }),
  )
}

// Explique quels signaux des réponses pilotent les affinités techno.
export function techAffinityReasons(a: AnswerMap): string[] {
  const q4 = single(a, "Q4")
  const q5 = single(a, "Q5")
  const q6 = single(a, "Q6")
  const q8 = single(a, "Q8")
  const q1 = text(a, "Q1").toLowerCase()
  const docs = DOC_KEYWORDS.some((k) => q1.includes(k))
  const kb = KB_KEYWORDS.some((k) => q1.includes(k))
  const variable = q4 === "variable" || q4 === "complex"

  const reasons: string[] = []
  if (q4 === "stable" && q5 === "high_simple")
    reasons.push(
      "Processus stable et répétitif sur des cas simples → forte affinité RPA (automatisation classique, sans IA).",
    )
  if (variable)
    reasons.push(
      "Traitement variable ou complexe → l'IA devient pertinente (ML / LLM).",
    )
  if (q6 === "yes_structured")
    reasons.push(
      "Données existantes et structurées → affinité ML (apprentissage sur historique).",
    )
  if (variable && q6 !== "yes_structured")
    reasons.push(
      "Données dispersées ou non structurées → orientation LLM (traitement du langage).",
    )
  if (docs)
    reasons.push(
      "Mots-clés documentaires détectés dans la description (formulaire, document, courrier, dossier) → affinité OCR.",
    )
  if (kb)
    reasons.push(
      "Base de connaissance interne mentionnée → affinité RAG (réponses sourcées sur vos documents).",
    )
  if (q8 === "auto_no_human")
    reasons.push(
      "Décision automatisée sans validation humaine → composante AGENT (système autonome, à encadrer).",
    )
  if (q5 === "high_simple" || q5 === "high_complex")
    reasons.push("Volume de cas élevé → renforce l'intérêt de l'automatisation.")
  if (reasons.length === 0)
    reasons.push(
      "Le besoin doit être précisé : aucun signal technologique dominant ne se dégage encore.",
    )
  return reasons
}

// ── règles dures R1-R6 ────────────────────────────────────────
function applyHardRules(
  a: AnswerMap,
  base: { verdict: Verdict; tech: TechType | null },
) {
  let { verdict, tech } = base
  const triggered: string[] = []
  const messages: string[] = []

  const q4 = single(a, "Q4")
  const q5 = single(a, "Q5")
  const q6 = single(a, "Q6")
  const q7 = multi(a, "Q7")
  const q8 = single(a, "Q8")
  const qr1 = single(a, "QR1")
  const qr2 = single(a, "QR2")
  const qr3 = single(a, "QR3")
  const hasSensitive = q7.some((v) => SENSITIVE.includes(v))
  const hasData = !(q7.length === 0 || (q7.includes("none") && q7.length === 1))

  // R2 — processus stable et répétitif → automatisation classique
  if (q4 === "stable" && q5 === "high_simple") {
    verdict = "AUTOMATION"
    tech = "RPA"
    triggered.push("R2")
    messages.push(
      "Processus stable et répétitif : l'automatisation classique est plus adaptée que l'IA.",
    )
  }

  // R1 — décision automatisée sur données sensibles
  if (q8 === "auto_no_human" && hasSensitive) {
    verdict = cap(verdict, "POC")
    triggered.push("R1")
    messages.push(
      "Décision automatisée sur données sensibles : supervision humaine obligatoire avant GO.",
    )
  }

  // R3 — pas de données
  if (q6 === "no") {
    verdict = cap(verdict, "STUDY")
    triggered.push("R3")
    messages.push(
      "Pas de données disponibles : une étude de faisabilité data est nécessaire avant tout projet IA.",
    )
  }

  // R5 — absence de supervision sur décision automatisée
  if ((qr3 === "no" || qr3 === "not_planned") && q8 === "auto_no_human") {
    verdict = cap(verdict, "POC")
    triggered.push("R5")
    messages.push(
      "Absence de supervision humaine : non conforme IA Act Art.14 et RGPD Art.22.",
    )
  }

  // R4 — hébergement hors UE (bloquant avant GO)
  if (qr1 === "no" && hasData) {
    verdict = cap(verdict, "POC")
    triggered.push("R4")
    messages.push(
      "Hébergement hors UE détecté : analyse juridique RGPD Art.44-49 requise avant GO.",
    )
  }

  // R6 — AIPD obligatoire non planifiée (bloquant : lancement impossible sans AIPD)
  if (hasSensitive && qr2 === "no") {
    verdict = cap(verdict, "POC")
    triggered.push("R6")
    messages.push(
      "AIPD obligatoire non planifiée : lancement impossible sans analyse d'impact (RGPD Art.35).",
    )
  }

  // Override AGENT : décision autonome sur une techno IA
  if (q8 === "auto_no_human" && tech && verdict !== "AUTOMATION") {
    tech = "AGENT"
  }

  return { verdict, tech, triggered, messages }
}

// ── alertes réglementaires ────────────────────────────────────
export function generateAlerts(
  a: AnswerMap,
  level: RegulatoryLevel,
): AlertInput[] {
  const alerts: AlertInput[] = []
  const q7 = multi(a, "Q7")
  const q8 = single(a, "Q8")
  const qr1 = single(a, "QR1")
  const qr2 = single(a, "QR2")
  const qr3 = single(a, "QR3")
  const hasSensitive = q7.some((v) => SENSITIVE.includes(v))
  const hasHr = q7.includes("hr")
  const hasData = !(q7.length === 0 || (q7.includes("none") && q7.length === 1))
  const isAuto = q8 === "auto_no_human" || q8 === "auto_with_human"

  if (q7.includes("unknown")) {
    alerts.push({
      level: "MEDIUM",
      framework: "CNIL",
      obligation: "Nature des données personnelles à clarifier.",
      action: "Cartographier les données avec le DPO ; une AIPD peut être requise.",
    })
  }
  if (hasSensitive) {
    alerts.push({
      level: "HIGH",
      framework: "RGPD",
      article: "Art. 9",
      obligation:
        "Traitement de données sensibles : base légale renforcée requise.",
      action:
        "Identifier la base légale, minimiser les données et informer les personnes.",
    })
  }
  if (q8 === "auto_no_human") {
    alerts.push({
      level: "HIGH",
      framework: "RGPD",
      article: "Art. 22",
      obligation: "Décision exclusivement automatisée impactant des personnes.",
      action: "Prévoir une intervention humaine et un droit de contestation.",
      deadline: "Avant lancement",
    })
  }
  if (hasSensitive || q8 === "auto_no_human") {
    const planned = qr2 === "yes_done" || qr2 === "yes_planned"
    alerts.push({
      level: planned ? "MEDIUM" : "HIGH",
      framework: "RGPD",
      article: "Art. 35",
      obligation: planned
        ? "Analyse d'impact (AIPD) requise — réalisée ou planifiée."
        : "Analyse d'impact (AIPD) obligatoire et non planifiée.",
      action: planned
        ? "Finaliser et tenir l'AIPD à jour."
        : "Réaliser l'AIPD avec le DPO avant tout lancement.",
      deadline: "Avant lancement",
    })
  }
  if (isAuto) {
    const ok = qr3 === "yes_always" || qr3 === "yes_sometimes"
    alerts.push({
      level: ok ? "LOW" : "HIGH",
      framework: "AI_ACT",
      article: "Art. 14",
      obligation: "Supervision humaine exigée pour les systèmes à risque.",
      action: ok
        ? "Documenter le dispositif de supervision (validation humaine)."
        : "Mettre en place une supervision humaine avant tout déploiement.",
      deadline: "2 déc. 2027",
    })
  }
  if (hasSensitive) {
    alerts.push({
      level: "MEDIUM",
      framework: "AI_ACT",
      obligation:
        "Domaine potentiellement à haut risque (Annexe III — services sociaux / santé).",
      action:
        "Évaluer la qualification haut risque et préparer la documentation technique.",
      deadline: "2 déc. 2027",
    })
  }
  if (hasHr && isAuto) {
    alerts.push({
      level: "MEDIUM",
      framework: "CSE",
      article: "L. 2312-38",
      obligation:
        "IA impactant les conditions de travail ou l'évaluation des agents.",
      action: "Consulter le CSE avant tout déploiement.",
    })
  }
  if ((qr1 === "no" || qr1 === "unknown") && hasData) {
    alerts.push({
      level: qr1 === "no" ? "HIGH" : "MEDIUM",
      framework: "RGPD",
      article: "Art. 44-49",
      obligation: "Hébergement potentiellement hors UE.",
      action:
        "Vérifier la localisation des données et l'encadrement des transferts.",
    })
  }
  if (level === "HIGH") {
    alerts.push({
      level: "LOW",
      framework: "ISO_42001",
      obligation: "Système à haut risque : gouvernance IA recommandée.",
      action: "Évaluer la mise en place d'un système de management IA (SMIA).",
    })
  }
  if (level === "LOW" && alerts.length === 0) {
    alerts.push({
      level: "LOW",
      framework: "RGPD",
      article: "Art. 5 & 13",
      obligation:
        "Données personnelles non sensibles : principes RGPD applicables.",
      action:
        "Tenir le registre des traitements et informer les personnes concernées.",
    })
  }
  if (level === "MINIMAL") {
    alerts.push({
      level: "LOW",
      framework: "RGPD",
      article: "Art. 5",
      obligation: "Pas de données sensibles, mais principes RGPD applicables.",
      action: "Tenir le registre des traitements et informer les personnes.",
    })
  }
  return alerts
}

// ── justification ─────────────────────────────────────────────
const VERDICT_BASE: Record<Verdict, string> = {
  GO: "Le projet est mûr sur l'ensemble des axes : les conditions d'un lancement sont réunies.",
  POC: "Le besoin est pertinent mais comporte des incertitudes : un POC permettra de valider la faisabilité avant tout déploiement.",
  STUDY:
    "Plusieurs prérequis ne sont pas réunis : une étude préalable est nécessaire avant d'engager un projet IA.",
  AUTOMATION:
    "Le traitement est stable et répétitif : une automatisation classique, sans IA, répond mieux au besoin.",
  NOGO: "Les conditions ne sont pas réunies pour un projet IA en l'état.",
}

function buildJustification(
  verdict: Verdict,
  score: DecisionScore,
  messages: string[],
): string {
  const parts = [VERDICT_BASE[verdict], `Score global : ${score.total}/18.`]
  if (messages.length) parts.push(messages.join(" "))
  return parts.join(" ")
}

// ── point d'entrée ────────────────────────────────────────────
export function runEngine(a: AnswerMap): EngineResult {
  const regulatoryLevel = computeRegulatoryLevel(a)
  const score = computeScore(a, regulatoryLevel)
  const baseVerdict = verdictFromScore(score.total)
  const baseTech = recommendTech(a)

  const { verdict, tech, triggered, messages } = applyHardRules(a, {
    verdict: baseVerdict,
    tech: baseTech,
  })

  // Note de maturité (Q12) — additive, sans effet si absente.
  let justification = buildJustification(verdict, score, messages)
  if (single(a, "Q12") === "not") {
    justification +=
      " Les processus étant peu formalisés, un cadrage préalable est recommandé avant tout développement."
  }

  return {
    verdict,
    techRecommendation: tech,
    justification,
    score,
    rulesTriggered: triggered,
    regulatoryLevel,
    alerts: generateAlerts(a, regulatoryLevel),
  }
}
