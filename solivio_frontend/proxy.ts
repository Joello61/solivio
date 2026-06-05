import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/tenant-select", "/change-password"];
const AUTH_PATHS = ["/login", "/register", "/verify-email", "/forgot-password", "/reset-password"];

/**
 * proxy.ts - Next.js 16 (remplace middleware.ts).
 * Runtime : Node.js uniquement (Edge n'est pas supporte).
 *
 * Protection des routes :
 * - Si l'utilisateur n'a pas de cookie access_token et accede a une route protegee
 *   -> redirection vers /login
 * - Si l'utilisateur a un token et accede a une page d'auth (login, register...)
 *   -> redirection vers /dashboard
 *
 * La validite du token est verifiee cote backend (via /api/auth/me).
 * Ici on ne fait qu'un controle de presence du cookie pour eviter un appel reseau
 * sur chaque requete (le backend rejettera les tokens expires avec un 401).
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has("access_token");

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !hasToken) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && hasToken) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.searchParams.delete("redirect");
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
