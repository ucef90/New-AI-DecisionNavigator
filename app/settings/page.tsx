import { Database } from "@phosphor-icons/react/dist/ssr"

import { PageContainer, PageHeader } from "@/components/layout/page-container"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAppSettings } from "@/lib/settings"
import { requireRole } from "@/lib/auth"
import {
  LlmSettingsForm,
  type LlmSettingsView,
} from "@/components/settings/llm-settings-form"

export const metadata = { title: "Paramètres" }

const PROVIDER_LABELS: Record<string, string> = {
  auto: "Automatique (selon disponibilité)",
  stub: "Stub (déterministe)",
  openai: "OpenAI",
  mistral: "Mistral",
  ollama: "Ollama (local)",
  anthropic: "Anthropic (Claude)",
}

export default async function SettingsPage() {
  await requireRole("ADMIN")
  const settings = await getAppSettings()
  const dbProvider = (process.env.DATABASE_PROVIDER ?? "sqlite").toLowerCase()

  // Libellé du provider effectif sans sonde réseau (évite de bloquer le rendu).
  const active =
    settings.llmMode === "auto" ? "auto" : settings.llmMode

  const view: LlmSettingsView = {
    llmMode: settings.llmMode,
    anthropicModel: settings.anthropicModel,
    ollamaBaseUrl: settings.ollamaBaseUrl,
    ollamaModel: settings.ollamaModel,
    openaiModel: settings.openaiModel,
    openaiBaseUrl: settings.openaiBaseUrl,
    mistralModel: settings.mistralModel,
    // On n'expose jamais les clés au client, seulement leur présence.
    hasAnthropicKey: !!settings.anthropicApiKey,
    hasOpenaiKey: !!settings.openaiApiKey,
    hasMistralKey: !!settings.mistralApiKey,
    activeProvider: PROVIDER_LABELS[active] ?? active,
    embeddingMode: settings.embeddingMode,
    ollamaEmbedModel: settings.ollamaEmbedModel,
    openaiEmbedModel: settings.openaiEmbedModel,
  }

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Paramètres"
        description="Configuration de l'application. Le choix du fournisseur LLM est éditable ici et persisté localement."
      />

      <div className="grid gap-4">
        <LlmSettingsForm view={view} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="size-4 text-muted-foreground" aria-hidden />
              Base de données
            </CardTitle>
            <CardDescription>
              Définie par <code>DATABASE_PROVIDER</code> /{" "}
              <code>DATABASE_URL</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Provider</span>
              <Badge variant="secondary">{dbProvider}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
