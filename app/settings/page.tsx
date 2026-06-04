import { Database, Cpu } from "@phosphor-icons/react/dist/ssr"

import { PageContainer, PageHeader } from "@/components/layout/page-container"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Paramètres" }

const PROVIDER_LABELS: Record<string, string> = {
  stub: "Stub (réponses déterministes, sans clé API)",
  openai: "OpenAI",
  mistral: "Mistral",
  ollama: "Ollama (local / on-premise)",
}

export default function SettingsPage() {
  const llmProvider = (process.env.LLM_PROVIDER ?? "stub").toLowerCase()
  const dbProvider = (process.env.DATABASE_PROVIDER ?? "sqlite").toLowerCase()

  const model =
    {
      openai: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      mistral: process.env.MISTRAL_MODEL ?? "mistral-small-latest",
      ollama: process.env.OLLAMA_MODEL ?? "mistral",
    }[llmProvider] ?? "—"

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Paramètres"
        description="Configuration de l'application. L'édition depuis l'interface arrivera dans une prochaine étape — pour l'instant, ces valeurs proviennent des variables d'environnement."
      />

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="size-4 text-muted-foreground" aria-hidden />
              Fournisseur LLM
            </CardTitle>
            <CardDescription>
              Défini par la variable <code>LLM_PROVIDER</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Provider actif</span>
              <Badge variant="secondary">
                {PROVIDER_LABELS[llmProvider] ?? llmProvider}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Modèle</span>
              <span className="font-mono text-xs">{model}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="size-4 text-muted-foreground" aria-hidden />
              Base de données
            </CardTitle>
            <CardDescription>
              Définie par <code>DATABASE_PROVIDER</code> / <code>DATABASE_URL</code>.
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
