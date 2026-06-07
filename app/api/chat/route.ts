import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { getAppSettings } from "@/lib/settings"
import { type LLMPrompt } from "@/lib/llm"
import { AnthropicProvider } from "@/lib/llm/providers/anthropic"
import { OllamaProvider } from "@/lib/llm/providers/ollama"
import { retrieve, buildKnowledgeBlock } from "@/lib/rag"
import { buildChatPrompt, type ChatMessage } from "@/lib/prompts/chat"

export const dynamic = "force-dynamic"

const TIMEOUT_MS = 60_000

const UNAVAILABLE =
  "⚠️ L'assistant n'est pas disponible pour le moment : aucun moteur d'IA n'a répondu.\n\n" +
  "Vérifiez dans **Paramètres** que la clé Anthropic est enregistrée et dispose de crédits, " +
  "ou qu'un modèle de chat Ollama (ex. qwen2.5:3b) est installé sur le serveur."

/**
 * Stratégie de réponse, explicite (indépendante du mode global) :
 *  1) Claude (Anthropic) si une clé est renseignée — prioritaire ;
 *  2) repli sur Ollama local ;
 *  3) sinon, message clair — JAMAIS le repli "stub" (qui renverrait un faux
 *     rapport au lieu d'une réponse de chat).
 */
async function answer(prompt: LLMPrompt): Promise<string> {
  const s = await getAppSettings()

  if (s.anthropicApiKey) {
    try {
      const out = await new AnthropicProvider(
        s.anthropicApiKey,
        s.anthropicModel,
      ).complete(prompt, { timeoutMs: TIMEOUT_MS })
      if (out.trim()) return out
    } catch (e) {
      console.error("[chat] Anthropic échoué, repli Ollama :", e)
    }
  }

  try {
    const out = await new OllamaProvider(
      s.ollamaBaseUrl,
      s.ollamaModel,
    ).complete(prompt, { timeoutMs: TIMEOUT_MS })
    if (out.trim()) return out
  } catch (e) {
    console.error("[chat] Ollama échoué :", e)
  }

  return UNAVAILABLE
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  }

  let body: { messages?: ChatMessage[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 })
  }

  const messages = Array.isArray(body.messages) ? body.messages : []
  const lastUser = [...messages].reverse().find((m) => m.role === "user")
  const question = (lastUser?.content ?? "").trim()
  if (!question) {
    return NextResponse.json({ error: "Question vide." }, { status: 400 })
  }
  if (question.length > 2000) {
    return NextResponse.json(
      { error: "Question trop longue (2000 caractères max)." },
      { status: 400 },
    )
  }

  // RAG : connaissances internes pertinentes (référentiel, décisions, rapports…).
  const knowledge = buildKnowledgeBlock(
    await retrieve(question, {
      k: 6,
      sources: ["REFERENCE", "DECISION", "REPORT", "VENDOR", "ATTACHMENT"],
    }),
  )

  // Contexte : les projets enregistrés (pour répondre « combien / lesquels… »).
  const projectsRaw = await db.project.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { decision: true },
  })
  const projects = projectsRaw.map((p) => ({
    name: p.name,
    direction: p.direction,
    verdict: p.decision?.verdict ?? null,
    tech: p.decision?.techRecommendation ?? null,
    level: p.decision?.regulatoryLevel ?? null,
  }))

  // Derniers échanges (hors question courante) pour garder le fil.
  const history = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-9, -1)

  const prompt = buildChatPrompt({ question, history, knowledge, projects })
  const reply = await answer(prompt)

  return NextResponse.json({ reply })
}
