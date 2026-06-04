"use client"

import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

/**
 * Jauge segmentée (0..max) qui se remplit de gauche à droite au scroll-in.
 */
export function ScoreMeter({ value, max = 3 }: { value: number; max?: number }) {
  const reduce = useReducedMotion()
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < value
        return (
          <motion.span
            key={i}
            className={cn(
              "h-1.5 flex-1 origin-left rounded-full",
              filled ? "bg-primary" : "bg-muted",
            )}
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.4,
              delay: reduce ? 0 : 0.12 + i * 0.08,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
          />
        )
      })}
    </div>
  )
}
