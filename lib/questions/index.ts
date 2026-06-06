// Définition du parcours de cadrage. Source unique pour le wizard.
// 10 questions principales (Q1-Q10) + 3 questions réglementaires contextuelles.

export type QuestionType = "text" | "single" | "multi"

export interface QuestionOption {
  value: string
  label: string
}

export interface Question {
  key: string
  block: string
  type: QuestionType
  label: string
  help?: string
  placeholder?: string
  options?: QuestionOption[]
  /** Pour les questions réglementaires : condition d'affichage selon les réponses. */
  condition?: (answers: AnswerMap) => boolean
}

/** Réponses indexées par clé de question (string ou string[] pour multi). */
export type AnswerMap = Record<string, string | string[] | undefined>

export const MAIN_QUESTIONS: Question[] = [
  {
    key: "Q1",
    block: "Comprendre le problème réel",
    type: "text",
    label:
      "Décrivez ce qui ne fonctionne pas bien aujourd'hui, sans mentionner de solution technologique.",
    help: "Concentrez-vous sur le problème métier, pas sur l'outil imaginé.",
    placeholder:
      "Ex. : nos agents passent un temps important à trier manuellement les demandes entrantes…",
  },
  {
    key: "Q2",
    block: "Comprendre le problème réel",
    type: "single",
    label: "À quelle fréquence ce problème se produit-il ?",
    options: [
      { value: "daily_multiple", label: "Plusieurs fois par jour" },
      { value: "daily", label: "Tous les jours" },
      { value: "weekly", label: "Plusieurs fois par semaine" },
      { value: "occasional", label: "Occasionnellement" },
    ],
  },
  {
    key: "Q3",
    block: "Comprendre le problème réel",
    type: "multi",
    label: "Qui est le plus impacté par ce problème ?",
    help: "Plusieurs réponses possibles.",
    options: [
      { value: "agents", label: "Les agents / collaborateurs" },
      { value: "users", label: "Les usagers / citoyens" },
      { value: "partners", label: "Les partenaires externes" },
      { value: "direction", label: "La direction" },
    ],
  },
  {
    key: "Q4",
    block: "Nature du traitement",
    type: "single",
    label: "Comment qualifieriez-vous le traitement de ce problème aujourd'hui ?",
    options: [
      { value: "stable", label: "Toujours identique, règles claires" },
      { value: "mostly_stable", label: "Souvent similaire, quelques exceptions" },
      { value: "variable", label: "Variable selon les cas" },
      { value: "complex", label: "Très complexe, jugement humain requis" },
    ],
  },
  {
    key: "Q5",
    block: "Nature du traitement",
    type: "single",
    label: "Quel est le volume et la complexité des cas à traiter ?",
    options: [
      { value: "low_simple", label: "Peu de cas, simples" },
      { value: "high_simple", label: "Beaucoup de cas, simples et répétitifs" },
      { value: "high_complex", label: "Beaucoup de cas, variés et complexes" },
      { value: "low_complex", label: "Peu de cas mais très complexes" },
    ],
  },
  {
    key: "Q6",
    block: "Nature du traitement",
    type: "single",
    label: "Disposez-vous de données existantes sur ce problème ?",
    options: [
      { value: "yes_structured", label: "Oui, accessibles et structurées" },
      { value: "yes_scattered", label: "Oui, mais dispersées ou non structurées" },
      { value: "no", label: "Non, pas de données disponibles" },
      { value: "unknown", label: "Je ne sais pas" },
    ],
  },
  {
    key: "Q7",
    block: "Données personnelles et risques",
    type: "multi",
    label: "Ce projet implique-t-il des données personnelles ?",
    help: "Plusieurs réponses possibles.",
    options: [
      { value: "none", label: "Non" },
      { value: "identity", label: "Oui – identité (nom, adresse, email)" },
      { value: "health", label: "Oui – santé ou situation médicale" },
      { value: "social", label: "Oui – situation sociale, handicap, famille" },
      { value: "hr", label: "Oui – données professionnelles (RH, paie)" },
      { value: "legal", label: "Oui – données judiciaires" },
      { value: "unknown", label: "Je ne sais pas" },
    ],
  },
  {
    key: "Q8",
    block: "Données personnelles et risques",
    type: "single",
    label:
      "L'IA devra-t-elle prendre des décisions qui impactent directement des personnes ?",
    options: [
      { value: "auto_no_human", label: "Oui, sans validation humaine" },
      { value: "auto_with_human", label: "Oui, mais un agent valide toujours" },
      { value: "assist_only", label: "Non, c'est une aide à la décision uniquement" },
      { value: "unknown", label: "Je ne sais pas encore" },
    ],
  },
  {
    key: "Q9",
    block: "Faisabilité et organisation",
    type: "single",
    label:
      "Les outils informatiques actuels peuvent-ils se connecter à une nouvelle solution ?",
    options: [
      { value: "yes_api", label: "Oui, avec des APIs disponibles" },
      { value: "to_check", label: "À vérifier avec la DSI" },
      { value: "no", label: "Non, systèmes fermés" },
      { value: "unknown", label: "Je ne sais pas" },
    ],
  },
  {
    key: "Q10",
    block: "Faisabilité et organisation",
    type: "single",
    label:
      "Les équipes concernées sont-elles prêtes à changer leurs habitudes de travail ?",
    options: [
      { value: "ready", label: "Oui, forte demande du terrain" },
      { value: "partial", label: "Partiellement, quelques réticences" },
      { value: "resistant", label: "Non, résistance au changement forte" },
      { value: "not_asked", label: "La question n'a pas encore été posée" },
    ],
  },
  {
    key: "Q11",
    block: "Cadrage et faisabilité",
    type: "single",
    label: "Le besoin s'appuie-t-il sur un outil ou un système déjà en place ?",
    help: "Ex. : Iodas, Multigest, Outlook, Power Automate…",
    options: [
      { value: "extend", label: "Oui — on enrichit un outil existant" },
      { value: "partial", label: "En partie — interconnexion avec l'existant" },
      { value: "new", label: "Non — c'est une nouvelle solution" },
      { value: "unknown", label: "Je ne sais pas" },
    ],
  },
  {
    key: "Q12",
    block: "Cadrage et faisabilité",
    type: "single",
    label:
      "Les processus métier concernés sont-ils formalisés (documentés, stabilisés) ?",
    options: [
      { value: "formalized", label: "Oui, bien formalisés" },
      { value: "partial", label: "Partiellement formalisés" },
      { value: "not", label: "Non, peu ou pas formalisés" },
    ],
  },
  {
    key: "Q13",
    block: "Cadrage et faisabilité",
    type: "single",
    label: "Quel est le périmètre organisationnel du projet ?",
    options: [
      { value: "single", label: "Un seul service" },
      { value: "multi_service", label: "Plusieurs services d'une même direction" },
      { value: "multi_direction", label: "Plusieurs directions" },
    ],
  },
  {
    key: "Q14",
    block: "Valeur attendue",
    type: "multi",
    label: "Quels gains recherchez-vous principalement ?",
    help: "Plusieurs réponses possibles.",
    options: [
      { value: "temps", label: "Gain de temps" },
      { value: "couts", label: "Réduction des coûts" },
      { value: "erreurs", label: "Réduction des erreurs" },
      { value: "qualite", label: "Amélioration de la qualité" },
      { value: "experience", label: "Meilleure expérience usager" },
      { value: "conformite", label: "Amélioration de la conformité" },
    ],
  },
  {
    key: "Q15",
    block: "Processus actuel",
    type: "text",
    label: "Décrivez brièvement le processus actuel (principales étapes).",
    help: "Pré-rempli à partir des documents si une analyse de contexte a été faite.",
    placeholder: "Ex. : réception → tri → vérification → saisie → réponse…",
  },
  {
    key: "Q16",
    block: "Acteurs & parties prenantes",
    type: "multi",
    label: "Quelles parties prenantes sont concernées ?",
    help: "Plusieurs réponses possibles.",
    options: [
      { value: "direction_metier", label: "Direction métier" },
      { value: "dsi", label: "DSI" },
      { value: "rssi", label: "RSSI (sécurité)" },
      { value: "dpo", label: "DPO (données personnelles)" },
      { value: "cse", label: "CSE / représentants du personnel" },
      { value: "gouvernance", label: "Gouvernance / direction générale" },
    ],
  },
  {
    key: "Q17",
    block: "Qualité des données",
    type: "single",
    label: "Quelle est la qualité de vos données (fiabilité, complétude) ?",
    // Sans données disponibles (Q6), la question de leur qualité est sans objet.
    condition: (a) => pick(a, "Q6") !== "no",
    options: [
      { value: "bonne", label: "Bonne : fiables, complètes, accessibles" },
      { value: "moyenne", label: "Moyenne : quelques lacunes" },
      { value: "faible", label: "Faible : peu fiables ou dispersées" },
      { value: "unknown", label: "Je ne sais pas" },
    ],
  },
  {
    key: "Q18",
    block: "Documents exploités",
    type: "multi",
    label: "Quels formats de documents sont exploités ?",
    help: "Plusieurs réponses possibles.",
    options: [
      { value: "pdf", label: "PDF" },
      { value: "word", label: "Word" },
      { value: "excel", label: "Excel" },
      { value: "emails", label: "Emails" },
      { value: "images", label: "Images" },
      { value: "scans", label: "Scans / papier numérisé" },
      { value: "aucun", label: "Pas de documents" },
    ],
  },
  {
    key: "Q19",
    block: "Documents exploités",
    type: "single",
    label: "Ces documents sont-ils structurés ou nécessitent-ils une interprétation ?",
    // Aucun document exploité (Q18 = « Pas de documents ») → on saute la question.
    condition: (a) => {
      const fmts = toArray(a.Q18).filter((v) => v !== "aucun")
      return fmts.length > 0
    },
    options: [
      { value: "structures", label: "Structurés (formulaires, modèles fixes)" },
      { value: "semi", label: "Semi-structurés (modèles variés)" },
      { value: "interpretation", label: "Non structurés (interprétation nécessaire)" },
      { value: "na", label: "Sans objet" },
    ],
  },
  {
    key: "Q20",
    block: "Nature des traitements",
    type: "multi",
    label: "Quelles capacités le besoin requiert-il réellement ?",
    help: "Cœur de la qualification IA vs automatisation. Plusieurs réponses possibles.",
    options: [
      { value: "regles", label: "Appliquer des règles fixes" },
      { value: "langage", label: "Comprendre du texte / langage naturel" },
      { value: "classification", label: "Classer / trier" },
      { value: "generation", label: "Générer du contenu" },
      { value: "recherche", label: "Rechercher dans une base documentaire" },
      { value: "raisonnement", label: "Raisonnement métier complexe" },
    ],
  },
  {
    key: "Q21",
    block: "Exceptions",
    type: "single",
    label: "À quelle fréquence rencontrez-vous des cas particuliers ou ambigus ?",
    // Processus parfaitement homogène et répétitif (Q4 stable + Q5 cas simples) :
    // la question des exceptions n'a pas de sens.
    condition: (a) =>
      !(pick(a, "Q4") === "stable" && pick(a, "Q5") === "high_simple"),
    options: [
      { value: "rarement", label: "Rarement : cas très homogènes" },
      { value: "parfois", label: "Parfois" },
      { value: "souvent", label: "Souvent : beaucoup d'exceptions" },
      { value: "tres_souvent", label: "Très souvent : règles changeantes" },
    ],
  },
  {
    key: "Q22",
    block: "Dépendances SI",
    type: "multi",
    label: "Quelles applications du SI sont concernées ?",
    help: "Plusieurs réponses possibles.",
    options: [
      { value: "erp", label: "ERP" },
      { value: "crm", label: "CRM" },
      { value: "ged", label: "GED" },
      { value: "portail", label: "Portail" },
      { value: "base_doc", label: "Base documentaire" },
      { value: "datawarehouse", label: "Datawarehouse / décisionnel" },
      { value: "messagerie", label: "Messagerie" },
      { value: "aucune", label: "Aucune" },
    ],
  },
  {
    key: "Q23",
    block: "Gouvernance",
    type: "single",
    label: "Une traçabilité / journalisation des traitements est-elle requise ?",
    options: [
      { value: "obligatoire", label: "Oui, obligatoire (audit, preuve)" },
      { value: "souhaitable", label: "Souhaitable" },
      { value: "non", label: "Non nécessaire" },
      { value: "unknown", label: "Je ne sais pas" },
    ],
  },
  {
    key: "Q24",
    block: "Risques",
    type: "single",
    label: "Quel est l'impact en cas d'erreur de traitement ?",
    options: [
      { value: "faible", label: "Faible" },
      { value: "modere", label: "Modéré" },
      { value: "important", label: "Important" },
      { value: "critique", label: "Critique (droits usagers, juridique)" },
    ],
  },
  {
    key: "Q25",
    block: "Maturité",
    type: "single",
    label: "Maturité — le besoin et les objectifs sont-ils clairs et partagés ?",
    options: [
      { value: "1", label: "1 — Très faible" },
      { value: "2", label: "2 — Faible" },
      { value: "3", label: "3 — Moyenne" },
      { value: "4", label: "4 — Bonne" },
      { value: "5", label: "5 — Très élevée" },
    ],
  },
  {
    key: "Q26",
    block: "Maturité",
    type: "single",
    label: "Maturité — adhésion des utilisateurs et sponsoring ?",
    options: [
      { value: "1", label: "1 — Très faible" },
      { value: "2", label: "2 — Faible" },
      { value: "3", label: "3 — Moyenne" },
      { value: "4", label: "4 — Bonne" },
      { value: "5", label: "5 — Très élevée" },
    ],
  },
]

