import type { LLMOptions, LLMPrompt, LLMProvider } from "../provider"
import { timeoutSignal } from "../provider"

/**
 * Provider Ollama (déploiement on-premise / local).
 * Aucune clé API : interroge le serveur Ollama défini par OLLAMA_BASE_URL.
 */
export class OllamaProvider implements LLMProvider {
  readonly name = "ollama"

  constructor(
    private readonly baseUrl: string = process.env.OLLAMA_BASE_URL ??
      "http://127.0.0.1:11434",
    private readonly model: string = process.env.OLLAMA_MODEL ?? "mistral",
  ) {}

  async complete(
    { system, user }: LLMPrompt,
    opts: LLMOptions = {},
  ): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: timeoutSignal(opts.timeoutMs ?? 180_000),
      body: JSON.stringify({
        model: this.model,
        stream: false,
        ...(opts.json ? { format: "json" } : {}),
        options: { temperature: 0.2 },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    })

    if (!res.ok) {
      throw new Error(`Ollama API ${res.status}: ${await res.text()}`)
    }

    const data = (await res.json()) as { message?: { content?: string } }
    return data.message?.content?.trim() ?? ""
  }
}
