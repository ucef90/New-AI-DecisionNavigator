"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "@phosphor-icons/react/dist/ssr"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Passer en clair" : "Passer en sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {/* Évite le mismatch d'hydratation : icône neutre avant montage */}
      {mounted ? (
        isDark ? (
          <Sun className="size-[18px]" aria-hidden />
        ) : (
          <Moon className="size-[18px]" aria-hidden />
        )
      ) : (
        <Sun className="size-[18px] opacity-0" aria-hidden />
      )}
    </button>
  )
}
