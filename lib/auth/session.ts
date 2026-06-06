import { createHmac, timingSafeEqual } from "node:crypto"

import { SESSION_COOKIE, SESSION_TTL_MS } from "./constants"

export { SESSION_COOKIE, SESSION_TTL_MS }

export type Role = "ADMIN" | "USER"

export interface SessionPayload {
  uid: string
  role: Role
  /** Expiration (epoch ms). */
  exp: number
}

function secret(): string {
  const s = process.env.AUTH_SECRET
  if (!s) {
    // En dev on tolère un secret par défaut, mais on alerte clairement.
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET manquant en production.")
    }
    return "dev-insecure-secret-change-me"
  }
  return s
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url")
}

/** Construit un jeton signé `<payloadB64url>.<hmacB64url>`. */
export function signSession(payload: SessionPayload): string {
  const body = b64url(JSON.stringify(payload))
  const sig = b64url(createHmac("sha256", secret()).update(body).digest())
  return `${body}.${sig}`
}

/** Vérifie le jeton (signature + expiration). Renvoie le payload ou null. */
export function verifySession(token?: string | null): SessionPayload | null {
  if (!token) return null
  const dot = token.indexOf(".")
  if (dot <= 0) return null
  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = b64url(createHmac("sha256", secret()).update(body).digest())
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const p = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload
    if (!p.uid || typeof p.exp !== "number" || p.exp < Date.now()) return null
    return p
  } catch {
    return null
  }
}
