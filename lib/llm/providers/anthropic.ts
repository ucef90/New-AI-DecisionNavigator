import type { LLMOptions, LLMPrompt, LLMProvider } from "../provider"
import { timeoutSignal } from "../provider"

/**
 * Provider Anthropic (API Messages — https://api.anthropic.com/v1/messages).
 * Authentification par clé ANTHROPIC_API_KEY (header x-api-key).
 * Modèle par défaut : claude-opus-4-8.
 *
 * NB : les modèles Opus 4.x n'acceptent plus le paramètre `temperature`
 * (erreur 400) — on ne l'envoie donc pas. Le mode "JSON" est obtenu par
 * instruction système (l'API Messages n'a pas de `response_format`).
 */
export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic"

  constructor(
    private readonly apiKey: string = process.env.ANTHROPIC_API_KEY ?? "",
    private readonly model: string = process.env.ANTHROPIC_MODEL ??
      "claude-opus-4-8",
    private readonly baseUrl: string = process.env.ANTHROPIC_BASE_URL ??
      "https://api.anthropic.com/v1",
    private readonly maxTokens: number = Number(
      process.env.ANTHROPIC_MAX_TOKENS ?? 8000,
    ),
  ) {}

  async complete(
    { system, user }: LLMPrompt,
    opts: LLMOptions = {},
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY manquante. Renseignez la clé dans Paramètres, ou choisissez Ollama / stub.",
      )
    }

    const sys = opts.json
      ? `${system}\n\nRéponds UNIQUEMENT avec un objet JSON valide, sans aucun texte ni balise Markdown autour.`
      : system

    const res = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      signal: timeoutSignal(opts.timeoutMs ?? 120_000),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        system: sys,
        messages: [{ role: "user", content: user }],
      }),
    })

    if (!res.ok) {
      throw new Error(`Anthropic API ${res.status}: ${await res.text()}`)
    }

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[]
    }
    const text = (data.content ?? [])
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("")
      .trim()

    return opts.json ? stripJsonFences(text) : text
  }
}

/** Retire d'éventuelles balises ```json ... ``` autour de la réponse. */
function stripJsonFences(s: string): string {
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  return (fence ? fence[1] : s).trim()
}
