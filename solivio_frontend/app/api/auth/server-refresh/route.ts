import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

/**
 * Route Handler de refresh cote serveur.
 * Invoque par le proxy (proxy.ts) quand access_token est absent mais refresh_token present.
 * Seul endroit de l'App Router ou on peut ecrire des cookies (pas possible dans un Server Component).
 *
 * Flux :
 *   1. Lit le refresh_token depuis les cookies de la requete entrante.
 *   2. Appelle le backend /api/auth/refresh avec ce token.
 *   3. Repercute les Set-Cookie du backend (nouveaux access_token et refresh_token).
 *   4. Redirige vers la page d'origine (returnTo).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const raw = searchParams.get("returnTo") ?? "/dashboard";
  // Protection contre les redirections ouvertes : chemin relatif uniquement.
  const returnTo =
    raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("://")
      ? raw
      : "/dashboard";

  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (!refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `refresh_token=${refreshToken}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!backendRes.ok) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const redirect = NextResponse.redirect(new URL(returnTo, request.url));

  // Repercuter les Set-Cookie du backend vers le navigateur.
  const setCookies = backendRes.headers.getSetCookie();
  for (const value of setCookies) {
    redirect.headers.append("Set-Cookie", value);
  }

  return redirect;
}
