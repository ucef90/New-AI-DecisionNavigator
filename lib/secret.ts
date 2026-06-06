import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto"

/**
 * Chiffrement symétrique des secrets stockés (clés API en base).
 * AES-256-GCM, clé dérivée d'AUTH_SECRET (ou SETTINGS_SECRET) par scrypt.
 * Format : `enc:1:<ivB64>:<tagB64>:<cipherB64>`.
 *
 * `decryptSecret` est rétro-compatible : une valeur NON préfixée est rendue
 * telle quelle (valeurs d'environnement en clair, anciens enregistrements).
 */
const PREFIX = "enc:1:"

function key(): Buffer {
  const secret =
    process.env.SETTINGS_SECRET ||
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV === "production" ? "" : "dev-insecure-secret-change-me")
  if (!secret) {
    throw new Error(
      "AUTH_SECRET (ou SETTINGS_SECRET) requis pour chiffrer les secrets en production.",
    )
  }
  return scryptSync(secret, "precadrage-settings-v1", 32)
}

export function isEncrypted(value?: string | null): boolean {
  return !!value && value.startsWith(PREFIX)
}

export function encryptSecret(plain: string): string {
  if (!plain) return ""
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`
}

export function decryptSecret(stored?: string | null): string {
  if (!stored) return ""
  if (!stored.startsWith(PREFIX)) return stored // clair (env / legacy)
  try {
    const [ivB64, tagB64, dataB64] = stored.slice(PREFIX.length).split(":")
    if (!ivB64 || !tagB64 || !dataB64) return ""
    const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"))
    d.setAuthTag(Buffer.from(tagB64, "base64"))
    const dec = Buffer.concat([
      d.update(Buffer.from(dataB64, "base64")),
      d.final(),
    ])
    return dec.toString("utf8")
  } catch {
    return ""
  }
}
