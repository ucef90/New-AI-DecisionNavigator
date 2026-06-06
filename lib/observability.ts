/**
 * Journalisation structurée (une ligne JSON par événement) — facile à ingérer
 * par un agrégateur de logs. Évolutif vers un puits externe si besoin.
 */
export function logEvent(event: string, data: Record<string, unknown> = {}) {
  try {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ t: new Date().toISOString(), event, ...data }))
  } catch {
    // jamais d'exception depuis la journalisation
  }
}
