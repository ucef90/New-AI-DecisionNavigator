"use client"

import { motion, useReducedMotion } from "motion/react"

/**
 * Transition de page : léger fondu + montée à chaque navigation.
 * Next.js remonte ce template à chaque changement de route.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
    >
      {children}
    </motion.div>
  )
}
