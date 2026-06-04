"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import type { RegulatoryFramework, AlertLevel } from "@prisma/client"
import { CaretDown, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr"

import { FRAMEWORK_LABELS, ALERT_STYLES } from "@/lib/decision/labels"
import { getRegulatoryDetail } from "@/lib/decision/regulatory-reference"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface AlertData {
  id: string
  framework: RegulatoryFramework
  article: string | null
  level: AlertLevel
  obligation: string
  action: string
  deadline: string | null
}

export function AlertItem({ alert }: { alert: AlertData }) {
  const [open, setOpen] = useState(false)
  const detail = getRegulatoryDetail(alert.framework, alert.article)

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span
          className={`mt-1.5 size-2 shrink-0 rounded-full ${ALERT_STYLES[alert.level].dot}`}
          aria-hidden
        />
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs font-normal">
              {FRAMEWORK_LABELS[alert.framework]}
              {alert.article ? ` · ${alert.article}` : ""}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {ALERT_STYLES[alert.level].label}
              {alert.deadline ? ` · ${alert.deadline}` : ""}
            </span>
          </div>
          <p className="text-sm">{alert.obligation}</p>
          <p className="text-sm text-muted-foreground">{alert.action}</p>

          {detail ? (
            <>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                {open ? "Masquer le détail" : "Voir le détail"}
                <CaretDown
                  className={cn(
                    "size-3 transition-transform",
                    open && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>

              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 space-y-2 rounded-md border bg-muted/40 p-3 text-sm">
                      <div>
                        <span className="font-medium">Ce que dit le texte. </span>
                        <span className="text-muted-foreground">
                          {detail.what}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">
                          Pourquoi pour ce projet.{" "}
                        </span>
                        <span className="text-muted-foreground">
                          {detail.why}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                        <span>Source : {detail.source}</span>
                        {detail.url ? (
                          <a
                            href={detail.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            Consulter
                            <ArrowSquareOut className="size-3" aria-hidden />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </>
          ) : null}
        </div>
      </div>
    </li>
  )
}
