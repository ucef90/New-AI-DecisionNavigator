"use client"

import { motion, useReducedMotion } from "motion/react"
import type { TechType } from "@prisma/client"

import { TECH_SHORT } from "@/lib/decision/labels"
import { cn } from "@/lib/utils"

const C = 120
const R = 86
const LR = 108
const N = 6
const RINGS = [0.25, 0.5, 0.75, 1]

function point(i: number, frac: number): [number, number] {
  const ang = ((-90 + i * (360 / N)) * Math.PI) / 180
  return [C + R * frac * Math.cos(ang), C + R * frac * Math.sin(ang)]
}
function poly(values: number[]): string {
  return values.map((v, i) => point(i, v).join(",")).join(" ")
}

export function TechRadar({
  data,
  recommended,
}: {
  data: { tech: TechType; value: number }[]
  recommended: TechType | null
}) {
  const reduce = useReducedMotion()
  const dataPoly = poly(data.map((d) => d.value / 100))

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
      <svg viewBox="0 0 240 240" className="size-56 shrink-0">
        {/* grille */}
        {RINGS.map((r) => (
          <polygon
            key={r}
            points={poly(data.map(() => r))}
            fill="none"
            className="stroke-border"
            strokeWidth="1"
          />
        ))}
        {/* axes */}
        {data.map((_, i) => {
          const [x, y] = point(i, 1)
          return (
            <line
              key={i}
              x1={C}
              y1={C}
              x2={x}
              y2={y}
              className="stroke-border"
              strokeWidth="1"
            />
          )
        })}
        {/* surface des affinités */}
        <motion.polygon
          points={dataPoly}
          className="fill-primary/25 stroke-primary"
          strokeWidth="2"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* points + libellés */}
        {data.map((d, i) => {
          const [px, py] = point(i, d.value / 100)
          const [lx, ly] = [
            C + LR * Math.cos(((-90 + i * 60) * Math.PI) / 180),
            C + LR * Math.sin(((-90 + i * 60) * Math.PI) / 180),
          ]
          const isReco = d.tech === recommended
          const anchor =
            Math.abs(lx - C) < 5 ? "middle" : lx > C ? "start" : "end"
          return (
            <g key={d.tech}>
              <circle
                cx={px}
                cy={py}
                r={isReco ? 3.5 : 2.5}
                className={isReco ? "fill-primary" : "fill-muted-foreground"}
              />
              <text
                x={lx}
                y={ly}
                textAnchor={anchor}
                dominantBaseline="middle"
                className={cn(
                  "text-[10px]",
                  isReco
                    ? "fill-foreground font-semibold"
                    : "fill-muted-foreground",
                )}
              >
                {TECH_SHORT[d.tech]}
              </text>
            </g>
          )
        })}
      </svg>

      {/* légende / barres */}
      <ul className="w-full space-y-2 text-sm">
        {[...data]
          .sort((a, b) => b.value - a.value)
          .map((d) => {
            const isReco = d.tech === recommended
            return (
              <li key={d.tech} className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-12 shrink-0 font-medium",
                    isReco && "text-primary",
                  )}
                >
                  {TECH_SHORT[d.tech]}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      isReco ? "bg-primary" : "bg-muted-foreground/50",
                    )}
                    style={{ width: `${d.value}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right tabular-nums text-muted-foreground">
                  {d.value}%
                </span>
              </li>
            )
          })}
      </ul>
    </div>
  )
}
