import type { LLMOptions, LLMPrompt, LLMProvider } from "../provider"
import { timeoutSignal } from "../provider"

/**
 * Provider OpenAI (API chat completions).
 * Compatible avec tout endpoint OpenAI-like via OPENAI_BASE_URL.
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = "openai"

  constructor(
    private readonly apiKey: string = process.env.OPENAI_API_KEY ?? "",
    private readonly model: string = process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    private readonly baseUrl: string = process.env.OPENAI_BASE_URL ??
      "https://api.openai.com/v1",
  ) {}

  async complete(
    { system, user }: LLMPrompt,
    opts: LLMOptions = {},
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        "OPENAI_API_KEY manquante. Renseignez la clé ou passez LLM_PROVIDER=stub.",
      )
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      signal: timeoutSignal(opts.timeoutMs ?? 120_000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    })

    if (!res.ok) {
      throw new Error(`OpenAI API ${res.status}: ${await res.text()}`)
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    return data.choices?.[0]?.message?.content?.trim() ?? ""
  }
}
