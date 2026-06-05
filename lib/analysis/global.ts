import type { Decision, RegulatoryAlert } from "@prisma/client"

import type { AnswerMap } from "@/lib/questions"

// ─────────────────────────────────────────────────────────────
// Analyse globale multi-ateliers — déterministe, à partir des
// réponses Q1..Q26 + la décision du moteur. Alimente la page /analysis.
// ─────────────────────────────────────────────────────────────

export interface MaturityDimension {
  key: string
  label: string
  score: number // 0..5
}
export interface QualificationItem {
  capability: string
  type: "Automatisation" | "IA" | "IA avancée"
}
export interface TechMapItem {
  tech: string
  needed: boolean
  reason: string
}
export interface RoadmapPhase {
  phase: string
  items: string[]
  duration: string
}

export interface GlobalAnalysis {
  diagnostic: {
    need: string
    gains: string[]
    processes: string
    actors: string[]
    stakes: string[]
  }
  qualification: { items: QualificationItem[]; summary: string }
  maturity: { dimensions: MaturityDimension[]; global: number } // global 0..100
  riskScore: { value: number; level: string } // 0..100
  feasibilityScore: { value: number; label: string } // 0..100
  techMap: TechMapItem[]
  governance: { label: string; status: "ok" | "warn" | "todo"; note: string }[]
  roadmap: RoadmapPhase[]
  recommendations: string[]
}

// ── lecture des réponses ──────────────────────────────────────
function single(a: AnswerMap, k: string): string | undefined {
  const v = a[k]
  return Array.isArray(v) ? v[0] : v
}
function multi(a: AnswerMap, k: string): string[] {
  const v = a[k]
  return Array.isArray(v) ? v : typeof v === "string" ? [v] : []
}
function text(a: AnswerMap, k: string): string {
  const v = a[k]
  return typeof v === "string" ? v : ""
}
function num(a: AnswerMap, k: string): number {
  return parseInt(single(a, k) ?? "", 10) || 0
}
function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(n)))
}

const GAIN_LABELS: Record<string, string> = {
  temps: "Gain de temps",
  couts: "Réduction des coûts",
  erreurs: "Réduction des erreurs",
  qualite: "Qualité",
  experience: "Expérience usager",
  conformite: "Conformité",
}
const ACTOR_LABELS: Record<string, string> = {
  direction_metier: "Direction métier",
  dsi: "DSI",
  rssi: "RSSI",
  dpo: "DPO",
  cse: "CSE",
  gouvernance: "Gouvernance",
}
const CAP_LABELS: Record<string, string> = {
  regles: "Application de règles fixes",
  langage: "Compréhension du langage",
  classification: "Classification / tri",
  generation: "Génération de contenu",
  recherche: "Recherche documentaire",
  raisonnement: "Raisonnement métier",
}
const CAP_TYPE: Record<string, QualificationItem["type"]> = {
  regles: "Automatisation",
  classification: "IA",
  langage: "IA",
  recherche: "IA",
  generation: "IA",
  raisonnement: "IA avancée",
}

