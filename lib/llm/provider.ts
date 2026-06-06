// Abstraction LLM — un seul point d'entrée pour toute l'app.
// Toute la logique métier appelle `complete()`, jamais un provider concret.

export interface LLMPrompt {
  system: string
  user: string
}

export interface LLMOptions {
  /** Force une sortie JSON valide (format JSON côté provider). */
  json?: boolean
  /** Délai max avant abandon (ms). */
  timeoutMs?: number
}

export interface LLMProvider {
  /** Identifiant lisible du provider (utile pour logs / debug). */
  readonly name: string
  /** Envoie un prompt system + user et retourne le texte brut de la complétion. */
  complete(prompt: LLMPrompt, opts?: LLMOptions): Promise<string>
}

export type LLMProviderName =
  | "stub"
  | "openai"
  | "mistral"
  | "ollama"
  | "anthropic"

/** AbortSignal avec timeout (défaut 120 s). */
export function timeoutSignal(ms = 120_000): AbortSignal {
  const c = new AbortController()
  setTimeout(() => c.abort(), ms)
  return c.signal
}
