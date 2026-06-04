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

/** Questions réglementaires effectivement applicables selon les réponses. */
export function getActiveRegulatoryQuestions(answers: AnswerMap): Question[] {
  return REGULATORY_QUESTIONS.filter((q) => !q.condition || q.condition(answers))
}

/** Séquence complète du parcours selon l'état des réponses. */
export function getQuestionSequence(answers: AnswerMap): Question[] {
  return [...MAIN_QUESTIONS, ...getActiveRegulatoryQuestions(answers)]
}

export const TOTAL_MAIN = MAIN_QUESTIONS.length