export function buildGlobalAnalysis(
  a: AnswerMap,
  decision: Decision,
  alerts: RegulatoryAlert[],
): GlobalAnalysis {
  // ── Atelier 1 — Diagnostic métier ──
  const gains = multi(a, "Q14").map((g) => GAIN_LABELS[g] ?? g)
  const actors = multi(a, "Q16").map((x) => ACTOR_LABELS[x] ?? x)
  const stakes: string[] = []
  if (multi(a, "Q7").some((v) => ["health", "social", "legal"].includes(v)))
    stakes.push("Données sensibles")
  if (["important", "critique"].includes(single(a, "Q24") ?? ""))
    stakes.push("Fort impact en cas d'erreur")
  if (["souvent", "tres_souvent"].includes(single(a, "Q21") ?? ""))
    stakes.push("Cas ambigus fréquents")
  if (single(a, "Q17") === "faible") stakes.push("Données peu fiables")

  // ── Atelier 2 — Qualification IA vs Automatisation ──
  const caps = multi(a, "Q20")
  const qualItems: QualificationItem[] = caps.map((c) => ({
    capability: CAP_LABELS[c] ?? c,
    type: CAP_TYPE[c] ?? "IA",
  }))
  if (single(a, "Q8") === "auto_no_human")
    qualItems.push({
      capability: "Décision / actions autonomes",
      type: "IA avancée",
    })
  const nIA = qualItems.filter((i) => i.type !== "Automatisation").length
  const qualSummary =
    qualItems.length === 0
      ? "Capacités à préciser (question « nature des traitements » non renseignée)."
      : nIA === 0
        ? "Le besoin relève surtout de l'automatisation classique : pas d'IA nécessaire."
        : nIA >= 3
          ? "Besoin fortement orienté IA (plusieurs capacités cognitives requises)."
          : "Besoin mixte : automatisation pour les règles, IA pour la compréhension."

  // ── Atelier 4 — Maturité (5 dimensions /5) ──
  const q12 = { formalized: 5, partial: 3, not: 1 }[single(a, "Q12") ?? ""] ?? 2
  const q6 =
    { yes_structured: 5, yes_scattered: 3, no: 1, unknown: 2 }[
      single(a, "Q6") ?? ""
    ] ?? 2
  const q17 =
    { bonne: 5, moyenne: 3, faible: 1, unknown: 2 }[single(a, "Q17") ?? ""] ?? 2
  const q23 =
    { obligatoire: 5, souhaitable: 3, non: 2, unknown: 1 }[
      single(a, "Q23") ?? ""
    ] ?? 2
  const q8sup =
    { assist_only: 5, auto_with_human: 4, auto_no_human: 2, unknown: 2 }[
      single(a, "Q8") ?? ""
    ] ?? 2
  const q9 =
    { yes_api: 5, to_check: 3, no: 1, unknown: 2 }[single(a, "Q9") ?? ""] ?? 2
  const q11 =
    { extend: 4, partial: 3, new: 2, unknown: 2 }[single(a, "Q11") ?? ""] ?? 2
  const q10 =
    { ready: 5, partial: 3, resistant: 1, not_asked: 2 }[
      single(a, "Q10") ?? ""
    ] ?? 2
  const q25 = num(a, "Q25") || 3
  const q26 = num(a, "Q26") || 3
  const avg = (...xs: number[]) =>
    Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10

  const dimensions: MaturityDimension[] = [
    { key: "metier", label: "Métier", score: avg(q25, q12) },
    { key: "donnees", label: "Données", score: avg(q6, q17) },
    { key: "gouvernance", label: "Gouvernance", score: avg(q23, q8sup) },
    { key: "technique", label: "Technique", score: avg(q9, q11) },
    { key: "organisation", label: "Organisation", score: avg(q26, q10) },
  ]
  const maturityGlobal = clamp(
    (dimensions.reduce((s, d) => s + d.score, 0) / (dimensions.length * 5)) *
      100,
  )

  // ── Score de risque /100 ──
  const baseRisk =
    { HIGH: 85, MEDIUM: 60, LOW: 35, MINIMAL: 15 }[decision.regulatoryLevel] ??
    40
  const impactAdj =
    { critique: 15, important: 8, modere: 0, faible: -8 }[
      single(a, "Q24") ?? ""
    ] ?? 0
  const autoAdj = single(a, "Q8") === "auto_no_human" ? 10 : 0
  const riskValue = clamp(baseRisk + impactAdj + autoAdj)
  const riskLevel =
    riskValue >= 70 ? "Élevé" : riskValue >= 45 ? "Moyen" : "Faible"

  // ── Score de faisabilité /100 ──
  const feasValue = clamp(
    ((dimensions[1].score + dimensions[3].score + dimensions[4].score) / 15) *
      100,
  )
  const feasLabel =
    feasValue >= 66 ? "Bonne" : feasValue >= 40 ? "Modérée" : "Faible"

  // ── Atelier 5 — Cartographie IA ──
  const docs = multi(a, "Q18")
  const techMap: TechMapItem[] = [
    {
      tech: "RPA (automatisation)",
      needed: caps.includes("regles") && !caps.includes("langage"),
      reason: "Règles fixes, peu de compréhension nécessaire.",
    },
    {
      tech: "OCR",
      needed: docs.some((d) => ["scans", "images"].includes(d)),
      reason: "Documents papier / scannés à océriser.",
    },
    {
      tech: "NLP / LLM",
      needed: caps.includes("langage") || caps.includes("generation"),
      reason: "Compréhension ou génération de texte.",
    },
    {
      tech: "ML",
      needed:
        caps.includes("classification") && single(a, "Q6") === "yes_structured",
      reason: "Classification sur données structurées.",
    },
    {
      tech: "RAG",
      needed: caps.includes("recherche"),
      reason: "Recherche/réponses sur une base documentaire.",
    },
    {
      tech: "Agents IA",
      needed:
        single(a, "Q8") === "auto_no_human" || caps.includes("raisonnement"),
      reason: "Actions autonomes ou raisonnement complexe (à encadrer).",
    },
  ]

  // ── Atelier 6 — Gouvernance / conformité ──
  const governance: GlobalAnalysis["governance"] = [
    {
      label: "Supervision humaine",
      status:
        single(a, "Q8") === "auto_no_human"
          ? "warn"
          : "ok",
      note:
        single(a, "Q8") === "auto_no_human"
          ? "Décision autonome : supervision à mettre en place (IA Act Art. 14)."
          : "Un agent valide / l'IA assiste seulement.",
    },
    {
      label: "Traçabilité",
      status:
        single(a, "Q23") === "obligatoire"
          ? "ok"
          : single(a, "Q23") === "non"
            ? "warn"
            : "todo",
      note:
        single(a, "Q23") === "obligatoire"
          ? "Journalisation requise et prévue."
          : "Définir la journalisation des traitements.",
    },
    {
      label: "Données personnelles / RGPD",
      status: decision.regulatoryLevel === "MINIMAL" ? "ok" : "warn",
      note:
        decision.regulatoryLevel === "MINIMAL"
          ? "Pas de données sensibles identifiées."
          : `Niveau de risque ${decision.regulatoryLevel.toLowerCase()} : ${alerts.length} obligation(s) à traiter.`,
    },
  ]

  // ── Roadmap ──
  const needsAipd = alerts.some((al) => al.article?.includes("35"))
  const roadmap = buildRoadmap(decision.verdict, needsAipd)

  // ── Recommandations ──
  const recommendations: string[] = []
  if (needsAipd)
    recommendations.push("Lancer l'AIPD avec le DPO avant tout développement.")
  if (maturityGlobal < 50)
    recommendations.push(
      "Renforcer la maturité (cadrage, données, adhésion) avant d'investir.",
    )
  if (single(a, "Q6") === "no")
    recommendations.push("Mener une étude de faisabilité data (données absentes).")
  if (feasValue < 40)
    recommendations.push("Sécuriser la faisabilité technique avec la DSI.")
  if (qualItems.length && nIA === 0)
    recommendations.push(
      "Privilégier une automatisation classique (RPA) plutôt qu'un projet IA.",
    )
  if (recommendations.length === 0)
    recommendations.push(
      "Conditions globalement réunies : cadrer le périmètre et lancer la mise en œuvre.",
    )

  return {
    diagnostic: {
      need: text(a, "Q1") || decision.justification,
      gains,
      processes: text(a, "Q15"),
      actors,
      stakes,
    },
    qualification: { items: qualItems, summary: qualSummary },
    maturity: { dimensions, global: maturityGlobal },
    riskScore: { value: riskValue, level: riskLevel },
    feasibilityScore: { value: feasValue, label: feasLabel },
    techMap,
    governance,
    roadmap,
    recommendations,
  }
}

