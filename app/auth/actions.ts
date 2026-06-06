"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { db } from "@/lib/db"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  signSession,
  type Role,
} from "@/lib/auth/session"

export interface LoginState {
  error?: string
}

/**
 * Connexion par email + mot de passe.
 * Amorçage on-premise : si l'utilisateur n'a pas encore de mot de passe, le
 * premier login avec ADMIN_PASSWORD (défaut "admin") le définit.
 */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = (formData.get("email")?.toString() ?? "").trim().toLowerCase()
  const password = formData.get("password")?.toString() ?? ""
  if (!email || !password) return { error: "Email et mot de passe requis." }

  const user = await db.user.findUnique({ where: { email } })
  if (!user) return { error: "Identifiants invalides." }

  let ok = false
  if (user.passwordHash) {
    ok = verifyPassword(password, user.passwordHash)
  } else {
    // Amorçage : aucun mot de passe encore défini pour ce compte.
    const bootstrap = process.env.ADMIN_PASSWORD ?? "admin"
    if (password === bootstrap) {
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(password) },
      })
      ok = true
    }
  }
  if (!ok) return { error: "Identifiants invalides." }

  const token = signSession({
    uid: user.id,
    role: user.role as Role,
    exp: Date.now() + SESSION_TTL_MS,
  })
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  })
  redirect("/dashboard")
}

/** Déconnexion : supprime le cookie de session. */
export async function logout(): Promise<void> {
  cookies().delete(SESSION_COOKIE)
  redirect("/auth/signin")
}
