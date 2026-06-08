"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trophy } from "@phosphor-icons/react/dist/ssr"

import { setVendorScore } from "@/app/projects/[id]/vendor/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface VendorRow {
  id: string
  label: string
  fitScore: number | null
  maturityScore: number | null
  recommendation: string | null
  userScore: number | null
}

const RECO: Record<string, { label: string; cls: string }> = {
  PROCEED: {
    label: "Avancer",
    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  CAUTION: {
    label: "Prudence",
    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  AVOID: {
    label: "À éviter",
    cls: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  },
}

// Score IA /100 : moitié adéquation (/5), moitié fiabilité/maturité (/20).
function aiScore(r: VendorRow): number {
  const fit = ((r.fitScore ?? 0) / 5) * 50
  const mat = ((r.maturityScore ?? 0) / 20) * 50
  return Math.round(fit + mat)
}

// Score effectif pour le classement : la note manuelle prime, sinon le score IA.
function effectiveScore(r: VendorRow): number {
  return r.userScore ?? aiScore(r)
}

function ScoreInput({ projectId, row }: { projectId: string; row: VendorRow }) {
  const router = useRouter()
  const [val, setVal] = useState(row.userScore != null ? String(row.userScore) : "")
  const [pending, start] = useTransition()

  function save() {
    const trimmed = val.trim()
    const n = trimmed === "" ? null : Number(trimmed)
    start(async () => {
      await setVendorScore(projectId, row.id, n)
      router.refresh()
    })
  }

  return (
    <input
      type="number"
      min={0}
      max={100}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={save}
      disabled={pending}
      placeholder="—"
      aria-label="Ma note sur 100"
      className="h-8 w-20 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
    />
  )
}

export function VendorComparison({
  projectId,
  rows,
}: {
  projectId: string
  rows: VendorRow[]
}) {
  const ranked = [...rows].sort((a, b) => effectiveScore(b) - effectiveScore(a))

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Comparaison des offres ({rows.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Classement par <strong>ma note</strong> (si renseignée), sinon par le
          score IA. Attribue une note /100 à chaque offre pour les départager.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-2 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">Fournisseur / document</th>
                <th className="py-2 pr-3 font-medium">Reco IA</th>
                <th className="py-2 pr-3 text-center font-medium">Adéq. /5</th>
                <th className="py-2 pr-3 text-center font-medium">Matur. /20</th>
                <th className="py-2 pr-3 text-center font-medium">Score IA</th>
                <th className="py-2 pr-1 text-right font-medium">Ma note /100</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => {
                const reco = r.recommendation ? RECO[r.recommendation] : null
                const isBest = i === 0 && rows.length > 1
                return (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-b last:border-0",
                      isBest && "bg-emerald-500/5",
                    )}
                  >
                    <td className="py-2.5 pr-2 align-middle">
                      {isBest ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                          <Trophy className="size-4" weight="fill" aria-hidden />
                          1
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{i + 1}</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 align-middle font-medium">
                      {r.label}
                      {isBest ? (
                        <span className="ml-2 rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          Meilleure
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-3 align-middle">
                      {reco ? (
                        <span
                          className={cn(
                            "inline-flex rounded px-1.5 py-0.5 text-xs font-medium",
                            reco.cls,
                          )}
                        >
                          {reco.label}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-center align-middle tabular-nums">
                      {r.fitScore ?? "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-center align-middle tabular-nums">
                      {r.maturityScore ?? "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-center align-middle font-semibold tabular-nums">
                      {aiScore(r)}
                    </td>
                    <td className="py-2.5 pr-1 text-right align-middle">
                      <ScoreInput projectId={projectId} row={r} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
