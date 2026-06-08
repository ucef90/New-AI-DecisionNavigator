// Génère le PDF "Socle Technique V2" (documentation de l'architecture V2)
// dans docs/v2/. Usage : node --import tsx scripts/gen-v2-socle.tsx
import { mkdirSync } from "node:fs"
import { join } from "node:path"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToFile,
} from "@react-pdf/renderer"
import React from "react"

const C = {
  navy: "#1e3a5f",
  blue: "#2563eb",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  bg: "#f8f9fc",
  green: "#16a34a",
  amber: "#d97706",
  red: "#dc2626",
}

const s = StyleSheet.create({
  page: { paddingTop: 54, paddingBottom: 54, paddingHorizontal: 48, fontSize: 10, color: C.text, lineHeight: 1.5 },
  header: { position: "absolute", top: 22, left: 48, right: 48, fontSize: 8, color: C.muted, borderBottom: `1 solid ${C.border}`, paddingBottom: 6 },
  footer: { position: "absolute", bottom: 24, left: 48, right: 48, fontSize: 8, color: C.muted, borderTop: `1 solid ${C.border}`, paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
  h1: { fontSize: 20, color: C.navy, fontWeight: 700, marginBottom: 4 },
  h2: { fontSize: 13, color: C.navy, fontWeight: 700, marginTop: 16, marginBottom: 6, borderBottom: `2 solid ${C.blue}`, paddingBottom: 3 },
  h3: { fontSize: 11, color: C.navy, fontWeight: 700, marginTop: 10, marginBottom: 3 },
  p: { marginBottom: 6, textAlign: "justify" },
  muted: { color: C.muted },
  bullet: { flexDirection: "row", marginBottom: 2.5 },
  dot: { width: 10, color: C.blue },
  badge: { fontSize: 9, color: "#fff", backgroundColor: C.blue, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3 },
  card: { backgroundColor: C.bg, border: `1 solid ${C.border}`, borderRadius: 5, padding: 10, marginBottom: 8 },
  row: { flexDirection: "row", borderBottom: `1 solid ${C.border}` },
  cellH: { backgroundColor: C.navy, color: "#fff", fontSize: 8.5, fontWeight: 700, padding: 5 },
  cell: { fontSize: 9, padding: 5, color: C.text },
  code: { fontFamily: "Courier", fontSize: 8.5, backgroundColor: C.bg, padding: 8, borderRadius: 4, border: `1 solid ${C.border}`, marginBottom: 8, color: C.text },
})

const H = React.createElement

function Bullet({ children }: { children: React.ReactNode }) {
  return H(View, { style: s.bullet }, H(Text, { style: s.dot }, "•"), H(Text, { style: { flex: 1 } }, children))
}

function Frame({ title }: { title: string }) {
  return H(
    View,
    { style: s.header, fixed: true },
    H(Text, null, `SOCLE TECHNIQUE — ${title}`),
  )
}
function Foot() {
  return H(
    View,
    { style: s.footer, fixed: true },
    H(Text, null, "AI Decision Navigator — Cadrage V2 · Framework 6 socles"),
    H(Text, { render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber} / ${totalPages}` }),
  )
}

// Lignes de tableau générique
function Table({ head, rows, widths }: { head: string[]; rows: string[][]; widths: number[] }) {
  return H(
    View,
    { style: { marginBottom: 8 } },
    H(
      View,
      { style: s.row },
      head.map((h, i) => H(Text, { key: i, style: [s.cellH, { width: `${widths[i]}%` }] }, h)),
    ),
    rows.map((r, ri) =>
      H(
        View,
        { key: ri, style: [s.row, { backgroundColor: ri % 2 ? C.bg : "#fff" }] },
        r.map((c, ci) => H(Text, { key: ci, style: [s.cell, { width: `${widths[ci]}%` }] }, c)),
      ),
    ),
  )
}

const SOCLES: [string, string][] = [
  ["Socle 1 — Analyse métier", "Reformuler la demande en besoin métier pur (sans techno) ; impact quantifié, baseline, acteurs, définition du succès."],
  ["Socle 2 — IA ou automatisation", "Qualifier chaque tâche : règle fixe → automatisation ; compréhension/raisonnement → IA ; décision légale → humain."],
  ["Socle 3 — Questionnaire de cadrage", "Viabilité sur 21 dimensions : données, SI, RGPD, EU AI Act, CSE, risques P×I, gouvernance, budget, scalabilité…"],
  ["Socle 4 — Scoring & maturité", "11 axes notés 1 à 5 (score /55, %). Décision objectivée GO/NO GO."],
  ["Socle 5 — Cartographie IA", "Workflows AS-IS/cible, architecture en couches, flux de données, composants IA, gouvernance."],
  ["Socle 6 — Gouvernance & conformité", "Charte IA, comité, AIPD/DPO, CSE, plan de continuité, mesures RGPD (chiffrement, IAM, logs)."],
]

const PIPELINE: string[][] = [
  ["1", "analyzeDocuments()", "Lit les pièces jointes (texte extrait PDF/Word/OCR) + description → extrait problème, tâches, métriques, contraintes, zones floues (JSON)."],
  ["2", "generateQuestions()", "Génère 20 questions personnalisées mappées aux 6 socles (avec « pourquoi » + impact décision)."],
  ["3", "scoreProject()", "Analyse les réponses → 11 axes /55, risques P×I, points critiques, décision + garde-fou NO-GO immédiat."],
  ["4", "generateV2Report()", "Rédige le rapport de cadrage (markdown) présentable en comité de pilotage."],
]

const AXES = [
  "1. Maturité métier", "2. Qualité des données", "3. Maturité des workflows",
  "4. Gouvernance IA", "5. Niveau de risque", "6. Complexité projet",
  "7. Faisabilité technique", "8. Faisabilité organisationnelle",
  "9. Conformité réglementaire", "10. Dépendances SI", "11. Préparation IA",
]

const FILES: string[][] = [
  ["FRAMEWORK.md", "Source de vérité — les 6 socles + logique de décision"],
  ["lib/framework.ts", "Chargeur du framework (cache), injecté dans tous les prompts"],
  ["lib/prompts/framework.ts", "4 prompts + types + parsers tolérants"],
  ["lib/v2/pipeline.ts", "Orchestration des 4 étapes + persistance + garde-fous"],
  ["prisma — FrameworkAssessment", "1 évaluation par projet (analyse, questions, réponses, scoring, rapport)"],
  ["app/projects/[id]/cadrage-v2/*", "Parcours UI + server actions"],
  ["components/v2/*", "Formulaire questions, résultats, graphes (jauge/radar/risques), markdown"],
]

const Doc = H(
  Document,
  null,
  // Page 1 — couverture + vue d'ensemble
  H(
    Page,
    { size: "A4", style: s.page },
    H(Frame, { title: "Cadrage V2" }),
    H(Foot, null),
    H(Text, { style: { ...s.muted, fontSize: 9, marginBottom: 8 } }, "DOCUMENTATION D'ARCHITECTURE · AI DECISION NAVIGATOR"),
    H(Text, { style: s.h1 }, "Socle Technique — V2"),
    H(Text, { style: { fontSize: 12, color: C.blue, marginBottom: 14 } }, "Refonte de la logique IA autour du Framework Méthodologique en 6 Socles"),
    H(View, { style: s.card },
      H(Text, { style: s.h3 }, "Philosophie fondamentale"),
      H(Text, { style: s.p }, "Un mauvais cadrage métier produit presque toujours un mauvais projet IA. La technologie ne corrige pas le flou — elle l'amplifie. Le framework force à raisonner avant d'agir."),
      H(Text, { style: { ...s.muted, fontSize: 9 } }, "Le framework (FRAMEWORK.md) est le « cerveau » de l'application : il est injecté dans chaque prompt et pilote l'ensemble du raisonnement, pas seulement un prompt de surface."),
    ),
    H(Text, { style: s.h2 }, "1. Principe de la V2"),
    H(Text, { style: s.p }, "La V2 cohabite avec la V1 (un bouton de bascule sur la page projet). Elle remplace la logique de cadrage par un pipeline en 4 étapes entièrement basé sur le framework : à partir des documents importés, l'IA génère des questions personnalisées, score le projet sur 11 axes, et produit une décision GO / NO GO argumentée, présentable en comité de pilotage."),
    H(Text, { style: s.h2 }, "2. Les 6 socles méthodologiques"),
    ...SOCLES.map(([t, d]) =>
      H(View, { key: t, style: { marginBottom: 6 } },
        H(Text, { style: s.h3 }, t),
        H(Text, { style: s.muted }, d),
      ),
    ),
  ),
  // Page 2 — pipeline + scoring
  H(
    Page,
    { size: "A4", style: s.page },
    H(Frame, { title: "Cadrage V2" }),
    H(Foot, null),
    H(Text, { style: s.h2 }, "3. Pipeline technique — 4 étapes séquentielles"),
    H(Text, { style: s.p }, "Chaque étape appelle le LLM configuré (Anthropic en production) et persiste son artefact dans FrameworkAssessment. Aucun repli « stub » silencieux : en l'absence de LLM réel, le cadrage est bloqué avec un message explicite."),
    H(Table, { head: ["#", "Fonction", "Rôle"], rows: PIPELINE, widths: [6, 24, 70] }),
    H(Text, { style: s.h2 }, "4. Scoring — 11 axes (/55)"),
    H(View, { style: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 } },
      AXES.map((a) => H(Text, { key: a, style: { width: "50%", marginBottom: 3 } }, `• ${a}`)),
    ),
    H(Text, { style: s.h3 }, "Logique de décision"),
    H(Table, {
      head: ["Score", "Niveau", "Décision"],
      rows: [
        ["< 40 %", "Immature", "NO GO"],
        ["40 – 60 %", "Intermédiaire", "CONDITIONNEL (POC ciblé)"],
        ["60 – 80 %", "Mature", "GO POC"],
        ["≥ 80 %", "Très mature", "GO PRODUCTION"],
      ],
      widths: [18, 27, 55],
    }),
    H(Text, { style: { ...s.muted, fontSize: 9, marginBottom: 8 } }, "Garde-fou : un blocage RGPD rédhibitoire, des données inexistantes ou un SI incompatible déclenchent un NO GO immédiat, sans attendre le calcul du score."),
    H(Text, { style: s.h2 }, "5. Restitution" ),
    H(Bullet, null, "Jauge de score /55 + pourcentage, niveau de maturité."),
    H(Bullet, null, "Radar des 11 axes + barres détaillées par axe (avec justification)."),
    H(Bullet, null, "Matrice des risques P×I (4×4) + tableau (probabilité, impact, criticité, mitigation)."),
    H(Bullet, null, "Badge décision GO/NO GO, analyse par socle (forces/faiblesses), 5 recommandations, conditions."),
    H(Bullet, null, "Rapport de cadrage en markdown, présentable en comité de pilotage."),
  ),
  // Page 3 — données, fichiers, déploiement
  H(
    Page,
    { size: "A4", style: s.page },
    H(Frame, { title: "Cadrage V2" }),
    H(Foot, null),
    H(Text, { style: s.h2 }, "6. Modèle de données" ),
    H(Text, { style: s.p }, "Une évaluation par projet (FrameworkAssessment), reliée au projet (cascade). Les artefacts sont stockés en JSON, plus des champs dénormalisés pour l'affichage."),
    H(Text, { style: s.code }, "model FrameworkAssessment {\n  id, projectId (unique)\n  docAnalysis  Json?   // analyse documentaire\n  questions    Json?   // 20 questions générées\n  answers      Json?   // réponses\n  scoring      Json?   // 11 axes, risques, décision\n  report       String? // rapport markdown\n  decision, scoreGlobal, pourcentage, status, llmProvider\n}"),
    H(Text, { style: s.h2 }, "7. Fichiers de la V2" ),
    H(Table, { head: ["Fichier / Modèle", "Rôle"], rows: FILES, widths: [38, 62] }),
    H(Text, { style: s.h2 }, "8. Garde-fous & sécurité" ),
    H(Bullet, null, "Refus si aucun LLM réel configuré (NoRealLLMError)."),
    H(Bullet, null, "Refus si aucun document exploitable ou réponse LLM illisible."),
    H(Bullet, null, "« Ne jamais inventer » : chaque prompt impose de se fonder uniquement sur les documents et réponses fournis."),
    H(Bullet, null, "NO GO immédiat sur blocage critique (RGPD, données, SI)."),
    H(Text, { style: s.h2 }, "9. Déploiement" ),
    H(Bullet, null, "Appliquer les migrations Prisma en production : prisma migrate deploy."),
    H(Bullet, null, "FRAMEWORK.md doit être présent à la racine au runtime (à copier dans l'image Docker si output: standalone)."),
    H(Bullet, null, "Provider LLM recommandé : Anthropic (Claude) pour la fiabilité du JSON structuré ; Ollama possible avec un modèle suffisamment grand."),
    H(View, { style: { marginTop: 16, ...s.card } },
      H(Text, { style: { ...s.muted, fontSize: 9 } }, "Ce document décrit l'implémentation technique de la V2. Le contenu méthodologique de référence reste FRAMEWORK.md à la racine du projet."),
    ),
  ),
)

async function main() {
  const dir = join(process.cwd(), "docs", "v2")
  mkdirSync(dir, { recursive: true })
  const out = join(dir, "Socle_Technique_V2.pdf")
  await renderToFile(Doc, out)
  console.log("PDF généré :", out)
}

main()
