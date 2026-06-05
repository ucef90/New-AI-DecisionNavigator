import { db } from "@/lib/db"
import { getLLMProvider, StubProvider } from "@/lib/llm"
import {
  buildContextPrompt,
  parseContext,
  type ContextResult,
} from "@/lib/prompts/context"

/**
 * Analyse le contexte d'un projet à partir de ses documents joints + sa
 * description, via le LLM (repli déterministe). Stocke la synthèse sur le projet.
 */
export async function analyzeProjectContext(
  projectId: string,
): Promise<ContextResult | null> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { attachments: { orderBy: { createdAt: "desc" } } },
  })
  if (!project) return null

  const documentsText = project.attachments
    .filter((a) => a.text)
    .map((a) => `[${a.name}]\n${a.text}`)
    .join("\n\n")

  const prompt = buildContextPrompt({
    projectName: project.name,
    description: project.description ?? "",
    documentsText,
  })

  let result: ContextResult | null = null
  try {
    result = parseContext(
      await getLLMProvider().complete(prompt, { json: true, timeoutMs: 15_000 }),
    )
  } catch (e) {
    console.error("[analyzeProjectContext] LLM error:", e)
  }
  if (!result) {
    try {
      result = parseContext(await new StubProvider().complete(prompt))
    } catch {
      result = null
    }
  }
  if (!result) return null

  await db.project.update({
    where: { id: projectId },
    data: { contextBrief: JSON.stringify(result) },
  })
  await db.auditLog.create({
    data: {
      projectId,
      action: "CONTEXT_ANALYZED",
      detail: { documents: project.attachments.length },
    },
  })

  return result
}
