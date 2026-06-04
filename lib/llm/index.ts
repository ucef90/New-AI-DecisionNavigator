import type { LLMProvider, LLMProviderName } from "./provider"
import { StubProvider } from "./providers/stub"
import { OpenAIProvider } from "./providers/openai"
import { MistralProvider } from "./providers/mistral"
import { OllamaProvider } from "./providers/ollama"

export type {
  LLMProvider,
  LLMPrompt,
  LLMProviderName,
  LLMOptions,
} from "./provider"

/**
 * Fabrique le provider LLM selon LLM_PROVIDER (stub par défaut).
 * StubProvider garantit que l'app fonctionne sans aucune clé API.
 */
export function getLLMProvider(
  name: string | undefined = process.env.LLM_PROVIDER,
): LLMProvider {
  const provider = (name ?? "stub").toLowerCase() as LLMProviderName

  switch (provider) {
    case "openai":
      return new OpenAIProvider()
    case "mistral":
      return new MistralProvider()
    case "ollama":
      return new OllamaProvider()
    case "stub":
      return new StubProvider()
    default:
      console.warn(
        `[llm] LLM_PROVIDER="${name}" inconnu — repli sur StubProvider.`,
      )
      return new StubProvider()
  }
}

export { StubProvider } from "./providers/stub"

/** Raccourci : envoie un prompt avec le provider configuré. */
export async function complete(
  prompt: { system: string; user: string },
  opts?: import("./provider").LLMOptions,
): Promise<string> {
  return getLLMProvider().complete(prompt, opts)
}
