import { Fragment } from "react"

// Rendu markdown léger (titres, gras, listes) — sans dépendance.
// Suffisant pour les rapports générés (markdown structuré simple).

function renderInline(text: string) {
  // **gras**
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

export function V2Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r/g, "").split("\n")
  const blocks: React.ReactNode[] = []
  let list: string[] = []
  let ordered = false

  const flush = (key: number) => {
    if (list.length === 0) return
    const items = list
    blocks.push(
      ordered ? (
        <ol key={`l${key}`} className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          {items.map((it, i) => (
            <li key={i}>{renderInline(it)}</li>
          ))}
        </ol>
      ) : (
        <ul key={`l${key}`} className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {items.map((it, i) => (
            <li key={i}>{renderInline(it)}</li>
          ))}
        </ul>
      ),
    )
    list = []
  }

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd()
    if (line.startsWith("### ")) {
      flush(idx)
      blocks.push(<h4 key={idx} className="mt-4 text-sm font-semibold">{renderInline(line.slice(4))}</h4>)
    } else if (line.startsWith("## ")) {
      flush(idx)
      blocks.push(<h3 key={idx} className="mt-5 text-base font-semibold">{renderInline(line.slice(3))}</h3>)
    } else if (line.startsWith("# ")) {
      flush(idx)
      blocks.push(<h2 key={idx} className="mt-6 text-lg font-semibold">{renderInline(line.slice(2))}</h2>)
    } else if (/^[-*]\s+/.test(line)) {
      if (ordered) flush(idx)
      ordered = false
      list.push(line.replace(/^[-*]\s+/, ""))
    } else if (/^\d+\.\s+/.test(line)) {
      if (!ordered) flush(idx)
      ordered = true
      list.push(line.replace(/^\d+\.\s+/, ""))
    } else if (line.trim() === "") {
      flush(idx)
    } else {
      flush(idx)
      blocks.push(<p key={idx} className="text-sm leading-relaxed text-muted-foreground">{renderInline(line)}</p>)
    }
  })
  flush(lines.length)

  return <div className="space-y-2">{blocks}</div>
}
