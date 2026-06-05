import {
  Document,
  Page,
  Text,
  View,
  Svg,
  Polygon,
  Line,
  StyleSheet,
} from "@react-pdf/renderer"
import type { RegulatoryLevel, Verdict } from "@prisma/client"

import type { GlobalAnalysis } from "@/lib/analysis/global"
import { scoreTrafficHex } from "@/lib/decision/labels"

// ── Données structurées du rapport ───────────────────────────
export interface ReportData {
  projectName: string
  direction?: string | null
  userName: string
  date: string
  description?: string | null
  context: {
    summary: string
    businessNeed: string
    processes: string[]
    dataPoints: string[]
    stakes: string[]
  } | null
  analysis: GlobalAnalysis
  verdict: Verdict
  verdictLabel: string
  verdictMeaning: string
  justification: string
  scoreTotal: number
  axes: { label: string; value: number }[]
  techLabel: string | null
  techExplanation: string | null
  affinities: { label: string; value: number }[]
  regulatoryLevelLabel: string
  regulatoryLevelKey: RegulatoryLevel
  alerts: {
    framework: string
    article: string | null
    level: string
    obligation: string
    action: string
    deadline: string | null
  }[]
  steps: string[]
  vendor: {
    documentName: string
    fitScore: number
    maturityScore: number
    recommendationLabel: string
    solutionSummary: string
    relevance: string
    fitJustification: string
    questions: { question: string; why: string }[]
  } | null
}

const RISK_HEX: Record<RegulatoryLevel, string> = {
  HIGH: "#e11d48",
  MEDIUM: "#d97706",
  LOW: "#059669",
  MINIMAL: "#71717a",
}
const RISK_ORDER: RegulatoryLevel[] = ["MINIMAL", "LOW", "MEDIUM", "HIGH"]
const RISK_LABELS = ["Minimal", "Faible", "Moyen", "Élevé"]
const PRIMARY = "#4F46E5"
const INK = "#18181b"
const MUTED = "#71717a"
const BORDER = "#e4e4e7"
const EMERALD = "#059669"
const AMBER = "#d97706"
const ROSE = "#e11d48"

const QUAL_HEX: Record<string, string> = {
  Automatisation: "#7c3aed",
  IA: "#2563eb",
  "IA avancée": "#e11d48",
}
const GOV_HEX: Record<string, string> = {
  ok: EMERALD,
  warn: AMBER,
  todo: MUTED,
}
const GOV_MARK: Record<string, string> = {
  ok: "OK",
  warn: "!",
  todo: "•",
}

// Couleur d'une jauge /100 (vert si bon, ambre, rouge). invert = un score bas est bon.
function gaugeHex(v: number, invert = false): string {
  const good = invert ? v < 40 : v >= 66
  const mid = v >= 40 && v < 66
  return good ? EMERALD : mid ? AMBER : ROSE
}

const s = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 44,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: INK,
    lineHeight: 1.45,
  },
  h1: { fontSize: 17, fontFamily: "Helvetica-Bold" },
  meta: { fontSize: 9, color: MUTED, marginTop: 2, marginBottom: 14 },
  section: { marginTop: 16 },
  h2: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY,
    marginBottom: 6,
  },
  banner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    padding: 12,
  },
  verdictBig: { fontSize: 22, fontFamily: "Helvetica-Bold" },
  para: { marginBottom: 3 },
  row: { flexDirection: "row" },
  barTrack: {
    height: 6,
    backgroundColor: "#f1f1f4",
    borderRadius: 3,
    flexGrow: 1,
  },
  card: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    padding: 10,
  },
  alert: { marginBottom: 6, paddingBottom: 6, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  badge: {
    fontSize: 7.5,
    color: "#fff",
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    borderRadius: 3,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    fontSize: 7.5,
    color: "#a1a1aa",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
})

// Radar SVG (hexagone) des affinités technologiques.
function Radar({ data }: { data: { label: string; value: number }[] }) {
  const C = 70
  const R = 52
  const N = data.length
  const pt = (i: number, frac: number) => {
    const ang = ((-90 + i * (360 / N)) * Math.PI) / 180
    return [C + R * frac * Math.cos(ang), C + R * frac * Math.sin(ang)]
  }
  const poly = (frac: number) =>
    data.map((_, i) => pt(i, frac).join(",")).join(" ")
  const dataPoly = data.map((d, i) => pt(i, d.value / 100).join(",")).join(" ")

  return (
    <Svg width={140} height={150} viewBox="0 0 140 150">
      {[0.33, 0.66, 1].map((r) => (
        <Polygon key={r} points={poly(r)} stroke={BORDER} strokeWidth={0.6} fill="none" />
      ))}
      {data.map((_, i) => {
        const [x, y] = pt(i, 1)
        return <Line key={i} x1={C} y1={C} x2={x} y2={y} stroke={BORDER} strokeWidth={0.6} />
      })}
      <Polygon points={dataPoly} fill={PRIMARY} fillOpacity={0.25} stroke={PRIMARY} strokeWidth={1.2} />
      {data.map((d, i) => {
        const [lx, ly] = pt(i, 1.2)
        return (
          <Text
            key={d.label}
            x={lx}
            y={ly}
            fill={MUTED}
            textAnchor="middle"
            style={{ fontSize: 7 }}
          >
            {d.label}
          </Text>
        )
      })}
    </Svg>
  )
}

