import { cookies } from "next/headers";
import type { MeResponse } from "@/types/auth";
import type { DistributionResponse } from "@/types/distribution";
import { estGestionnaireDistribution } from "@/lib/droits-distribution";
import { distributionsDuJour, jourAssociation, type InscriptionDuMembre } from "@/lib/distribution-du-jour";
import { engagements, type Engagement } from "@/lib/engagements";
import type { MissionCollecteResponse } from "@/types/collecte";
import type { EvenementResponse, ParticipationEvenementResponse } from "@/types/evenement";
import type { InscriptionReconditionnementResponse } from "@/types/reconditionnement";

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

/**
 * Distributions du jour du membre : toutes pour un gestionnaire, celles ou il est
 * benevole confirme sinon. Un beneficiaire ne pointe pas : liste vide.
 */
export async function lireDistributionsDuJour(
  roles: string[],
  maintenant = new Date(),
): Promise<DistributionResponse[]> {
  const gestionnaire = estGestionnaireDistribution(roles);
  if (!gestionnaire && !roles.includes("benevole")) return [];
  const [distributions, inscriptions] = await Promise.all([
    lireServeur<DistributionResponse[]>("/api/distributions"),
    gestionnaire ? null : lireServeur<InscriptionDuMembre[]>("/api/inscriptions/mes"),
  ]);
  return distributionsDuJour(distributions ?? [], jourAssociation(maintenant), gestionnaire, inscriptions ?? []);
}

/**
 * Engagements du membre hors distributions. Un role sans acces a une source
 * (missions reservees aux benevoles) la recoit vide.
 */
export async function lireEngagements(maintenant = new Date()): Promise<Engagement[]> {
  const [missions, participations, evenements, sessions] = await Promise.all([
    lireServeur<MissionCollecteResponse[]>("/api/missions-collecte/mes-missions"),
    lireServeur<ParticipationEvenementResponse[]>("/api/evenements/mes-evenements"),
    lireServeur<EvenementResponse[]>("/api/evenements"),
    lireServeur<InscriptionReconditionnementResponse[]>("/api/sessions-reconditionnement/mes-inscriptions"),
  ]);
  return engagements({ missions, participations, evenements, sessions }, maintenant);
}
