import type { LLMProvider, LLMProviderName } from "./provider"
import { timeoutSignal } from "./provider"
import { StubProvider } from "./providers/stub"
import { OpenAIProvider } from "./providers/openai"
import { MistralProvider } from "./providers/mistral"
import { OllamaProvider } from "./providers/ollama"
import { AnthropicProvider } from "./providers/anthropic"
import { getAppSettings, type AppSettings } from "@/lib/settings"

export type {
  LLMProvider,
  LLMPrompt,
  LLMProviderName,
  LLMOptions,
} from "./provider"

/**
 * Fabrique un provider à partir de son nom (config issue de l'environnement).
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
    case "anthropic":
      return new AnthropicProvider()
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

/** Instancie un provider concret avec la config persistée (Paramètres). */
function instantiate(name: LLMProviderName, s: AppSettings): LLMProvider {
  switch (name) {
    case "anthropic":
      return new AnthropicProvider(s.anthropicApiKey, s.anthropicModel)
    case "ollama":
      return new OllamaProvider(s.ollamaBaseUrl, s.ollamaModel)
    case "openai":
      return new OpenAIProvider(s.openaiApiKey, s.openaiModel, s.openaiBaseUrl)
    case "mistral":
      return new MistralProvider(s.mistralApiKey, s.mistralModel)
    case "stub":
    default:
      return new StubProvider()
  }
}

/** Vérifie rapidement qu'un serveur Ollama répond (pour le mode "auto"). */
async function ollamaReachable(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: timeoutSignal(1500),
      cache: "no-store",
    })
    return res.ok
  } catch {
    return false
  }
}

/** Mode "auto" : Ollama on-premise en priorité, puis Anthropic, puis cloud, sinon stub. */
async function pickAuto(s: AppSettings): Promise<LLMProviderName> {
  if (await ollamaReachable(s.ollamaBaseUrl)) return "ollama"
  if (s.anthropicApiKey) return "anthropic"
  if (s.openaiApiKey) return "openai"
  if (s.mistralApiKey) return "mistral"
  return "stub"
}

/** Résout le provider à utiliser selon les Paramètres (avec mode auto). */
export async function resolveLLMProvider(): Promise<LLMProvider> {
  const s = await getAppSettings()
  const name = s.llmMode === "auto" ? await pickAuto(s) : s.llmMode
  return instantiate(name, s)
}

/** Indique quel provider serait effectivement utilisé (pour l'affichage Paramètres). */
export async function resolveActiveProviderName(): Promise<LLMProviderName> {
  const s = await getAppSettings()
  return s.llmMode === "auto" ? await pickAuto(s) : s.llmMode
}

/** Raccourci : envoie un prompt avec le provider résolu (Paramètres). */
export async function complete(
  prompt: { system: string; user: string },
  opts?: import("./provider").LLMOptions,
): Promise<string> {
  return (await resolveLLMProvider()).complete(prompt, opts)
}
