import { ComingSoon } from "@/components/layout/coming-soon"

export const metadata = { title: "Connexion" }

export default function SignInPage() {
  return (
    <ComingSoon
      title="Connexion"
      session={2}
      description="L'authentification (NextAuth / Auth.js) sera intégrée en Session 2."
    />
  )
}
