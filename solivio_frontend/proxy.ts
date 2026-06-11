import { NextRequest, NextResponse } from "next/server";

const AUTH_PATHS = ["/login", "/register", "/verify-email", "/forgot-password", "/reset-password"];

// Toute route qui n'est pas une page d'auth et n'est pas la racine "/" est protegee.
// Pas de liste explicite : chaque nouvelle page protegee est couverte automatiquement.
function isProtectedPath(pathname: string): boolean {
  if (pathname === "/") return false;
  return !AUTH_PATHS.some((p) => pathname.startsWith(p));
}

/**
 * proxy.ts - Next.js 16 (remplace middleware.ts).
 * Runtime : Node.js uniquement (Edge n'est pas supporte).
 *
 * Protection des routes :
 * - access_token absent + refresh_token present sur une route protegee
 *   -> refresh cote serveur via /api/auth/server-refresh (seul endroit ou on peut ecrire des cookies)
 * - access_token absent + refresh_token absent -> redirection vers /login
 * - token present + page d'auth -> redirection vers /dashboard
 *
 * La validite du token est verifiee cote backend (via /api/auth/me dans le ProtectedLayout).
 * Ici on ne controle que la presence des cookies pour eviter un aller-retour inutile.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasAccessToken = request.cookies.has("access_token");
  const hasRefreshToken = request.cookies.has("refresh_token");

  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtectedPath(pathname) && !hasAccessToken) {
    if (hasRefreshToken) {
      // access_token expire mais refresh_token toujours valide : rafraichissement cote serveur.
      const refreshUrl = request.nextUrl.clone();
      refreshUrl.pathname = "/api/auth/server-refresh";
      refreshUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(refreshUrl);
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && hasAccessToken) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.searchParams.delete("redirect");
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|images/|logo\\.svg).*)",
  ],
};
