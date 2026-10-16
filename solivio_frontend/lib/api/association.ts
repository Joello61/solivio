import { apiFetch, apiFetchRaw, apiPost, apiTelecharger } from "@/lib/api";
import type {
  AssociationResponse,
  UpdateAssociationPayload,
  MembreResponse,
  UpdateRolesMembrePayload,
  InviterMembrePayload,
  StatistiqueDistributionResponse,
} from "@/types/association";

export function mettreAJourAssociation(
  payload: UpdateAssociationPayload
): Promise<AssociationResponse> {
  return apiFetch<AssociationResponse>("/api/association", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function uploadLogo(file: File): Promise<AssociationResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiFetchRaw<AssociationResponse>("/api/association/logo", {
    method: "POST",
    body: form,
  });
}

export function mettreAJourRolesMembre(
  compteId: string,
  payload: UpdateRolesMembrePayload
): Promise<MembreResponse> {
  return apiFetch<MembreResponse>(`/api/association/membres/${compteId}/roles`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function supprimerMembre(compteId: string): Promise<void> {
  return apiFetch<void>(`/api/association/membres/${compteId}`, {
    method: "DELETE",
  });
}

export function changerStatutMembre(
  compteId: string,
  statut: "actif" | "suspendu"
): Promise<MembreResponse> {
  return apiFetch<MembreResponse>(`/api/association/membres/${compteId}/statut`, {
    method: "PATCH",
    body: JSON.stringify({ statut }),
  });
}

export function inviterMembre(payload: InviterMembrePayload): Promise<void> {
  return apiPost<void>("/api/invitations", payload);
}

export function exporterDonnees(): Promise<Blob> {
  return apiTelecharger("/api/association/export");
}

export function recalculerStatistiques(distributionId: string): Promise<StatistiqueDistributionResponse> {
  return apiPost<StatistiqueDistributionResponse>(`/api/statistiques/distributions/${distributionId}/recalculer`, {});
}
