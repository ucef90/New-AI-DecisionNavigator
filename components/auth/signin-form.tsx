"use client"

import { useFormState, useFormStatus } from "react-dom"

import { login, type LoginState } from "@/app/auth/actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const initial: LoginState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Connexion…" : "Se connecter"}
    </Button>
  )
}

export function SignInForm() {
  const [state, formAction] = useFormState(login, initial)

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm items-center px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Connexion</CardTitle>
          <CardDescription>
            Accédez à l&apos;outil de pré-cadrage IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="vous@collectivite.fr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
