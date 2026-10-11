import { cookies } from "next/headers";
import type { MeResponse } from "@/types/auth";

// Appels depuis les composants serveur : le backend est joint en direct (API_URL,
// reseau interne) avec les cookies de la requete du navigateur.
const API_URL = process.env.API_URL ?? "http://localhost:8080";

async function appeler(chemin: string): Promise<Response> {
  const magasin = await cookies();
  const cookie = magasin
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  return fetch(`${API_URL}${chemin}`, { headers: { Cookie: cookie }, cache: "no-store" });
}

/** GET authentifie ; null si le backend refuse (401, 403, 404) ou echoue. */
export async function lireServeur<T>(chemin: string): Promise<T | null> {
  const reponse = await appeler(chemin);
  return reponse.ok ? ((await reponse.json()) as T) : null;
}

/** Vrai si le backend autorise l'acces a cette ressource. */
export async function accesServeur(chemin: string): Promise<boolean> {
  return (await appeler(chemin)).ok;
}

export function lireMoi(): Promise<MeResponse | null> {
  return lireServeur<MeResponse>("/api/auth/me");
}
