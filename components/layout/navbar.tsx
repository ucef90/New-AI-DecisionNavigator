"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { motion, useReducedMotion } from "motion/react"
import {
  SquaresFour,
  Plus,
  GearSix,
  ArrowRight,
  BookOpenText,
} from "@phosphor-icons/react/dist/ssr"

import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { SignOutButton } from "@/components/layout/sign-out-button"

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "AI Pré-Cadrage"

const links = [
  { href: "/dashboard", label: "Tableau de bord", icon: SquaresFour },
  { href: "/projects/new", label: "Nouveau projet", icon: Plus },
  { href: "/knowledge", label: "Connaissances", icon: BookOpenText },
  { href: "/settings", label: "Paramètres", icon: GearSix },
]

export function Navbar({ authed = false }: { authed?: boolean }) {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const reduce = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Sur la home : navbar "liquid glass" flottante (même forme dans les 2 thèmes,
  // verre clair en clair, verre sombre en sombre). Autres pages : barre d'origine.
  // Avant montage : variante claire (= rendu SSR) pour éviter tout mismatch.
  const isHome = pathname === "/"
  const darkHome = isHome && mounted && resolvedTheme === "dark"

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href))

  // ----- Variante "liquid glass" flottante (home, clair ou sombre) -----
  if (isHome) {
    return (
      <header
        className={cn(
          "sticky top-0 z-40 flex justify-center px-4 pb-2 pt-[22px]",
          !darkHome && "light",
        )}
      >
        {/* Lueur bleue dynamique sous la navbar : balaye gauche ↔ droite */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[58px] -z-10 flex justify-center"
        >
          <motion.div
            className="h-12 w-[300px] rounded-full bg-[#0a84ff] opacity-60 blur-[44px]"
            animate={reduce ? undefined : { x: [-120, 120] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        </div>

        <div
          className={cn(
            "flex w-fit max-w-[calc(100vw-2rem)] items-center gap-1 rounded-2xl py-1.5 pl-2 pr-1.5",
            darkHome ? "nav-glass-dark" : "nav-glass",
          )}
        >
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-xl px-1.5 py-1 font-semibold tracking-tight"
          >
            <Image
              src="/siteoff0.jpg"
              alt="Seine-Saint-Denis — Le Département"
              width={92}
              height={28}
              className="rounded-sm"
              unoptimized
              priority
            />
            <span className="hidden text-sm text-foreground sm:inline">
              {APP_NAME}
            </span>
          </Link>

          <span
            className="mx-1 hidden h-5 w-px bg-foreground/15 sm:block"
            aria-hidden
          />

          <nav className="flex items-center gap-0.5 text-sm">
            {links.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              const isCta = href === "/projects/new"
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition-colors",
                    isCta
                      ? "bg-[#0084FF] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] hover:bg-[#0a78e0]"
                      : "text-foreground/70 hover:bg-foreground/[0.08] hover:text-foreground",
                    active && !isCta && "bg-foreground/[0.1] text-foreground",
                  )}
                >
                  {isCta ? (
                    <>
                      <span className="hidden sm:inline">{label}</span>
                      <Plus className="size-[18px] sm:hidden" aria-hidden />
                      <ArrowRight
                        className="hidden size-3.5 sm:inline"
                        weight="bold"
                        aria-hidden
                      />
                    </>
                  ) : (
                    <>
                      <Icon className="size-[18px]" aria-hidden />
                      <span className="hidden sm:inline">{label}</span>
                    </>
                  )}
                </Link>
              )
            })}
          </nav>

          <span
            className="mx-1 hidden h-5 w-px bg-foreground/15 sm:block"
            aria-hidden
          />

          <ThemeToggle />
          {authed ? <SignOutButton /> : null}
        </div>
      </header>
    )
  }

  // ----- Variante d'origine (sombre / autres pages) -----
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Link
          href="/"
          className="flex items-center gap-3 font-semibold tracking-tight"
        >
          <Image
            src="/siteoff0.jpg"
            alt="Seine-Saint-Denis — Le Département"
            width={106}
            height={32}
            className="rounded-sm"
            unoptimized
            priority
          />
          <span className="hidden h-6 w-px bg-border sm:block" aria-hidden />
          <span className="hidden text-[15px] sm:inline">{APP_NAME}</span>
        </Link>

        <nav className="flex items-center gap-0.5 text-sm">
          {links.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-accent text-accent-foreground hover:bg-accent",
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          {authed ? <SignOutButton /> : null}
        </div>
      </div>
    </header>
  )
}
