import { apiGet, apiFetch } from "@/lib/api";
import type {
  AssociationResponse,
  UpdateAssociationPayload,
  MembreResponse,
  UpdateRoleMembrePayload,
  StatistiqueDistributionResponse,
  StatistiquePeriodeResponse,
} from "@/types/association";

export function lireAssociation(): Promise<AssociationResponse> {
  return apiGet<AssociationResponse>("/api/association");
}

export function mettreAJourAssociation(
  payload: UpdateAssociationPayload
): Promise<AssociationResponse> {
  return apiFetch<AssociationResponse>("/api/association", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function listerMembres(): Promise<MembreResponse[]> {
  return apiGet<MembreResponse[]>("/api/association/membres");
}

export function mettreAJourRoleMembre(
  compteId: string,
  payload: UpdateRoleMembrePayload
): Promise<MembreResponse> {
  return apiFetch<MembreResponse>(`/api/association/membres/${compteId}/role`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function supprimerMembre(compteId: string): Promise<void> {
  return apiFetch<void>(`/api/association/membres/${compteId}`, {
    method: "DELETE",
  });
}

export function statsDistribution(
  id: string
): Promise<StatistiqueDistributionResponse> {
  return apiGet<StatistiqueDistributionResponse>(`/api/statistiques/distributions/${id}`);
}

export function listeStatsDistributions(
  debut: string,
  fin: string
): Promise<StatistiqueDistributionResponse[]> {
  return apiGet<StatistiqueDistributionResponse[]>(
    `/api/statistiques/distributions?debut=${debut}&fin=${fin}`
  );
}

export function statsPeriode(
  debut: string,
  fin: string
): Promise<StatistiquePeriodeResponse> {
  return apiGet<StatistiquePeriodeResponse>(
    `/api/statistiques/periode?debut=${debut}&fin=${fin}`
  );
}
