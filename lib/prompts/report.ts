import type { LLMPrompt } from "@/lib/llm"

// Prompt 3 — Génération du rapport final (markdown)

export interface ReportInput {
  projectName: string
  userName: string
  date: string
  answersJson: string
  decisionJson: string
  alertsJson: string
  vendorJson?: string
  knowledge?: string
}

const SYSTEM = `Tu génères un rapport de pré-cadrage IA d'une page A4 pour un chef de projet de collectivité publique.
Langage simple, professionnel, accessible. Pas de jargon technique.
Réponds en markdown structuré uniquement.`

export function buildReportPrompt(input: ReportInput): LLMPrompt {
  return {
    system: SYSTEM,
    user: `DONNÉES DU PROJET : ${input.answersJson}
DÉCISION : ${input.decisionJson}
ALERTES RÉGLEMENTAIRES : ${input.alertsJson}
ANALYSE FOURNISSEUR (si présente) : ${input.vendorJson ?? "aucune"}
${input.knowledge?.trim() ? `\n${input.knowledge.trim()}\n` : ""}
Génère un rapport markdown avec exactement ces sections :

# Rapport de pré-cadrage IA — ${input.projectName}
**Date :** ${input.date} | **Chef de projet :** ${input.userName}

## 1. Résumé du besoin
(3 lignes max)

## 2. Décision recommandée
**[BADGE : GO / POC / ÉTUDE / AUTOMATISATION / NO GO]**
(5 lignes de justification)

## 3. Technologie recommandée
(Expliquer en langage simple ce qu'est RPA / ML / LLM / RAG / OCR / AGENT)

## 4. Obligations réglementaires
(Liste des alertes avec niveau et action concrète)

## 5. Questions à poser au fournisseur
(Si analyse fournisseur présente — 5 questions)

## 6. Prochaines étapes
(3 actions concrètes avec responsable suggéré)

Règles de rédaction :
- Chaque section : 5 lignes maximum
- Pas de bullet points imbriqués sur plus de 2 niveaux
- Ton professionnel mais accessible
- Pas de jargon technique`,
  }
}
