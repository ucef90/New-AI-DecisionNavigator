"use client"

import { SignOut } from "@phosphor-icons/react/dist/ssr"

import { logout } from "@/app/auth/actions"

export function SignOutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        title="Se déconnecter"
        aria-label="Se déconnecter"
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <SignOut className="size-[18px]" aria-hidden />
      </button>
    </form>
  )
}
