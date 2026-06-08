import { readFileSync } from "node:fs"
import { join } from "node:path"

// Charge le framework méthodologique (FRAMEWORK.md) — source de vérité unique
// injectée dans tous les prompts IA de la V2. Lu une seule fois puis mis en
// cache pour la durée du process.
//
// Déploiement : FRAMEWORK.md doit être présent à la racine du projet au runtime
// (c'est le cas avec `next start`). Pour une image Docker `output: standalone`,
// copier le fichier dans l'image (voir Dockerfile).

let cached: string | null = null

const FALLBACK = `# Framework IA — 6 Socles (résumé de secours)
1. Analyse métier · 2. IA ou automatisation · 3. Questionnaire 21 dimensions ·
4. Scoring 11 axes /55 · 5. Cartographie IA · 6. Gouvernance & conformité.
Décision : NO GO (<40%) · CONDITIONNEL (40-60%) · GO POC (60-80%) · GO PRODUCTION (>=80%).`

export function getFramework(): string {
  if (cached) return cached
  try {
    cached = readFileSync(join(process.cwd(), "FRAMEWORK.md"), "utf-8")
  } catch (e) {
    console.error("[framework] FRAMEWORK.md introuvable — fallback résumé:", e)
    cached = FALLBACK
  }
  return cached
}
