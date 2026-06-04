import type { Verdict, RegulatoryLevel } from "@prisma/client"

import { cn } from "@/lib/utils"
import {
  VERDICT_STYLES,
  VERDICT_DESCRIPTIONS,
  REG_LEVEL_STYLES,
} from "@/lib/decision/labels"
import { CountUp } from "@/components/motion/count-up"

export function VerdictBadge({
  verdict,
  className,
}: {
  verdict: Verdict
  className?: string
}) {
  const s = VERDICT_STYLES[verdict]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide",
        s.className,
        className,
      )}
    >
      {s.label}
    </span>
  )
}

export function RegulatoryLevelBadge({
  level,
  className,
}: {
  level: RegulatoryLevel
  className?: string
}) {
  const s = REG_LEVEL_STYLES[level]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        s.className,
        className,
      )}
    >
      Risque {s.label.toLowerCase()}
    </span>
  )
}

/**
 * Bannière de décision : le verdict est le moment central de la page résultats.
 * Bloc teinté selon le verdict, score global à droite. Pas de "hero-metric".
 */
export function DecisionBanner({
  verdict,
  total,
}: {
  verdict: Verdict
  total: number
}) {
  const s = VERDICT_STYLES[verdict]
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-6 rounded-xl border p-6",
        s.className,
      )}
    >
      <div className="space-y-1.5">
        <p className="text-sm font-medium opacity-70">Décision recommandée</p>
        <p className="text-4xl font-semibold leading-none tracking-tight">
          {s.label}
        </p>
        <p className="max-w-md text-sm opacity-90">
          {VERDICT_DESCRIPTIONS[verdict]}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-3xl font-semibold leading-none tabular-nums">
          <CountUp value={total} />
          <span className="text-lg opacity-60">/18</span>
        </p>
        <p className="mt-1 text-xs opacity-70">score global</p>
      </div>
    </div>
  )
}
