import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto"

/**
 * Hachage de mot de passe avec scrypt (intégré à Node — aucune dépendance).
 * Format stocké : `scrypt$<saltHex>$<hashHex>`.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const derived = scryptSync(password, salt, 64)
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`
}

/** Vérifie un mot de passe contre un hash stocké (comparaison à temps constant). */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, saltHex, hashHex] = stored.split("$")
    if (scheme !== "scrypt" || !saltHex || !hashHex) return false
    const expected = Buffer.from(hashHex, "hex")
    const derived = scryptSync(password, Buffer.from(saltHex, "hex"), 64)
    return (
      expected.length === derived.length && timingSafeEqual(expected, derived)
    )
  } catch {
    return false
  }
}
