import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { User } from "@prisma/client"

import { db } from "@/lib/db"
import { SESSION_COOKIE, verifySession, type Role } from "@/lib/auth/session"

/** Session courante (validée) ou null. */
export async function getSession() {
  return verifySession(cookies().get(SESSION_COOKIE)?.value)
}

/** Utilisateur courant (DB) ou null. */
export async function getCurrentUser(): Promise<User | null> {
  const s = await getSession()
  if (!s) return null
  return db.user.findUnique({ where: { id: s.uid } })
}

/** Exige une session valide ; sinon redirige vers la connexion. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/signin")
  return user
}

/**
 * Exige un rôle (ADMIN passe partout). Redirige vers l'accueil si insuffisant.
 */
export async function requireRole(role: Role): Promise<User> {
  const user = await requireUser()
  if (user.role !== "ADMIN" && user.role !== role) redirect("/")
  return user
}

/**
 * Compat : id de l'utilisateur courant. Exige désormais une session
 * (redirige vers la connexion si absente) — remplace l'ancien mono-utilisateur.
 */
export async function getCurrentUserId(): Promise<string> {
  const user = await requireUser()
  return user.id
}
