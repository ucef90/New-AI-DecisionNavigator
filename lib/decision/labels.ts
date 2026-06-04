import type {
  Verdict,
  TechType,
  RegulatoryLevel,
  AlertLevel,
  RegulatoryFramework,
} from "@prisma/client"

/**
 * Libellés et styles partagés pour la présentation des décisions.
 * Utilisé par la page résultats et le dashboard. Faible variance visuelle :
 * chaque dimension a un seul traitement cohérent (teinte douce + bordure).
 */

type Style = { label: string; className: string }

export const VERDICT_STYLES: Record<Verdict, Style> = {
  GO: {
    label: "GO",
    className:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  POC: {
    label: "POC",
    className:
      "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  },
  STUDY: {
    label: "ÉTUDE",
    className:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  AUTOMATION: {
    label: "AUTOMATISATION",
    className:
      "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
  },
  NOGO: {
    label: "NO GO",
    className:
      "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  },
}

export const VERDICT_DESCRIPTIONS: Record<Verdict, string> = {
  GO: "Le projet est mûr : lancement recommandé.",
  POC: "Tester la faisabilité via une preuve de concept avant tout déploiement.",
  STUDY: "Une étude préalable est nécessaire avant de décider.",
  AUTOMATION:
    "L'automatisation classique (sans IA) est plus adaptée à ce besoin.",
  NOGO: "Le projet n'est pas pertinent ou pas prêt en l'état.",
}

// Sens concret du verdict : ce que le chef de projet doit en retenir.
export const VERDICT_MEANING: Record<Verdict, string> = {
  GO: "Vous pouvez engager le projet. Les conditions techniques, métier et réglementaires sont réunies. L'étape suivante est le cadrage opérationnel (équipe, budget, planning) puis la mise en œuvre.",
  POC: "Ne déployez pas tout de suite. Réalisez d'abord une preuve de concept (POC) sur un périmètre réduit pour valider la faisabilité et lever les incertitudes avant d'investir.",
  STUDY:
    "Le projet n'est pas encore mûr. Menez une étude préalable (données, faisabilité, cadrage du besoin) avant toute décision d'investissement.",
  AUTOMATION:
    "L'IA n'est pas nécessaire ici. Une automatisation classique (règles métier, RPA) traitera ce besoin plus simplement, plus sûrement et à moindre coût.",
  NOGO: "N'engagez pas ce projet en l'état. Les conditions ne sont pas réunies : reformulez le besoin ou réunissez les prérequis manquants avant de réévaluer.",
}

// Explication grand public de chaque technologie.
export const TECH_EXPLANATION: Record<TechType, string> = {
  RPA: "Des robots logiciels exécutent automatiquement des tâches répétitives sur vos outils existants, en suivant des règles précises. Ce n'est pas de l'IA.",
  ML: "Un modèle d'apprentissage automatique repère des tendances dans vos données passées pour prédire ou classer de nouveaux cas.",
  LLM: "Un modèle de langage comprend et rédige du texte en langage naturel : résumer, classer, répondre, reformuler.",
  RAG: "Un modèle de langage qui s'appuie sur vos propres documents pour répondre avec des informations à jour et traçables.",
  OCR: "La reconnaissance automatique de documents extrait le texte de pièces papier ou scannées pour le saisir sans ressaisie manuelle.",
  AGENT:
    "Un système autonome qui enchaîne plusieurs actions pour atteindre un objectif, avec une intervention humaine minimale (à encadrer).",
}

export const TECH_LABELS: Record<TechType, string> = {
  RPA: "RPA — Automatisation robotisée des processus",
  ML: "ML — Apprentissage automatique",
  LLM: "LLM — Modèle de langage",
  RAG: "RAG — Génération augmentée par récupération",
  OCR: "OCR — Reconnaissance de documents",
  AGENT: "AGENT — Agent autonome",
}

export const TECH_SHORT: Record<TechType, string> = {
  RPA: "RPA",
  ML: "ML",
  LLM: "LLM",
  RAG: "RAG",
  OCR: "OCR",
  AGENT: "AGENT",
}

export const REG_LEVEL_STYLES: Record<RegulatoryLevel, Style> = {
  HIGH: {
    label: "Élevé",
    className:
      "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  },
  MEDIUM: {
    label: "Moyen",
    className:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  LOW: {
    label: "Faible",
    className:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  MINIMAL: {
    label: "Minimal",
    className: "bg-muted text-muted-foreground border-border",
  },
}

// Pastille de gravité (indicateur de tête, pas de bordure latérale — bannie)
export const ALERT_STYLES: Record<AlertLevel, { label: string; dot: string }> = {
  HIGH: { label: "Critique", dot: "bg-rose-500" },
  MEDIUM: { label: "Important", dot: "bg-amber-500" },
  LOW: { label: "À noter", dot: "bg-blue-500" },
}

export const FRAMEWORK_LABELS: Record<RegulatoryFramework, string> = {
  RGPD: "RGPD",
  AI_ACT: "IA Act",
  ISO_42001: "ISO 42001",
  CNIL: "CNIL",
  CSE: "Droit du travail (CSE)",
  OTHER: "Autre",
}

/** Forme du champ Json `score` d'une Decision. */
export interface DecisionScore {
  axe1: number
  axe2: number
  axe3: number
  axe4: number
  axe5: number
  axe6: number
  total: number
}

export const AXIS_LABELS: Record<keyof Omit<DecisionScore, "total">, string> = {
  axe1: "Clarté du besoin",
  axe2: "Pertinence IA",
  axe3: "Maturité data",
  axe4: "Valeur métier",
  axe5: "Risques",
  axe6: "Faisabilité",
}
