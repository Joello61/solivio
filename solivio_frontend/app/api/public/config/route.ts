import { NextResponse } from "next/server";

/**
 * GET /api/public/config
 * Proxy vers le backend Spring Boot pour exposer la clé Google Maps
 * au client (composants "use client") sans exposer l'URL du backend.
 */
export async function GET() {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";

  try {
    const res = await fetch(`${baseUrl}/api/public/config`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ googleMapsApiKey: "" }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // En cas d'erreur (backend inaccessible), on retourne une clé vide
    // plutôt qu'une erreur 500 qui casserait l'UI.
    return NextResponse.json({ googleMapsApiKey: "" }, { status: 200 });
  }
}
