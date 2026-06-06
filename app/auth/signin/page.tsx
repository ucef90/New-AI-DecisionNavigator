import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth"
import { SignInForm } from "@/components/auth/signin-form"

export const metadata = { title: "Connexion" }

export default async function SignInPage() {
  // Déjà connecté → on évite d'afficher le formulaire.
  const user = await getCurrentUser()
  if (user) redirect("/dashboard")
  return <SignInForm />
}
