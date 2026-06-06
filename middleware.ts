import { NextResponse, type NextRequest } from "next/server"

import { SESSION_COOKIE } from "@/lib/auth/constants"

/**
 * Garde d'accès (Edge) : contrôle de PRÉSENCE du cookie de session sur les
 * routes protégées (UX — évite d'afficher une page protégée sans session).
 * La vérification AUTORITAIRE (signature + expiration) se fait côté serveur
 * via requireUser() — le middleware Edge n'a pas accès à node:crypto.
 */
export function middleware(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value)
  if (hasSession) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = "/auth/signin"
  url.searchParams.set("from", req.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/settings/:path*",
    "/knowledge/:path*",
  ],
}
