import { db } from "@/lib/db"

/**
 * Utilisateur courant — mode mono-utilisateur en attendant NextAuth (Session ultérieure).
 * Renvoie l'id d'un utilisateur par défaut, créé au besoin.
 */
export async function getCurrentUserId(): Promise<string> {
  const user = await db.user.upsert({
    where: { email: "chef.projet@cd93.fr" },
    update: {},
    create: {
      id: "demo-user",
      email: "chef.projet@cd93.fr",
      name: "Chef de projet (démo)",
      role: "ADMIN",
    },
  })
  return user.id
}
