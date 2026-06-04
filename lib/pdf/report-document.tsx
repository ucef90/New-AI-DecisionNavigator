import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#18181b",
    lineHeight: 1.5,
  },
  h1: { fontSize: 17, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  meta: { fontSize: 9, color: "#71717a", marginBottom: 10 },
  h2: {
    fontSize: 11.5,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    marginTop: 13,
    marginBottom: 3,
  },
  para: { marginBottom: 3 },
  bullet: { marginBottom: 2, paddingLeft: 12 },
  badge: { fontFamily: "Helvetica-Bold", fontSize: 12, marginBottom: 3 },
  footer: {
    position: "absolute",
    bottom: 26,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#a1a1aa",
    textAlign: "center",
    borderTop: "1 solid #e4e4e7",
    paddingTop: 6,
  },
})

// Rend le gras inline (**texte**) dans une ligne.
function inline(text: string, key: number) {
  const parts = text.split(/\*\*/)
  return (
    <Text key={key}>
      {parts.map((p, i) => (
        <Text key={i} style={i % 2 === 1 ? styles.badge : undefined}>
          {p}
        </Text>
      ))}
    </Text>
  )
}

function renderMarkdown(md: string) {
  const lines = md.replace(/\r/g, "").split("\n")
  const out: React.ReactNode[] = []

  lines.forEach((raw, i) => {
    const line = raw.trimEnd()
    if (line.startsWith("# ")) {
      out.push(
        <Text key={i} style={styles.h1}>
          {line.slice(2)}
        </Text>,
      )
    } else if (line.startsWith("## ")) {
      out.push(
        <Text key={i} style={styles.h2}>
          {line.slice(3)}
        </Text>,
      )
    } else if (line.startsWith("**Date")) {
      out.push(
        <Text key={i} style={styles.meta}>
          {line.replace(/\*\*/g, "")}
        </Text>,
      )
    } else if (line.startsWith("- ")) {
      out.push(
        <View key={i} style={styles.bullet}>
          {inline(`• ${line.slice(2)}`, i)}
        </View>,
      )
    } else if (/^\d+\.\s/.test(line)) {
      out.push(
        <View key={i} style={styles.bullet}>
          {inline(line, i)}
        </View>,
      )
    } else if (line === "") {
      out.push(<View key={i} style={{ height: 4 }} />)
    } else {
      out.push(
        <View key={i} style={styles.para}>
          {inline(line, i)}
        </View>,
      )
    }
  })

  return out
}

export function ReportDocument({ markdown }: { markdown: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {renderMarkdown(markdown)}
        <Text style={styles.footer} fixed>
          Généré par AI Pré-Cadrage · Document interne d'aide à la décision
        </Text>
      </Page>
    </Document>
  )
}
