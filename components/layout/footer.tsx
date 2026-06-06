/**
 * Pied de page global — mention de copyright de l'éditeur.
 * Présent sous toutes les pages (rendu après <main> dans le layout racine).
 */
export function Footer() {
  return (
    <footer className="border-t border-border/60 py-6">
      <div className="mx-auto max-w-6xl px-6 text-center text-xs text-muted-foreground">
        © 2026 Beyond Expertise — éditeur logiciel. All rights reserved.
      </div>
    </footer>
  )
}
