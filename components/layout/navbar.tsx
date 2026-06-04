"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SquaresFour,
  Plus,
  GearSix,
} from "@phosphor-icons/react/dist/ssr"

import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/layout/theme-toggle"

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "AI Pré-Cadrage"

const links = [
  { href: "/dashboard", label: "Tableau de bord", icon: SquaresFour },
  { href: "/projects/new", label: "Nouveau projet", icon: Plus },
  { href: "/settings", label: "Paramètres", icon: GearSix },
]

export function Navbar() {
  const pathname = usePathname()

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
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href))
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

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
