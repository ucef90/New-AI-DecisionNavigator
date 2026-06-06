/**
 * Découpe un texte en fragments (~900 caractères) avec recouvrement, en
 * respectant au mieux les frontières de paragraphes/phrases.
 */
export function chunkText(
  text: string,
  { maxChars = 900, overlap = 150 }: { maxChars?: number; overlap?: number } = {},
): string[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim()
  if (!clean) return []

  // Unités atomiques : paragraphes, puis phrases si un paragraphe est trop long.
  const paragraphs = clean.split(/\n{2,}/)
  const units: string[] = []
  for (const p of paragraphs) {
    const t = p.trim()
    if (!t) continue
    if (t.length <= maxChars) {
      units.push(t)
    } else {
      for (const s of splitSentences(t)) units.push(s)
    }
  }

  const chunks: string[] = []
  let buf = ""
  for (const u of units) {
    const piece = u.length > maxChars ? u.slice(0, maxChars) : u
    if (buf && buf.length + piece.length + 1 > maxChars) {
      chunks.push(buf)
      const tail = buf.slice(-overlap)
      buf = `${tail} ${piece}`.trim()
    } else {
      buf = buf ? `${buf}\n${piece}` : piece
    }
  }
  if (buf.trim()) chunks.push(buf.trim())
  return chunks
}

function splitSentences(t: string): string[] {
  const parts = t.split(/(?<=[.!?…])\s+(?=[A-ZÀ-Ÿ0-9])/)
  const out: string[] = []
  for (const p of parts) {
    if (p.length <= 900) out.push(p)
    else {
      // Coupe brutale en dernier recours.
      for (let i = 0; i < p.length; i += 900) out.push(p.slice(i, i + 900))
    }
  }
  return out
}
