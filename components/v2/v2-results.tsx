import {
  CheckCircle,
  Warning,
  XCircle,
  Lightning,
} from "@phosphor-icons/react/dist/ssr"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type {
  FrameworkDecision,
  ScoringResult,
} from "@/lib/prompts/framework"

import { AxesBars, AxesRadar, RiskMatrix, ScoreGauge } from "./v2-charts"
import { V2Markdown } from "./v2-markdown"

const DECISION: Record<
  FrameworkDecision,
  { label: string; cls: string; ring: string }
> = {
  GO_PRODUCTION: {
    label: "GO PRODUCTION",
    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    ring: "border-emerald-500/40",
  },
  GO_POC: {
    label: "GO POC",
    cls: "bg-green-500/15 text-green-700 dark:text-green-400",
    ring: "border-green-500/40",
  },
  CONDITIONNEL: {
    label: "CONDITIONNEL",
    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    ring: "border-amber-500/40",
  },
  NO_GO: {
    label: "NO GO",
    cls: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
    ring: "border-rose-500/40",
  },
}

const SOCLE_TITLES: Record<number, string> = {
  1: "Socle 1 — Analyse métier",
  2: "Socle 2 — IA ou automatisation",
  3: "Socle 3 — Questionnaire de cadrage",
  4: "Socle 4 — Scoring & maturité",
  5: "Socle 5 — Cartographie IA",
  6: "Socle 6 — Gouvernance & conformité",
}

export function V2Results({
  scoring,
  report,
}: {
  scoring: ScoringResult
  report?: string | null
}) {
  const d = DECISION[scoring.decision]

  return (
    <div className="space-y-6">
      {/* Décision + score */}
      <Card className={cn("border-2", d.ring)}>
        <CardContent className="flex flex-col items-center gap-6 pt-6 sm:flex-row sm:items-center">
          <ScoreGauge
            scoreGlobal={scoring.scoreGlobal}
            pourcentage={scoring.pourcentage}
          />
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <span className={cn("inline-block rounded-md px-3 py-1 text-lg font-bold", d.cls)}>
              {d.label}
            </span>
            {scoring.niveau ? (
              <p className="text-sm font-medium">{scoring.niveau}</p>
            ) : null}
            {scoring.prochaineEtape ? (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Prochaine étape : </span>
                {scoring.prochaineEtape}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Blocage immédiat */}
      {scoring.blocageImmediat ? (
        <div className="flex items-start gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-400">
          <XCircle className="mt-0.5 size-5 shrink-0" weight="fill" aria-hidden />
          <div>
            <p className="font-semibold">Blocage critique — NO GO immédiat</p>
            <p>{scoring.blocageImmediat}</p>
          </div>
        </div>
      ) : null}

      {/* Radar + axes */}
      {scoring.axes.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Maturité — 11 axes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="flex items-start justify-center">
              <AxesRadar axes={scoring.axes} />
            </div>
            <AxesBars axes={scoring.axes} />
          </CardContent>
        </Card>
      ) : null}

      {/* Analyse par socle */}
      {scoring.parSocle.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Analyse par socle</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {scoring.parSocle.map((s) => (
              <div key={s.socle} className="space-y-2 rounded-lg border p-3">
                <p className="text-sm font-semibold">{SOCLE_TITLES[s.socle] ?? `Socle ${s.socle}`}</p>
                {s.forces.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Forces</p>
                    <ul className="list-disc pl-4 text-xs text-muted-foreground">
                      {s.forces.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                ) : null}
                {s.faiblesses.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">Faiblesses</p>
                    <ul className="list-disc pl-4 text-xs text-muted-foreground">
                      {s.faiblesses.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Risques */}
      {scoring.risques.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Matrice des risques</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskMatrix risks={scoring.risques} />
          </CardContent>
        </Card>
      ) : null}

      {/* Points critiques / opportunités */}
      {(scoring.pointsCritiques.length > 0 || scoring.opportunites.length > 0) ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {scoring.pointsCritiques.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Warning className="size-4 text-amber-500" aria-hidden />
                  Points critiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                  {scoring.pointsCritiques.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </CardContent>
            </Card>
          ) : null}
          {scoring.opportunites.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightning className="size-4 text-emerald-500" aria-hidden />
                  Opportunités
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                  {scoring.opportunites.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* Recommandations */}
      {scoring.recommandations.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recommandations prioritaires</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Action</th>
                  <th className="py-2 pr-3 font-medium">Responsable</th>
                  <th className="py-2 font-medium">Délai</th>
                </tr>
              </thead>
              <tbody>
                {scoring.recommandations.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-3">{r.action}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{r.responsable}</td>
                    <td className="py-2 text-muted-foreground">{r.delai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {/* Conditions */}
      {scoring.conditions.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="size-4 text-muted-foreground" aria-hidden />
              Conditions de la décision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {scoring.conditions.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* Rapport */}
      {report ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rapport de cadrage</CardTitle>
          </CardHeader>
          <CardContent>
            <V2Markdown content={report} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
