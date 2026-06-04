import type { TechType } from "@prisma/client"
import { CaretRight } from "@phosphor-icons/react/dist/ssr"

import { TECH_LABELS, TECH_EXPLANATION } from "@/lib/decision/labels"
import { cn } from "@/lib/utils"

export function TechRadarDetail({
  affinities,
  recommended,
  reasons,
}: {
  affinities: { tech: TechType; value: number }[]
  recommended: TechType | null
  reasons: string[]
}) {
  const sorted = [...affinities].sort((a, b) => b.value - a.value)

  return (
    <details className="group mt-4 border-t pt-3">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80">
        <CaretRight
          className="size-3 transition-transform group-open:rotate-90"
          aria-hidden
        />
        Voir le détail (pourquoi ces scores + glossaire)
      </summary>

      <div className="mt-3 space-y-4 text-sm">
        {/* Pourquoi ces % */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Pourquoi ce profil
          </p>
          <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
            {reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>

        {/* Glossaire des technologies */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Que signifie chaque technologie
          </p>
          <ul className="space-y-2.5">
            {sorted.map((a) => {
              const isReco = a.tech === recommended
              return (
                <li key={a.tech} className="flex gap-3">
                  <span
                    className={cn(
                      "mt-0.5 w-12 shrink-0 text-xs font-semibold tabular-nums",
                      isReco ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {a.value}%
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-medium">
                      {TECH_LABELS[a.tech]}
                      {isReco ? (
                        <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          recommandé
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {TECH_EXPLANATION[a.tech]}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </details>
  )
}
