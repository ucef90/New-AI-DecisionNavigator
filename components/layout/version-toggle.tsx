"use client"

import { usePathname, useRouter } from "next/navigation"

import { cn } from "@/lib/utils"

// Bascule V1 / V2 du cadrage, affichée dans la navbar à côté du thème.
// - Sur une page projet : envoie vers le cadrage V1 (parcours) ou V2 (framework).
// - Ailleurs : V1 → dashboard, V2 → page Méthode.
export function VersionToggle() {
  const pathname = usePathname()
  const router = useRouter()

  const projectId = pathname.match(/^\/projects\/([^/]+)/)?.[1]
  const active: "v1" | "v2" = pathname.includes("/cadrage-v2") ? "v2" : "v1"

  function go(v: "v1" | "v2") {
    if (projectId) {
      router.push(
        `/projects/${projectId}/${v === "v2" ? "cadrage-v2" : "wizard"}`,
      )
    } else {
      router.push(v === "v2" ? "/methode" : "/dashboard")
    }
  }

  const base =
    "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors"

  return (
    <div
      role="group"
      aria-label="Version du cadrage"
      title="Choisir la version du cadrage (V1 ancienne · V2 nouvelle)"
      className="flex items-center gap-0.5 rounded-xl border border-foreground/15 p-0.5"
    >
      <button
        type="button"
        onClick={() => go("v1")}
        aria-pressed={active === "v1"}
        className={cn(
          base,
          active === "v1"
            ? "bg-foreground/10 text-foreground"
            : "text-foreground/55 hover:text-foreground",
        )}
      >
        V1
      </button>
      <button
        type="button"
        onClick={() => go("v2")}
        aria-pressed={active === "v2"}
        className={cn(
          base,
          active === "v2"
            ? "bg-[#0084FF] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
            : "text-foreground/55 hover:text-foreground",
        )}
      >
        V2
      </button>
    </div>
  )
}
