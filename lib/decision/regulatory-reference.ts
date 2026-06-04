import type { RegulatoryFramework } from "@prisma/client"

// Référentiel d'explications détaillées par texte réglementaire.
// Sert à enrichir chaque obligation affichée (panneau « En savoir plus »).

export interface RegulatoryDetail {
  what: string // ce que dit / exige le texte
  why: string // pourquoi il s'applique à ce projet
  source: string // référence officielle
  url?: string // lien vers le texte
}

interface Rule {
  match: (framework: RegulatoryFramework, article: string) => boolean
  detail: RegulatoryDetail
}

const has = (article: string, ...needles: string[]) =>
  needles.some((n) => article.toLowerCase().includes(n.toLowerCase()))

const RULES: Rule[] = [
  {
    match: (f, a) => f === "RGPD" && has(a, "9"),
    detail: {
      what: "Le traitement des données dites « sensibles » (santé, situation sociale, données judiciaires) est interdit par principe, sauf exception encadrée (consentement explicite, mission d'intérêt public, etc.).",
      why: "Le projet manipule des données sensibles : il faut une base légale renforcée et des garanties spécifiques.",
      source: "RGPD (UE 2016/679), Article 9",
      url: "https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2#Article9",
    },
  },
  {
    match: (f, a) => f === "RGPD" && has(a, "22"),
    detail: {
      what: "Une personne a le droit de ne pas faire l'objet d'une décision fondée exclusivement sur un traitement automatisé produisant des effets juridiques ou l'affectant de manière significative.",
      why: "Le projet prévoit une décision automatisée sans validation humaine : intervention humaine et droit de contestation obligatoires.",
      source: "RGPD (UE 2016/679), Article 22",
      url: "https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre3#Article22",
    },
  },
  {
    match: (f, a) => f === "RGPD" && has(a, "35"),
    detail: {
      what: "Une analyse d'impact relative à la protection des données (AIPD) doit être menée AVANT le traitement lorsqu'il est susceptible d'engendrer un risque élevé pour les droits et libertés des personnes.",
      why: "Le profil de risque du projet déclenche cette obligation : l'AIPD doit précéder tout lancement.",
      source: "RGPD (UE 2016/679), Article 35 — outil PIA de la CNIL",
      url: "https://www.cnil.fr/fr/RGPD-analyse-impact-protection-des-donnees-aipd",
    },
  },
  {
    match: (f, a) => f === "RGPD" && has(a, "44", "49"),
    detail: {
      what: "Tout transfert de données hors de l'Union européenne doit être encadré (décision d'adéquation, clauses contractuelles types, garanties appropriées).",
      why: "L'hébergement pourrait se situer hors UE : la conformité du transfert doit être vérifiée avant le lancement.",
      source: "RGPD (UE 2016/679), Articles 44 à 49",
      url: "https://www.cnil.fr/fr/transferer-des-donnees-hors-de-lue",
    },
  },
  {
    match: (f, a) => f === "RGPD" && has(a, "5", "13"),
    detail: {
      what: "Principes fondamentaux : licéité, finalité déterminée, minimisation des données, exactitude, limitation de conservation. Les personnes doivent être informées (finalité, base légale, durée, droits).",
      why: "Tout traitement de données personnelles, même non sensibles, est soumis à ces principes et à l'obligation d'information.",
      source: "RGPD (UE 2016/679), Articles 5 et 13",
      url: "https://www.cnil.fr/fr/les-bases-legales/quelles-formalites",
    },
  },
  {
    match: (f, a) => f === "AI_ACT" && has(a, "14"),
    detail: {
      what: "Les systèmes d'IA à haut risque doivent être conçus pour permettre une supervision humaine effective : possibilité de comprendre, de surveiller et d'interrompre le système.",
      why: "Le projet implique une décision assistée ou automatisée : un dispositif de supervision humaine doit être documenté.",
      source: "Règlement IA (UE 2024/1689), Article 14",
      url: "https://artificialintelligenceact.eu/fr/article/14/",
    },
  },
  {
    match: (f) => f === "AI_ACT",
    detail: {
      what: "Les systèmes utilisés dans des domaines sensibles (accès aux services essentiels, services sociaux, emploi) sont classés « à haut risque » et soumis à des exigences renforcées (documentation, qualité des données, traçabilité).",
      why: "Le domaine du projet relève potentiellement de l'Annexe III : qualification haut risque à évaluer.",
      source: "Règlement IA (UE 2024/1689), Article 6 + Annexe III",
      url: "https://artificialintelligenceact.eu/fr/annex/3/",
    },
  },
  {
    match: (f) => f === "CSE",
    detail: {
      what: "Le comité social et économique (CSE) doit être informé et consulté avant la mise en place de moyens ou techniques affectant les conditions de travail ou l'évaluation des agents.",
      why: "L'IA peut impacter le travail des agents : la consultation du CSE est requise avant déploiement.",
      source: "Code du travail, Article L. 2312-38",
      url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000035651019",
    },
  },
  {
    match: (f) => f === "ISO_42001",
    detail: {
      what: "Norme internationale définissant un système de management de l'IA (SMIA) : gouvernance, gestion des risques, amélioration continue. Couvre une large part des exigences du règlement IA.",
      why: "Pour un système à haut risque, structurer la gouvernance via un SMIA facilite la conformité et la certification.",
      source: "ISO/IEC 42001:2023",
      url: "https://www.iso.org/fr/standard/81230.html",
    },
  },
  {
    match: (f) => f === "CNIL",
    detail: {
      what: "La CNIL a publié des fiches pratiques sur l'IA : périmètre RGPD, base légale d'entraînement, minimisation, information des personnes, traçabilité des modèles.",
      why: "Des données personnelles sont en jeu mais leur nature doit être clarifiée avec le DPO.",
      source: "CNIL — fiches pratiques IA",
      url: "https://www.cnil.fr/fr/intelligence-artificielle",
    },
  },
]

export function getRegulatoryDetail(
  framework: RegulatoryFramework,
  article: string | null,
): RegulatoryDetail | null {
  const a = article ?? ""
  return RULES.find((r) => r.match(framework, a))?.detail ?? null
}
