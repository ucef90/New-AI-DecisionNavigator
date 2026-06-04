"use client"

import { motion, useReducedMotion } from "motion/react"

export interface Slice {
  label: string
  value: number
  color: string
}

/** Donut SVG de répartition (verdicts). Animation d'entrée discrète. */
export function VerdictDonut({ data }: { data: Slice[] }) {
  const reduce = useReducedMotion()
  const total = data.reduce((s, d) => s + d.value, 0)
  const R = 15.915 // circonférence ≈ 100
  let offset = 25 // démarre en haut

  return (
    <div className="flex items-center gap-6">
      <div className="relative size-32 shrink-0">
        <svg viewBox="0 0 36 36" className="size-full -rotate-90">
          <circle
            cx="18"
            cy="18"
            r={R}
            fill="none"
            className="stroke-muted"
            strokeWidth="4"
          />
          {data.map((d) => {
            const pct = total ? (d.value / total) * 100 : 0
            const dash = `${pct} ${100 - pct}`
            const el = (
              <motion.circle
                key={d.label}
                cx="18"
                cy="18"
                r={R}
                fill="none"
                stroke={d.color}
                strokeWidth="4"
                strokeDasharray={dash}
                strokeDashoffset={-offset + 25}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            )
            offset += pct
            return el
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tabular-nums">{total}</span>
          <span className="text-[10px] text-muted-foreground">projets</span>
        </div>
      </div>

      <ul className="space-y-1.5 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
              aria-hidden
            />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="font-medium tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Barres horizontales (technologies). Largeur animée au scroll-in. */
export function TechBars({ data }: { data: { label: string; value: number }[] }) {
  const reduce = useReducedMotion()
  const max = Math.max(1, ...data.map((d) => d.value))

  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{d.label}</span>
            <span className="tabular-nums text-muted-foreground">{d.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={reduce ? false : { width: 0 }}
              whileInView={{ width: `${(d.value / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
