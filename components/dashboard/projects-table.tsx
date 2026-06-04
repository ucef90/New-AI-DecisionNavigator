"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import type { Verdict, TechType, RegulatoryLevel } from "@prisma/client"

import { TECH_SHORT } from "@/lib/decision/labels"
import { VerdictBadge, RegulatoryLevelBadge } from "@/components/decision/badges"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface ProjectRow {
  id: string
  name: string
  direction: string | null
  verdict: Verdict | null
  tech: TechType | null
  level: RegulatoryLevel | null
  date: string
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}
const row = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
  const reduce = useReducedMotion()

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-6">Nom</TableHead>
          <TableHead>Direction</TableHead>
          <TableHead>Décision</TableHead>
          <TableHead>Techno</TableHead>
          <TableHead>Risque</TableHead>
          <TableHead className="pr-6 text-right">Date</TableHead>
        </TableRow>
      </TableHeader>
      <motion.tbody
        variants={reduce ? undefined : container}
        initial={reduce ? false : "hidden"}
        animate={reduce ? undefined : "show"}
        className="[&_tr:last-child]:border-0"
      >
        {projects.map((p) => (
          <motion.tr
            key={p.id}
            variants={reduce ? undefined : row}
            className="group border-b transition-colors hover:bg-muted/50"
          >
            <TableCell className="pl-6 font-medium">
              <Link
                href={`/projects/${p.id}`}
                className="transition-colors group-hover:text-primary"
              >
                {p.name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {p.direction ?? "—"}
            </TableCell>
            <TableCell>
              {p.verdict ? (
                <VerdictBadge verdict={p.verdict} />
              ) : (
                <span className="text-xs text-muted-foreground">En cours</span>
              )}
            </TableCell>
            <TableCell>
              {p.tech ? (
                <Badge variant="outline" className="font-normal">
                  {TECH_SHORT[p.tech]}
                </Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              {p.level ? (
                <RegulatoryLevelBadge level={p.level} />
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="pr-6 text-right text-muted-foreground tabular-nums">
              {p.date}
            </TableCell>
          </motion.tr>
        ))}
      </motion.tbody>
    </Table>
  )
}
