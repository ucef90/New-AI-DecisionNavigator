import type { ScoringAxis, ScoringRisk } from "@/lib/prompts/framework"
import { cn } from "@/lib/utils"

// Graphes SVG autonomes pour le résultat du cadrage V2 (aucune dépendance).

function pct(score: number): number {
  return Math.round((score / 55) * 100)
}
function gaugeColor(p: number): string {
  if (p >= 80) return "stroke-emerald-500"
  if (p >= 60) return "stroke-green-500"
  if (p >= 40) return "stroke-amber-500"
  return "stroke-rose-500"
}
function gaugeText(p: number): string {
  if (p >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (p >= 60) return "text-green-600 dark:text-green-400"
  if (p >= 40) return "text-amber-600 dark:text-amber-400"
  return "text-rose-600 dark:text-rose-400"
}

export function ScoreGauge({
  scoreGlobal,
  pourcentage,
}: {
  scoreGlobal: number
  pourcentage?: number
}) {
  const p = pourcentage ?? pct(scoreGlobal)
  const size = 160
  const stroke = 14
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.max(0, Math.min(100, p)) / 100)
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="fill-none stroke-muted"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={cn("fill-none", gaugeColor(p))}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold tabular-nums", gaugeText(p))}>
          {scoreGlobal}
          <span className="text-base font-medium text-muted-foreground">/55</span>
        </span>
        <span className="text-sm font-semibold text-muted-foreground">{p}%</span>
      </div>
    </div>
  )
}

// Radar des 11 axes (score 1..5). Numéros autour, détail en légende ailleurs.
export function AxesRadar({ axes }: { axes: ScoringAxis[] }) {
  const n = axes.length
  if (n < 3) return null
  const size = 300
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 30

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2
  const point = (i: number, ratio: number) =>
    [cx + Math.cos(angle(i)) * r * ratio, cy + Math.sin(angle(i)) * r * ratio] as const

  const ring = (ratio: number) =>
    axes
      .map((_, i) => {
        const [x, y] = point(i, ratio)
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(" ") + " Z"

  const dataPath =
    axes
      .map((a, i) => {
        const [x, y] = point(i, Math.max(0, Math.min(5, a.score)) / 5)
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(" ") + " Z"

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-auto w-full max-w-[320px]"
      role="img"
      aria-label="Radar des 11 axes de maturité"
    >
      {[0.2, 0.4, 0.6, 0.8, 1].map((ratio) => (
        <path key={ratio} d={ring(ratio)} className="fill-none stroke-border" strokeWidth={1} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, 1)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="stroke-border" strokeWidth={1} />
      })}
      <path d={dataPath} className="fill-primary/20 stroke-primary" strokeWidth={2} />
      {axes.map((a, i) => {
        const [px, py] = point(i, Math.max(0, Math.min(5, a.score)) / 5)
        const [lx, ly] = point(i, 1.13)
        return (
          <g key={i}>
            <circle cx={px} cy={py} r={2.5} className="fill-primary" />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[10px] font-medium"
            >
              {a.axe}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function barColor(score: number): string {
  if (score >= 4) return "bg-emerald-500"
  if (score >= 3) return "bg-green-500"
  if (score >= 2) return "bg-amber-500"
  return "bg-rose-500"
}

export function AxesBars({ axes }: { axes: ScoringAxis[] }) {
  return (
    <ul className="space-y-2.5">
      {axes.map((a) => (
        <li key={a.axe} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span>
              <span className="mr-1.5 inline-flex size-5 items-center justify-center rounded bg-muted text-xs font-semibold tabular-nums">
                {a.axe}
              </span>
              {a.label}
            </span>
            <span className="shrink-0 font-semibold tabular-nums">{a.score}/5</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", barColor(a.score))}
              style={{ width: `${(Math.max(0, Math.min(5, a.score)) / 5) * 100}%` }}
            />
          </div>
          {a.justification ? (
            <p className="text-xs text-muted-foreground">{a.justification}</p>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function critColor(crit: number): string {
  if (crit >= 12) return "bg-rose-500/15 text-rose-700 dark:text-rose-400"
  if (crit >= 6) return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
  return "bg-blue-500/15 text-blue-700 dark:text-blue-400"
}

// Matrice 4×4 (P en abscisse, I en ordonnée) + détail des risques.
export function RiskMatrix({ risks }: { risks: ScoringRisk[] }) {
  // I de 4 (haut) à 1 (bas), P de 1 à 4 (gauche → droite).
  const rows = [4, 3, 2, 1]
  const cols = [1, 2, 3, 4]
  const countAt = (p: number, i: number) =>
    risks.filter((r) => r.p === p && r.i === i).length

  return (
    <div className="space-y-4">
      <div className="inline-grid grid-cols-[auto_repeat(4,2.5rem)] gap-1 text-xs">
        <span />
        {cols.map((p) => (
          <span key={p} className="text-center font-medium text-muted-foreground">
            P{p}
          </span>
        ))}
        {rows.map((i) => (
          <FragmentRow key={i} i={i} cols={cols} countAt={countAt} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">P = probabilité · I = impact · criticité = P×I</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Risque</th>
              <th className="py-2 pr-2 text-center font-medium">P</th>
              <th className="py-2 pr-2 text-center font-medium">I</th>
              <th className="py-2 pr-2 text-center font-medium">P×I</th>
              <th className="py-2 pl-2 font-medium">Mitigation</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((r, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 pr-3 font-medium">{r.risque}</td>
                <td className="py-2 pr-2 text-center tabular-nums">{r.p}</td>
                <td className="py-2 pr-2 text-center tabular-nums">{r.i}</td>
                <td className="py-2 pr-2 text-center">
                  <span className={cn("rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums", critColor(r.criticite))}>
                    {r.criticite}
                  </span>
                </td>
                <td className="py-2 pl-2 text-muted-foreground">{r.mitigation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FragmentRow({
  i,
  cols,
  countAt,
}: {
  i: number
  cols: number[]
  countAt: (p: number, i: number) => number
}) {
  return (
    <>
      <span className="flex items-center font-medium text-muted-foreground">I{i}</span>
      {cols.map((p) => {
        const crit = p * i
        const count = countAt(p, i)
        return (
          <span
            key={p}
            className={cn(
              "flex size-10 items-center justify-center rounded text-xs font-semibold tabular-nums",
              critColor(crit),
            )}
            title={`P${p} × I${i} = ${crit}`}
          >
            {count > 0 ? count : ""}
          </span>
        )
      })}
    </>
  )
}