function buildRoadmap(verdict: string, needsAipd: boolean): RoadmapPhase[] {
  const aipd = needsAipd
    ? [{ phase: "0. AIPD", items: ["Analyse d'impact (DPO)"], duration: "2-3 sem." }]
    : []
  if (verdict === "STUDY")
    return [
      ...aipd,
      { phase: "1. Étude", items: ["Faisabilité données & besoin", "Consultation métier"], duration: "3-4 sem." },
      { phase: "2. Cadrage", items: ["Définir le périmètre cible"], duration: "2 sem." },
      { phase: "3. Décision", items: ["Go/No-Go éclairé"], duration: "—" },
    ]
  if (verdict === "AUTOMATION")
    return [
      { phase: "1. Cadrage", items: ["Spécifier les règles / workflows"], duration: "2 sem." },
      { phase: "2. Mise en œuvre", items: ["Automatisation (RPA / règles)"], duration: "4-6 sem." },
      { phase: "3. Mesure", items: ["Gains, généralisation"], duration: "continu" },
    ]
  if (verdict === "NOGO")
    return [
      { phase: "1. Reformulation", items: ["Clarifier le besoin", "Réunir les prérequis"], duration: "—" },
    ]
  // GO / POC
  return [
    ...aipd,
    { phase: "1. POC", items: ["Périmètre réduit", "Préparer les données", "Critères de réussite"], duration: "6-8 sem." },
    { phase: "2. Recette", items: ["Tests + formation agents"], duration: "2-3 sem." },
    { phase: "3. Déploiement", items: ["Intégration SI", "Montée en charge"], duration: "4-6 sem." },
    { phase: "4. Run", items: ["MCO, supervision, amélioration continue"], duration: "continu" },
  ]
}
