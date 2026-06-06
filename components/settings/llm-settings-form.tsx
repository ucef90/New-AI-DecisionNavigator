"use client"

import { useState } from "react"
import { Cpu } from "@phosphor-icons/react/dist/ssr"

import { cn } from "@/lib/utils"
import type { LlmMode, EmbeddingMode, KnowledgeScope } from "@/lib/settings"
import { updateLlmSettings } from "@/app/settings/actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export interface LlmSettingsView {
  llmMode: LlmMode
  anthropicModel: string
  ollamaBaseUrl: string
  ollamaModel: string
  openaiModel: string
  openaiBaseUrl: string
  mistralModel: string
  hasAnthropicKey: boolean
  hasOpenaiKey: boolean
  hasMistralKey: boolean
  activeProvider: string
  embeddingMode: EmbeddingMode
  ollamaEmbedModel: string
  openaiEmbedModel: string
  knowledgeScope: KnowledgeScope
}

const EMBED_OPTIONS: { value: EmbeddingMode; label: string }[] = [
  { value: "auto", label: "Automatique (Ollama si dispo, sinon local)" },
  { value: "ollama", label: "Ollama (local)" },
  { value: "openai", label: "OpenAI" },
  { value: "hash", label: "Local déterministe (sans modèle)" },
]

const MODE_OPTIONS: { value: LlmMode; label: string }[] = [
  { value: "auto", label: "Automatique (choisit le meilleur disponible)" },
  { value: "ollama", label: "Ollama (local / on-premise)" },
  { value: "anthropic", label: "Anthropic — Claude (clé API)" },
  { value: "openai", label: "OpenAI (clé API)" },
  { value: "mistral", label: "Mistral (clé API)" },
  { value: "stub", label: "Stub (déterministe, sans clé)" },
]

const MODE_HELP: Record<LlmMode, string> = {
  auto: "Priorité à Ollama on-premise s'il répond, sinon Anthropic (si clé), puis cloud, sinon stub.",
  ollama: "Utilise votre serveur Ollama local. Aucune clé API requise.",
  anthropic:
    "Utilise l'API Anthropic (Claude) avec votre clé. Données envoyées au cloud Anthropic.",
  openai: "Utilise l'API OpenAI avec votre clé.",
  mistral: "Utilise l'API Mistral avec votre clé.",
  stub: "Réponses déterministes locales — pour tester le parcours sans LLM.",
}

const inputCls =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