// Liste de libellés en ligne (« Gains : a · b · c »).
function Inline({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <Text style={s.para}>
      <Text style={{ fontFamily: "Helvetica-Bold" }}>{label} : </Text>
      <Text style={{ color: MUTED }}>{items.join("  ·  ")}</Text>
    </Text>
  )
}

// Barre de score value/max avec couleur.
function Meter({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  return (
    <View style={{ marginBottom: 5 }}>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <Text style={{ color: MUTED, fontSize: 8.5 }}>{label}</Text>
        <Text style={{ fontSize: 8.5 }}>
          {value}/{max}
        </Text>
      </View>
      <View style={s.barTrack}>
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
            width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`,
          }}
        />
      </View>
    </View>
  )
}

// Bloc de score encadré (Maturité / Risque / Faisabilité).
function ScoreBox({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: number
  sub: string
  color: string
}) {
  return (
    <View style={[s.card, { flexGrow: 1, width: "31%" }]}>
      <Text style={{ fontSize: 8, color: MUTED }}>{label}</Text>
      <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color }}>
        {value}
        <Text style={{ fontSize: 9, color: MUTED }}>/100</Text>
      </Text>
      <Text style={{ fontSize: 7.5, color: MUTED }}>{sub}</Text>
    </View>
  )
}

export function ReportDocument({ data }: { data: ReportData }) {
  // Couleur de la bannière = feu tricolore selon le score (vert / jaune / rouge).
  const vHex = scoreTrafficHex(data.scoreTotal)
  const scPct = (data.scoreTotal / 18) * 100
  const scLabel =
    scPct >= 66
      ? "Score favorable"
      : scPct >= 40
        ? "Score à surveiller"
        : "Score défavorable"
  const an = data.analysis
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* En-tête */}
        <Text style={s.h1}>Rapport de pré-cadrage IA — {data.projectName}</Text>
        <Text style={s.meta}>
          {data.direction ? `${data.direction}  ·  ` : ""}Date : {data.date}
          {"  ·  "}Chef de projet : {data.userName}
        </Text>

        {/* Bannière décision */}
        <View style={[s.banner, { borderColor: vHex }]}>
          <View style={{ flexGrow: 1, paddingRight: 10 }}>
            <Text style={{ fontSize: 8, color: MUTED }}>Décision recommandée</Text>
            <Text style={[s.verdictBig, { color: vHex }]}>{data.verdictLabel}</Text>
            <Text style={{ color: INK, marginTop: 2 }}>{data.verdictMeaning}</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: vHex }}>
              {data.scoreTotal}
              <Text style={{ fontSize: 11, color: MUTED }}>/18</Text>
            </Text>
            <Text style={{ fontSize: 7.5, color: vHex, fontFamily: "Helvetica-Bold" }}>
              {scLabel}
            </Text>
          </View>
        </View>

        {/* Contexte du projet */}
        <View style={s.section}>
          <Text style={s.h2}>Contexte du projet</Text>
          {data.description ? (
            <Text style={s.para}>{data.description}</Text>
          ) : null}
          {data.context?.summary ? (
            <Text style={[s.para, { marginTop: data.description ? 4 : 0 }]}>
              {data.context.summary}
            </Text>
          ) : null}
          {data.context ? (
            <View style={{ marginTop: 4 }}>
              <Inline label="Données identifiées" items={data.context.dataPoints} />
              <Inline label="Enjeux" items={data.context.stakes} />
            </View>
          ) : null}
          {!data.description && !data.context ? (
            <Text style={{ color: MUTED }}>
              Aucun document de contexte n&apos;a été fourni : l&apos;analyse se
              fonde sur les réponses au questionnaire.
            </Text>
          ) : null}
        </View>

        {/* Besoin reformulé & diagnostic métier — Atelier 1 */}
        <View style={s.section}>
          <Text style={s.h2}>Besoin reformulé & diagnostic métier</Text>
          <Text style={s.para}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Besoin : </Text>
            {an.diagnostic.need}
          </Text>
          {an.diagnostic.processes ? (
            <Text style={s.para}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>
                Processus actuel :{" "}
              </Text>
              <Text style={{ color: MUTED }}>{an.diagnostic.processes}</Text>
            </Text>
          ) : null}
          <Inline label="Gains visés" items={an.diagnostic.gains} />
          <Inline label="Acteurs concernés" items={an.diagnostic.actors} />
          <Inline label="Enjeux" items={an.diagnostic.stakes} />
        </View>

        {/* Justification */}
        <View style={s.section}>
          <Text style={s.h2}>Pourquoi cette décision</Text>
          <Text>{data.justification}</Text>
        </View>

        {/* Qualification IA vs Automatisation — Atelier 2 */}
        <View style={s.section} wrap={false}>
          <Text style={s.h2}>Qualification : IA ou automatisation ?</Text>
          <Text style={s.para}>{an.qualification.summary}</Text>
          {an.qualification.items.map((it, i) => (
            <View
              key={i}
              style={[
                s.row,
                { justifyContent: "space-between", alignItems: "center", marginTop: 3 },
              ]}
            >
              <Text style={{ fontSize: 8.5 }}>{it.capability}</Text>
              <Text style={[s.badge, { backgroundColor: QUAL_HEX[it.type] ?? PRIMARY }]}>
                {it.type}
              </Text>
            </View>
          ))}
        </View>

        {/* Évaluation + Radar côte à côte */}
        <View style={[s.section, s.row, { gap: 14 }]}>
          <View style={{ width: "55%" }}>
            <Text style={s.h2}>Évaluation (6 axes)</Text>
            {data.axes.map((a) => (
              <View key={a.label} style={{ marginBottom: 5 }}>
                <View style={[s.row, { justifyContent: "space-between" }]}>
                  <Text style={{ color: MUTED, fontSize: 8.5 }}>{a.label}</Text>
                  <Text style={{ fontSize: 8.5 }}>{a.value}/3</Text>
                </View>
                <View style={s.barTrack}>
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: PRIMARY,
                      width: `${(a.value / 3) * 100}%`,
                    }}
                  />
                </View>
              </View>
            ))}
            <View style={[s.row, { justifyContent: "space-between", marginTop: 4 }]}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Total</Text>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{data.scoreTotal}/18</Text>
            </View>
          </View>
          <View style={{ width: "45%", alignItems: "center" }}>
            <Text style={[s.h2, { alignSelf: "flex-start" }]}>Profil technologique</Text>
            <Radar data={data.affinities} />
          </View>
        </View>

        {/* Technologie */}
        {data.techLabel ? (
          <View style={s.section}>
            <Text style={s.h2}>Technologie recommandée</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{data.techLabel}</Text>
            {data.techExplanation ? (
              <Text style={{ color: MUTED }}>{data.techExplanation}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Cartographie des technologies — Atelier 5 */}
        <View style={s.section} wrap={false}>
          <Text style={s.h2}>Cartographie des technologies</Text>
          {an.techMap.map((t, i) => (
            <View key={i} style={[s.row, { marginBottom: 2 }]}>
              <Text
                style={{
                  width: 14,
                  fontFamily: "Helvetica-Bold",
                  color: t.needed ? EMERALD : "#c4c4cc",
                }}
              >
                {t.needed ? "+" : "–"}
              </Text>
              <Text style={{ flexGrow: 1, color: t.needed ? INK : MUTED }}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{t.tech}</Text>
                {" — "}
                {t.reason}
              </Text>
            </View>
          ))}
        </View>

        {/* Maturité, risque & faisabilité — Atelier 4 */}
        <View style={s.section} wrap={false}>
          <Text style={s.h2}>Maturité, risque & faisabilité</Text>
          <View style={[s.row, { gap: 8, marginBottom: 8 }]}>
            <ScoreBox
              label="Maturité"
              value={an.maturity.global}
              sub="moyenne des 5 dimensions"
              color={gaugeHex(an.maturity.global)}
            />
            <ScoreBox
              label="Risque"
              value={an.riskScore.value}
              sub={an.riskScore.level}
              color={gaugeHex(an.riskScore.value, true)}
            />
            <ScoreBox
              label="Faisabilité"
              value={an.feasibilityScore.value}
              sub={an.feasibilityScore.label}
              color={gaugeHex(an.feasibilityScore.value)}
            />
          </View>
          {an.maturity.dimensions.map((dim) => (
            <Meter
              key={dim.key}
              label={dim.label}
              value={dim.score}
              max={5}
              color={PRIMARY}
            />
          ))}
        </View>

        {/* Réglementation */}
        <View style={s.section}>
          <View style={[s.row, { justifyContent: "space-between", alignItems: "center", marginBottom: 6 }]}>
            <Text style={[s.h2, { marginBottom: 0 }]}>Obligations réglementaires</Text>
            <Text style={[s.badge, { backgroundColor: RISK_HEX[data.regulatoryLevelKey] }]}>
              Risque {data.regulatoryLevelLabel}
            </Text>
          </View>
          {/* Jauge de risque */}
          <View style={[s.row, { gap: 3, marginBottom: 8 }]}>
            {RISK_ORDER.map((lvl, i) => {
              const idx = RISK_ORDER.indexOf(data.regulatoryLevelKey)
              return (
                <View key={lvl} style={{ flexGrow: 1, alignItems: "center" }}>
                  <View
                    style={{
                      height: 5,
                      borderRadius: 3,
                      alignSelf: "stretch",
                      backgroundColor: i <= idx ? RISK_HEX[data.regulatoryLevelKey] : "#f1f1f4",
                    }}
                  />
                  <Text style={{ fontSize: 6.5, color: i === idx ? INK : MUTED, marginTop: 1 }}>
                    {RISK_LABELS[i]}
                  </Text>
                </View>
              )
            })}
          </View>
          {data.alerts.length === 0 ? (
            <Text style={{ color: MUTED }}>Aucune obligation particulière.</Text>
          ) : (
            data.alerts.map((al, i) => (
              <View key={i} style={s.alert}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.5 }}>
                  {al.framework}
                  {al.article ? ` · ${al.article}` : ""}
                  {al.deadline ? `  (${al.deadline})` : ""}
                </Text>
                <Text>{al.obligation}</Text>
                <Text style={{ color: MUTED }}>→ {al.action}</Text>
              </View>
            ))
          )}
        </View>

        {/* Gouvernance & conformité — Atelier 6 */}
        <View style={s.section} wrap={false}>
          <Text style={s.h2}>Gouvernance & conformité</Text>
          {an.governance.map((g, i) => (
            <View key={i} style={[s.row, { marginBottom: 3 }]}>
              <Text
                style={[
                  s.badge,
                  {
                    backgroundColor: GOV_HEX[g.status] ?? MUTED,
                    width: 18,
                    textAlign: "center",
                    marginRight: 6,
                  },
                ]}
              >
                {GOV_MARK[g.status] ?? "•"}
              </Text>
              <Text style={{ flexGrow: 1 }}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{g.label}. </Text>
                <Text style={{ color: MUTED }}>{g.note}</Text>
              </Text>
            </View>
          ))}
        </View>

        {/* Feuille de route — roadmap */}
        <View style={s.section} wrap={false}>
          <Text style={s.h2}>Feuille de route</Text>
          {an.roadmap.map((p, i) => (
            <View key={i} style={[s.row, { marginBottom: 3 }]}>
              <Text style={{ width: 64, color: MUTED, fontSize: 8 }}>
                {p.duration}
              </Text>
              <Text style={{ flexGrow: 1 }}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{p.phase} : </Text>
                <Text style={{ color: MUTED }}>{p.items.join(" · ")}</Text>
              </Text>
            </View>
          ))}
        </View>

        {/* Prochaines étapes */}
        <View style={s.section}>
          <Text style={s.h2}>Prochaines étapes</Text>
          {data.steps.map((step, i) => (
            <Text key={i} style={s.para}>
              {i + 1}. {step}
            </Text>
          ))}
        </View>

        {/* Recommandations */}
        <View style={s.section} wrap={false}>
          <Text style={s.h2}>Recommandations</Text>
          {an.recommendations.map((r, i) => (
            <Text key={i} style={s.para}>
              • {r}
            </Text>
          ))}
        </View>

        {/* Analyse fournisseur */}
        {data.vendor ? (
          <View style={s.section} wrap={false}>
            <Text style={s.h2}>Analyse fournisseur — {data.vendor.documentName}</Text>
            <Text style={s.para}>
              Adéquation : {data.vendor.fitScore}/5  ·  Fiabilité/maturité :{" "}
              {data.vendor.maturityScore}/20  ·  Recommandation :{" "}
              {data.vendor.recommendationLabel}
            </Text>
            {data.vendor.solutionSummary ? (
              <Text style={[s.para, { color: MUTED }]}>
                Solution : {data.vendor.solutionSummary}
              </Text>
            ) : null}
            {data.vendor.relevance ? (
              <Text style={[s.para, { color: MUTED }]}>
                Pertinence : {data.vendor.relevance}
              </Text>
            ) : null}
            {data.vendor.fitJustification ? (
              <Text style={[s.para, { color: MUTED }]}>{data.vendor.fitJustification}</Text>
            ) : null}
            {data.vendor.questions.length > 0 ? (
              <View style={{ marginTop: 4 }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.5, marginBottom: 2 }}>
                  Questions à poser au fournisseur :
                </Text>
                {data.vendor.questions.slice(0, 5).map((q, i) => (
                  <Text key={i} style={s.para}>
                    {i + 1}. {q.question}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <Text style={s.footer} fixed>
          Généré par AI Pré-Cadrage · Document interne d&apos;aide à la décision
        </Text>
      </Page>
    </Document>
  )
}
