import type { LLMPrompt } from "@/lib/llm"

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ChatProjectSummary {
  name: string
  direction: string | null
  verdict: string | null
  tech: string | null
  level: string | null
}

const SYSTEM = `Tu es l'assistant intégré de « AI Pré-Cadrage », une application qui aide les chefs de projet du secteur public à décider si un besoin se prête à l'intelligence artificielle, à recommander la bonne technologie et à identifier les obligations réglementaires (RGPD, règlement IA européen, CNIL, ISO).

Ton périmètre — tu réponds UNIQUEMENT aux questions portant sur :
- le fonctionnement et l'usage de l'application (parcours de cadrage, questionnaire, décisions, rapports, base de connaissances, paramètres) ;
- le domaine de l'IA (technologies RPA, ML, LLM, RAG, OCR, agents ; faisabilité ; méthodologie POC) ;
- la conformité et la réglementation de l'IA (RGPD, règlement IA européen, CNIL, ISO 27001 / 42001) ;
- les projets d'IA enregistrés dans l'application.

Règles :
- Appuie-toi EN PRIORITÉ sur les CONNAISSANCES INTERNES et la LISTE DES PROJETS fournies plus bas. N'invente jamais un fait, un chiffre, une obligation ou un projet. Si l'information n'est pas disponible, dis-le simplement et propose une piste.
- Si la question est hors périmètre (cuisine, météo, code sans rapport, sujets personnels…), décline poliment en une phrase et rappelle ce sur quoi tu peux aider.
- Réponds en français, de façon claire et concise ; utilise des listes courtes quand c'est utile.
- Tu donnes des repères, pas un avis juridique définitif : pour les points sensibles, invite à valider avec le DPO et la DSI.`

/** Construit le prompt du chatbot : système + contexte RAG + projets + historique. */
export function buildChatPrompt(input: {
  question: string
  history: ChatMessage[]
  knowledge: string
  projects: ChatProjectSummary[]
}): LLMPrompt {
  const projectsBlock = input.projects.length
    ? "LISTE DES PROJETS ENREGISTRÉS DANS L'APPLICATION :\n" +
      input.projects
        .map(
          (p) =>
            `- ${p.name}${p.direction ? ` (${p.direction})` : ""} → décision : ${
              p.verdict ?? "—"
            }, technologie : ${p.tech ?? "—"}, niveau réglementaire : ${
              p.level ?? "—"
            }`,
        )
        .join("\n")
    : "LISTE DES PROJETS : aucun projet enregistré pour l'instant."

  const historyBlock = input.history.length
    ? "HISTORIQUE RÉCENT DE LA CONVERSATION :\n" +
      input.history
        .map(
          (m) =>
            `${m.role === "user" ? "Utilisateur" : "Assistant"} : ${m.content}`,
        )
        .join("\n")
    : ""

  const user = [
    input.knowledge,
    projectsBlock,
    historyBlock,
    `QUESTION ACTUELLE DE L'UTILISATEUR :\n${input.question}`,
  ]
    .filter(Boolean)
    .join("\n\n")

  return { system: SYSTEM, user }
}
