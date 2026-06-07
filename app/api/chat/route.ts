import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { getAppSettings } from "@/lib/settings"
import { complete, StubProvider, type LLMPrompt } from "@/lib/llm"
import { OllamaProvider } from "@/lib/llm/providers/ollama"
import { retrieve, buildKnowledgeBlock } from "@/lib/rag"
import { buildChatPrompt, type ChatMessage } from "@/lib/prompts/chat"

export const dynamic = "force-dynamic"

const TIMEOUT_MS = 60_000

/**
 * Stratégie de réponse : le provider configuré (Claude si clé renseignée) en
 * priorité ; à défaut (pas de clé / erreur), repli sur Ollama local ; en
 * dernier recours, repli déterministe (stub) — jamais d'erreur côté utilisateur.
 */
async function answer(prompt: LLMPrompt): Promise<string> {
  try {
    const out = await complete(prompt, { timeoutMs: TIMEOUT_MS })
    if (out.trim()) return out
  } catch (e) {
    console.error("[chat] provider principal échoué:", e)
  }
  try {
    const s = await getAppSettings()
    const out = await new OllamaProvider(s.ollamaBaseUrl, s.ollamaModel).complete(
      prompt,
      { timeoutMs: TIMEOUT_MS },
    )
    if (out.trim()) return out
  } catch (e) {
    console.error("[chat] repli Ollama échoué:", e)
  }
  return new StubProvider().complete(prompt)
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