export function LlmSettingsForm({ view }: { view: LlmSettingsView }) {
  const [mode, setMode] = useState<LlmMode>(view.llmMode)
  const [embedMode, setEmbedMode] = useState<EmbeddingMode>(view.embeddingMode)

  const visible = (...modes: LlmMode[]) =>
    cn("grid gap-4 sm:grid-cols-2", !modes.includes(mode) && "hidden")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Cpu className="size-4 text-muted-foreground" aria-hidden />
          Fournisseur LLM
        </CardTitle>
        <CardDescription>
          Choisissez le moteur d&apos;IA. En mode automatique, l&apos;outil
          sélectionne le meilleur disponible —{" "}
          <span className="font-medium text-foreground">
            actif : {view.activeProvider}
          </span>
          .
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={updateLlmSettings} className="space-y-5">
          {/* Mode */}
          <div className="space-y-2">
            <Label htmlFor="llmMode">Mode</Label>
            <select
              id="llmMode"
              name="llmMode"
              value={mode}
              onChange={(e) => setMode(e.target.value as LlmMode)}
              className={inputCls}
            >
              {MODE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{MODE_HELP[mode]}</p>
          </div>

          {/* Anthropic (visible en mode anthropic ou auto) */}
          <fieldset className={visible("anthropic", "auto")}>
            <ApiKeyField
              name="anthropicApiKey"
              label="Clé API Anthropic"
              configured={view.hasAnthropicKey}
              placeholder="sk-ant-..."
            />
            <Field
              name="anthropicModel"
              label="Modèle"
              defaultValue={view.anthropicModel}
              placeholder="claude-opus-4-8"
            />
          </fieldset>

          {/* Ollama (visible en mode ollama ou auto) */}
          <fieldset className={visible("ollama", "auto")}>
            <Field
              name="ollamaBaseUrl"
              label="URL du serveur Ollama"
              defaultValue={view.ollamaBaseUrl}
              placeholder="http://127.0.0.1:11434"
            />
            <Field
              name="ollamaModel"
              label="Modèle Ollama"
              defaultValue={view.ollamaModel}
              placeholder="mistral"
            />
          </fieldset>

          {/* OpenAI */}
          <fieldset className={visible("openai")}>
            <ApiKeyField
              name="openaiApiKey"
              label="Clé API OpenAI"
              configured={view.hasOpenaiKey}
              placeholder="sk-..."
            />
            <Field
              name="openaiModel"
              label="Modèle OpenAI"
              defaultValue={view.openaiModel}
              placeholder="gpt-4o-mini"
            />
            <Field
              name="openaiBaseUrl"
              label="URL de base (optionnel)"
              defaultValue={view.openaiBaseUrl}
              placeholder="https://api.openai.com/v1"
            />
          </fieldset>

          {/* Mistral */}
          <fieldset className={visible("mistral")}>
            <ApiKeyField
              name="mistralApiKey"
              label="Clé API Mistral"
              configured={view.hasMistralKey}
              placeholder="..."
            />
            <Field
              name="mistralModel"
              label="Modèle Mistral"
              defaultValue={view.mistralModel}
              placeholder="mistral-small-latest"
            />
          </fieldset>

          {/* Embeddings (RAG) */}
          <div className="space-y-2 border-t pt-5">
            <Label htmlFor="embeddingMode">Embeddings (base de connaissances)</Label>
            <select
              id="embeddingMode"
              name="embeddingMode"
              value={embedMode}
              onChange={(e) => setEmbedMode(e.target.value as EmbeddingMode)}
              className={inputCls}
            >
              {EMBED_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Modèle qui vectorise le corpus (RAG). Changer de modèle nécessite
              une réindexation depuis la page Connaissances.
            </p>
            <div className="grid gap-4 pt-1 sm:grid-cols-2">
              <div className={cn(embedMode === "openai" && "hidden")}>
                <Field
                  name="ollamaEmbedModel"
                  label="Modèle Ollama (embeddings)"
                  defaultValue={view.ollamaEmbedModel}
                  placeholder="nomic-embed-text"
                />
              </div>
              <div className={cn(embedMode !== "openai" && "hidden")}>
                <Field
                  name="openaiEmbedModel"
                  label="Modèle OpenAI (embeddings)"
                  defaultValue={view.openaiEmbedModel}
                  placeholder="text-embedding-3-small"
                />
              </div>
            </div>
          </div>

          {/* Périmètre des connaissances (cloisonnement RAG) */}
          <div className="space-y-2 border-t pt-5">
            <Label htmlFor="knowledgeScope">
              Périmètre des connaissances dérivées
            </Label>
            <select
              id="knowledgeScope"
              name="knowledgeScope"
              defaultValue={view.knowledgeScope}
              className={inputCls}
            >
              <option value="global">
                Global — réutilisable par tous les projets (apprentissage
                transverse)
              </option>
              <option value="project">
                Cloisonné par projet — anti-fuite (multi-service)
              </option>
            </select>
            <p className="text-xs text-muted-foreground">
              Concerne les analyses fournisseurs, décisions et rapports indexés.
              Le référentiel reste toujours global. Un changement s&apos;applique
              aux prochaines indexations (réindexer pour l&apos;appliquer à
              l&apos;existant).
            </p>
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
}: {
  name: string
  label: string
  defaultValue?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </div>
  )
}

function ApiKeyField({
  name,
  label,
  configured,
  placeholder,
}: {
  name: string
  label: string
  configured: boolean
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="password"
        autoComplete="off"
        placeholder={
          configured ? "•••••••••• (déjà configurée)" : (placeholder ?? "")
        }
      />
      <p className="text-xs text-muted-foreground">
        {configured
          ? "Laissez vide pour conserver la clé actuelle."
          : "Stockée localement (base de données on-premise)."}
      </p>
    </div>
  )
}
