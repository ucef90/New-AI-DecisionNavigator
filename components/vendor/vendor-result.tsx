import type { VendorAnalysis } from "@prisma/client"

import type { VendorRedFlag, VendorQuestion } from "@/lib/prompts/vendor"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const RECO_STYLES: Record<string, { label: string; className: string }> = {
  PROCEED: {
    label: "Avancer",
    className:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  CAUTION: {
    label: "Prudence",
    className:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  AVOID: {
    label: "À éviter",
    className:
      "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  },
}

const FLAG_DOT: Record<string, string> = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-blue-500",
}

export function VendorResult({ analysis }: { analysis: VendorAnalysis }) {
  const redFlags = (analysis.redFlags as unknown as VendorRedFlag[]) ?? []
  const questions = (analysis.questions as unknown as VendorQuestion[]) ?? []
  const reco = RECO_STYLES[analysis.recommendation ?? "CAUTION"]

  return (
    <div className="space-y-6">
      {/* Synthèse */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">
              {analysis.documentName ?? "Analyse fournisseur"}
            </CardTitle>
            {reco ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
                  reco.className,
                )}
              >
                {reco.label}
              </span>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">Adéquation au besoin</span>
            <div className="flex gap-1" aria-label={`${analysis.fitScore}/5`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-6 rounded-full",
                    i <= (analysis.fitScore ?? 0) ? "bg-primary" : "bg-muted",
                  )}
                />
              ))}
            </div>
            <span className="font-medium tabular-nums">
              {analysis.fitScore}/5
            </span>
          </div>
          {analysis.fitJustification ? (
            <p className="leading-relaxed text-muted-foreground">
              {analysis.fitJustification}
            </p>
          ) : null}
          {analysis.recommendations ? (
            <p className="leading-relaxed">{analysis.recommendations}</p>
          ) : null}
        </CardContent>
      </Card>

      {/* Points de vigilance */}
      {redFlags.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Points de vigilance</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {redFlags.map((f, i) => (
                <li key={i} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        FLAG_DOT[f.severity] ?? "bg-muted-foreground",
                      )}
                      aria-hidden
                    />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{f.claim}</p>
                      <p className="text-sm text-muted-foreground">
                        {f.concern}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* Questions à poser */}
      {questions.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Questions à poser au fournisseur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {questions.map((q, i) => (
                <li key={i} className="flex gap-3">
                  <Badge
                    variant="secondary"
                    className="mt-0.5 size-6 shrink-0 justify-center rounded-full p-0 tabular-nums"
                  >
                    {i + 1}
                  </Badge>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{q.question}</p>
                    <p className="text-sm text-muted-foreground">{q.why}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