const REG_HIGH_DATA = ["health", "social", "legal", "hr"]

export const REGULATORY_QUESTIONS: Question[] = [
  {
    key: "QR1",
    block: "Réglementation",
    type: "single",
    label:
      "Les données traitées par ce projet resteront-elles hébergées en France ou en Europe ?",
    options: [
      { value: "yes_france", label: "Oui, en France" },
      { value: "yes_europe", label: "Oui, en Europe (UE)" },
      { value: "no", label: "Non, hors UE" },
      { value: "unknown", label: "Je ne sais pas" },
    ],
  },
  {
    key: "QR2",
    block: "Réglementation",
    type: "single",
    label:
      "Une analyse d'impact sur la protection des données (AIPD) a-t-elle déjà été réalisée ou planifiée ?",
    condition: (a) => {
      const q7 = toArray(a.Q7)
      const q8 = a.Q8
      return q7.some((v) => REG_HIGH_DATA.includes(v)) || q8 === "auto_no_human"
    },
    options: [
      { value: "yes_done", label: "Oui, déjà réalisée" },
      { value: "yes_planned", label: "Oui, planifiée" },
      { value: "no", label: "Non" },
      { value: "unknown", label: "Je ne sais pas" },
    ],
  },
  {
    key: "QR3",
    block: "Réglementation",
    type: "single",
    label:
      "Un agent humain pourra-t-il contester ou corriger une décision prise par l'IA ?",
    condition: (a) => a.Q8 === "auto_no_human" || a.Q8 === "auto_with_human",
    options: [
      { value: "yes_always", label: "Oui, systématiquement" },
      { value: "yes_sometimes", label: "Oui, dans certains cas" },
      { value: "no", label: "Non" },
      { value: "not_planned", label: "Ce n'est pas prévu" },
    ],
  },
]

function toArray(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v
  if (typeof v === "string") return [v]
  return []
}

/** Valeur d'une question à choix unique (premier élément si tableau). */
function pick(a: AnswerMap, key: string): string | undefined {
  const v = a[key]
  return Array.isArray(v) ? v[0] : v
}

/** Questions principales effectivement applicables selon les réponses. */
export function getActiveMainQuestions(answers: AnswerMap): Question[] {
  return MAIN_QUESTIONS.filter((q) => !q.condition || q.condition(answers))
}

/** Questions réglementaires effectivement applicables selon les réponses. */
export function getActiveRegulatoryQuestions(answers: AnswerMap): Question[] {
  return REGULATORY_QUESTIONS.filter((q) => !q.condition || q.condition(answers))
}

/** Séquence complète du parcours selon l'état des réponses. */
export function getQuestionSequence(answers: AnswerMap): Question[] {
  return [
    ...getActiveMainQuestions(answers),
    ...getActiveRegulatoryQuestions(answers),
  ]
}

export const TOTAL_MAIN = MAIN_QUESTIONS.length
