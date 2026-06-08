// Diagnostic : quel provider LLM est réellement actif, et répond-il ?
// Usage : node --env-file=.env --import tsx scripts/check-llm.ts
import { resolveActiveProviderName, complete } from "@/lib/llm"

async function main() {
  const name = await resolveActiveProviderName()
  console.log("PROVIDER_ACTIF =", name)

  if (name === "stub") {
    console.log(
      "=> Mode démo (stub) : aucun LLM réel. Les analyses/propositions ne seraient pas fiables.",
    )
    return
  }

  const t0 = Date.now()
  try {
    const out = await complete(
      { system: "Réponds uniquement par le mot: OK", user: "ping" },
      { timeoutMs: 30000 },
    )
    console.log(
      `PING_OK (${Date.now() - t0} ms) — réponse: ${JSON.stringify((out || "").trim().slice(0, 100))}`,
    )
  } catch (e) {
    console.log(
      `PING_ECHEC (${Date.now() - t0} ms): ${e instanceof Error ? e.message : String(e)}`,
    )
  }
}

main().finally(() => process.exit(0))
