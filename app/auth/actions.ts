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
 *
 * Amorçage du 1er administrateur (utile en production sur base vierge) :
 *  - si le compte ADMIN_EMAIL n'existe pas, il est CRÉÉ au premier login avec
 *    ADMIN_PASSWORD ;
 *  - s'il existe mais sans mot de passe, ADMIN_PASSWORD le définit.
 * ADMIN_EMAIL défaut "chef.projet@cd93.fr", ADMIN_PASSWORD défaut "admin".
 */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = (formData.get("email")?.toString() ?? "").trim().toLowerCase()
  const password = formData.get("password")?.toString() ?? ""
  if (!email || !password) return { error: "Email et mot de passe requis." }

  const adminEmail = (
    process.env.ADMIN_EMAIL ?? "chef.projet@cd93.fr"
  ).toLowerCase()
  const bootstrapPwd = process.env.ADMIN_PASSWORD ?? "admin"

  let user = await db.user.findUnique({ where: { email } })

  if (!user) {
    // Aucun compte : amorçage autorisé uniquement pour l'admin configuré.
    if (email === adminEmail && password === bootstrapPwd) {
      user = await db.user.create({
        data: {
          email,
          name: "Administrateur",
          role: "ADMIN",
          passwordHash: hashPassword(password),
        },
      })
    } else {
      return { error: "Identifiants invalides." }
    }
  } else {
    let ok = false
    if (user.passwordHash) {
      ok = verifyPassword(password, user.passwordHash)
    } else if (password === bootstrapPwd) {
      // Compte préexistant sans mot de passe → on le définit.
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(password) },
      })
      ok = true
    }
    if (!ok) return { error: "Identifiants invalides." }
  }

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
