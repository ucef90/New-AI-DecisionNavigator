"use client"

import { useEffect, useState } from "react"
import { animate, useReducedMotion } from "motion/react"

/** Compteur animé de 0 à `value`. Statique si prefers-reduced-motion. */
export function CountUp({
  value,
  duration = 0.9,
  className,
}: {
  value: number
  duration?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(reduce ? value : 0)

  useEffect(() => {
    if (reduce) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1] as const,
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [value, duration, reduce])

  return (
    <span className={className} aria-label={String(value)}>
      {display}
    </span>
  )
}
