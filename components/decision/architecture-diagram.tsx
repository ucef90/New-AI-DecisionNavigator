import { ArrowDown, CaretRight } from "@phosphor-icons/react/dist/ssr"

// Schéma d'architecture en couches, généré (boîtes + puces + flux). Utilisé
// soit avec l'exemple par défaut, soit avec les couches issues de la
// proposition de solution générée par le LLM. Rendu HTML/CSS : responsive,
// imprimable, thème clair/sombre, sans dépendance de dessin.

type Layer = {
  name: string
  label: string // rôle court de la couche
  color: string // classes du bandeau de couche
  items?: string[] // composants (puces)
  pipeline?: string[] // étapes séquencées (avec flèches)
}

// Palette appliquée par ordre aux couches fournies dynamiquement.
const PALETTE = [
  "bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-blue-500/30",
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 ring-indigo-500/30",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/30",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30",
]

const DEFAULT_LAYERS: Layer[] = [
  {
    name: "Entrées",
    label: "Sources de documents",
    color: PALETTE[0],
    items: ["Scanner", "Bannette GED", "Messagerie", "Dossier partagé"],
  },
  {
    name: "Plateforme",
    label: "Routage & orchestration",
    color: PALETTE[1],
    items: ["Traefik · TLS / SSO", "NiFi · règles métier"],
  },
  {
    name: "Traitement IA",
    label: "Chaîne de traitement",
    color: PALETTE[2],
    pipeline: ["Découpe", "OCR / ICR", "Classification", "Extraction", "Contrôles"],
  },
  {
    name: "Données",
    label: "Stockage & persistance",
    color: PALETTE[3],
    items: ["PostgreSQL", "MongoDB", "Redis", "MinIO · chiffré"],
  },
  {
    name: "Restitution",
    label: "Sorties & interfaces",
    color: PALETTE[4],
    items: ["Front React · arbitrage", "GED Multigest", "API SI Métier"],
  },
]

const DEFAULT_TRANSVERSE = ["Prometheus / Grafana", "ELK", "Keycloak · SSO / RBAC"]

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
      {children}
    </span>
  )
}

function LayerRow({ layer }: { layer: Layer }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div
          className={`flex shrink-0 flex-col rounded-md px-2.5 py-1.5 ring-1 sm:w-40 ${layer.color}`}
        >
          <span className="text-sm font-semibold">{layer.name}</span>
          {layer.label ? (
            <span className="text-[11px] opacity-80">{layer.label}</span>
          ) : null}
        </div>

        {layer.pipeline && layer.pipeline.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {layer.pipeline.map((step, i) => (
              <span key={step} className="flex items-center gap-1.5">
                <Chip>{step}</Chip>
                {i < layer.pipeline!.length - 1 ? (
                  <CaretRight
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                ) : null}
              </span>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {layer.items?.map((it) => <Chip key={it}>{it}</Chip>)}
          </div>
        )}
      </div>
    </div>
  )
}

export function ArchitectureDiagram({
  layers,
  transverse,
}: {
  layers?: { name: string; label: string; items: string[] }[]
  transverse?: string[]
} = {}) {
  // Couches dynamiques (proposition générée) ou exemple par défaut.
  const resolved: Layer[] =
    layers && layers.length > 0
      ? layers.map((l, i) => ({
          name: l.name,
          label: l.label,
          color: PALETTE[i % PALETTE.length],
          items: l.items,
        }))
      : DEFAULT_LAYERS

  const trans =
    transverse && transverse.length > 0 ? transverse : DEFAULT_TRANSVERSE

  return (
    <figure
      className="space-y-0 rounded-xl border bg-muted/30 p-4"
      aria-label="Schéma d'architecture cible en couches"
    >
      {resolved.map((layer, i) => (
        <div key={`${layer.name}-${i}`}>
          <LayerRow layer={layer} />
          {i < resolved.length - 1 ? (
            <div className="flex justify-center py-1">
              <ArrowDown
                className="size-4 text-muted-foreground/70"
                aria-hidden
              />
            </div>
          ) : null}
        </div>
      ))}

      {trans.length > 0 ? (
        <div className="mt-3 rounded-lg border border-dashed bg-card p-3">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="flex shrink-0 flex-col rounded-md bg-slate-500/15 px-2.5 py-1.5 text-slate-700 ring-1 ring-slate-500/30 dark:text-slate-300 sm:w-40">
              <span className="text-sm font-semibold">Transverse</span>
              <span className="text-[11px] opacity-80">À toutes les couches</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {trans.map((it) => (
                <Chip key={it}>{it}</Chip>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <figcaption className="mt-3 text-[11px] text-muted-foreground">
        Schéma indicatif — flux de haut en bas ; la couche transverse
        (observabilité, sécurité, SSO) s&apos;applique à l&apos;ensemble.
      </figcaption>
    </figure>
  )
}
