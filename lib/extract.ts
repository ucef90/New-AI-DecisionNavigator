import { PDFParse } from "pdf-parse"

// Extraction du texte d'un document importé (PDF texte, Word .docx, texte brut).
// Pas d'OCR : un PDF scanné (image) est détecté et signalé, pas deviné.
// Exécuté côté serveur uniquement (Server Actions).

export interface ExtractResult {
  ok: boolean
  text: string
  reason?: string // message d'erreur si ok = false
}

const MIN_USEFUL = 20 // en-dessous, on considère qu'il n'y a pas de texte exploitable
const MAX_OCR_PAGES = 15 // borne l'OCR pour éviter des temps de traitement excessifs

export async function extractText(file: File): Promise<ExtractResult> {
  const name = file.name.toLowerCase()
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    // --- PDF ---
    if (file.type === "application/pdf" || name.endsWith(".pdf")) {
      const parser = new PDFParse({ data: new Uint8Array(buffer) })
      const text = ((await parser.getText()).text ?? "").trim()
      if (text.length >= MIN_USEFUL) return { ok: true, text }

      // Pas de couche texte → PDF probablement scanné : OCR local (tesseract).
      const ocr = (await ocrPdf(buffer)).trim()
      if (ocr.length >= MIN_USEFUL) return { ok: true, text: ocr }

      return {
        ok: false,
        text: "",
        reason:
          "Ce PDF ne contient pas de texte et l'OCR n'a rien pu en extraire (scan vierge, illisible ou trop dégradé). Fournis un PDF avec texte sélectionnable, un Word (.docx), ou colle le contenu.",
      }
    }

    // --- Word .docx ---
    if (
      name.endsWith(".docx") ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammoth = (await import("mammoth")).default
      const { value } = await mammoth.extractRawText({ buffer })
      const text = (value ?? "").trim()
      if (text.length < MIN_USEFUL) {
        return { ok: false, text: "", reason: "Document Word vide ou illisible." }
      }
      return { ok: true, text }
    }

    // --- Ancien .doc (binaire) : non pris en charge ---
    if (name.endsWith(".doc") || file.type === "application/msword") {
      return {
        ok: false,
        text: "",
        reason:
          "L'ancien format .doc n'est pas pris en charge. Convertis le document en .docx ou en PDF.",
      }
    }

    // --- Texte brut (txt, md, csv…) ---
    const text = buffer.toString("utf-8").trim()
    if (text.length < MIN_USEFUL) {
      return { ok: false, text: "", reason: "Fichier vide ou trop court." }
    }
    return { ok: true, text }
  } catch (e) {
    return {
      ok: false,
      text: "",
      reason: `Impossible de lire le document : ${e instanceof Error ? e.message : "erreur inconnue"}.`,
    }
  }
}

// OCR local d'un PDF scanné : rend chaque page en image (via pdf-parse +
// @napi-rs/canvas, déjà embarqués) puis reconnaît le texte avec tesseract.js.
// 100 % sur le serveur — aucune donnée n'en sort.
//
// Les modèles de langue tesseract (fra+eng) sont téléchargés une fois puis mis
// en cache. Pour un VPS hors-ligne, pointer TESSERACT_LANG_PATH vers un dossier
// contenant les .traineddata (et TESSERACT_CACHE_PATH pour le cache).
async function ocrPdf(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    const shots = await parser.getScreenshot({
      first: MAX_OCR_PAGES,
      scale: 2, // ~2x : meilleure lisibilité pour l'OCR
      imageBuffer: true,
    })
    if (!shots.pages.length) return ""

    const { createWorker } = await import("tesseract.js")
    const worker = await createWorker(["fra", "eng"], undefined, {
      langPath: process.env.TESSERACT_LANG_PATH || undefined,
      cachePath: process.env.TESSERACT_CACHE_PATH || undefined,
    })

    try {
      const parts: string[] = []
      for (const page of shots.pages) {
        if (!page.data?.length) continue
        const { data } = await worker.recognize(Buffer.from(page.data))
        const t = data.text?.trim()
        if (t) parts.push(t)
      }
      return parts.join("\n\n")
    } finally {
      await worker.terminate()
    }
  } catch (e) {
    console.error("[extract] OCR PDF échoué :", e)
    return ""
  }
}
