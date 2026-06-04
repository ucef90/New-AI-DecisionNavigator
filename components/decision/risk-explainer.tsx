import type { RegulatoryLevel } from "@prisma/client"
import { TrendUp, TrendDown, Minus } from "@phosphor-icons/react/dist/ssr"

import type { RiskFactor } from "@/lib/engine"
import { cn } from "@/lib/utils"

const LEVELS = [
  { key: "MINIMAL", label: "Minimal", bar: "bg-muted-foreground/40", text: "text-muted-foreground" },
  { key: "LOW", label: "Faible", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  { key: "MEDIUM", label: "Moyen", bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  { key: "HIGH", label: "Élevé", bar: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
] as const

const IMPACT = {
  up: { icon: TrendUp, cls: "text-rose-500" },
  down: { icon: TrendDown, cls: "text-emerald-500" },
  neutral: { icon: Minus, cls: "text-muted-foreground" },
} as const

export function RiskExplainer({
  level,
  factors,
}: {
  level: RegulatoryLevel
  factors: RiskFactor[]
}) {
  const idx = Math.max(
    0,
    LEVELS.findIndex((l) => l.key === level),
  )
  const current = LEVELS[idx]

  return (
    <div className="mb-5 space-y-4 rounded-lg border bg-muted/30 p-4">
      {/* Jauge de niveau */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Niveau de risque réglementaire
        </p>
        <div className="flex gap-1.5">
          {LEVELS.map((l, i) => (
            <div key={l.key} className="flex-1">
              <div
                className={cn(
                  "h-2 rounded-full transition-colors",
                  i <= idx ? current.bar : "bg-muted",
                )}
              />
              <span
                className={cn(
                  "mt-1 block text-center text-[10px]",
                  i === idx ? cn("font-semibold", current.text) : "text-muted-foreground",
                )}
              >
                {l.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Facteurs */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Ce qui détermine ce niveau
        </p>
        <ul className="space-y-1.5">
          {factors.map((f, i) => {
            const I = IMPACT[f.impact]
            return (
              <li key={i} className="flex items-start gap-2 text-sm">
                <I.icon
                  className={cn("mt-0.5 size-4 shrink-0", I.cls)}
                  aria-hidden
                />
                <span>
                  <span className="font-medium">{f.label}.</span>{" "}
                  <span className="text-muted-foreground">{f.note}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
