import { apiGet, apiPost, apiFetch } from "@/lib/api";
import type {
  DistributionResponse,
  InscriptionResponse,
  PointageInfoResponse,
  CreateDistributionPayload,
  TypeRoleResponse,
  RoleBenevoleResponse,
  DenreeResponse,
  DotationResponse,
  SaisirDenreePayload,
} from "@/types/distribution";

export function listerDistributions(): Promise<DistributionResponse[]> {
  return apiGet<DistributionResponse[]>("/api/distributions");
}

export function detailDistribution(id: string): Promise<DistributionResponse> {
  return apiGet<DistributionResponse>(`/api/distributions/${id}`);
}

export function creerDistribution(payload: CreateDistributionPayload): Promise<DistributionResponse> {
  return apiPost<DistributionResponse>("/api/distributions", payload);
}

export function publierDistribution(id: string): Promise<DistributionResponse> {
  return apiPost<DistributionResponse>(`/api/distributions/${id}/publier`, {});
}

export function demarrerDistribution(id: string): Promise<DistributionResponse> {
  return apiPost<DistributionResponse>(`/api/distributions/${id}/demarrer`, {});
}

export function terminerDistribution(id: string): Promise<DistributionResponse> {
  return apiPost<DistributionResponse>(`/api/distributions/${id}/terminer`, {});
}

export function annulerDistribution(id: string, motif: string): Promise<DistributionResponse> {
  return apiPost<DistributionResponse>(`/api/distributions/${id}/annuler`, { motif });
}

export function listerInscrits(distributionId: string): Promise<InscriptionResponse[]> {
  return apiGet<InscriptionResponse[]>(`/api/distributions/${distributionId}/inscriptions`);
}

export function mesInscriptions(distributionId: string): Promise<InscriptionResponse[]> {
  return apiGet<InscriptionResponse[]>(`/api/distributions/${distributionId}/inscriptions/mes`);
}

export function inscrire(
  distributionId: string,
  type: string,
  creneauId?: string,
): Promise<InscriptionResponse> {
  return apiPost<InscriptionResponse>(`/api/distributions/${distributionId}/inscriptions`, {
    type,
    creneauId: creneauId ?? null,
  });
}

export function desinscrire(distributionId: string, inscriptionId: string): Promise<void> {
  return apiFetch<void>(`/api/distributions/${distributionId}/inscriptions/${inscriptionId}`, {
    method: "DELETE",
  });
}

export function rechercherPointage(distributionId: string, q: string): Promise<PointageInfoResponse[]> {
  const params = new URLSearchParams({ q });
  return apiGet<PointageInfoResponse[]>(`/api/distributions/${distributionId}/pointage?${params}`);
}

export function pointer(
  distributionId: string,
  inscriptionId: string,
  presence: string,
): Promise<InscriptionResponse> {
  return apiFetch<InscriptionResponse>(
    `/api/distributions/${distributionId}/pointage/${inscriptionId}`,
    { method: "PUT", body: JSON.stringify({ presence }) },
  );
}

// --- Repartition des denrees ---

export function listerDenrees(distributionId: string): Promise<DenreeResponse[]> {
  return apiGet<DenreeResponse[]>(`/api/distributions/${distributionId}/denrees`);
}

export function saisirDenree(
  distributionId: string,
  payload: SaisirDenreePayload,
): Promise<DenreeResponse> {
  return apiPost<DenreeResponse>(`/api/distributions/${distributionId}/denrees`, payload);
}

export function modifierDenree(
  distributionId: string,
  denreeId: string,
  payload: SaisirDenreePayload,
): Promise<DenreeResponse> {
  return apiFetch<DenreeResponse>(`/api/distributions/${distributionId}/denrees/${denreeId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function supprimerDenree(distributionId: string, denreeId: string): Promise<void> {
  return apiFetch<void>(`/api/distributions/${distributionId}/denrees/${denreeId}`, {
    method: "DELETE",
  });
}

export function calculerDotation(
  distributionId: string,
  base?: "INSCRITS" | "PRESENTS",
): Promise<DotationResponse> {
  const params = base ? `?base=${base}` : "";
  return apiGet<DotationResponse>(`/api/distributions/${distributionId}/repartition${params}`);
}

// --- Catalogue de types de roles ---

export function listerTypesRoles(): Promise<TypeRoleResponse[]> {
  return apiGet<TypeRoleResponse[]>("/api/types-roles");
}

export function creerTypeRole(libelle: string, parentId?: string): Promise<TypeRoleResponse> {
  return apiPost<TypeRoleResponse>("/api/types-roles", { libelle, parentId: parentId ?? null });
}

export function modifierTypeRole(id: string, libelle: string): Promise<TypeRoleResponse> {
  return apiFetch<TypeRoleResponse>(`/api/types-roles/${id}`, {
    method: "PUT",
    body: JSON.stringify({ libelle }),
  });
}

export function archiverTypeRole(id: string): Promise<void> {
  return apiFetch<void>(`/api/types-roles/${id}`, { method: "DELETE" });
}

// --- Roles assignes par le coordinateur sur une inscription ---

export function listerRoles(
  distributionId: string,
  inscriptionId: string,
): Promise<RoleBenevoleResponse[]> {
  return apiGet<RoleBenevoleResponse[]>(
    `/api/distributions/${distributionId}/inscriptions/${inscriptionId}/roles`,
  );
}

export function assignerRole(
  distributionId: string,
  inscriptionId: string,
  payload: { typeRoleId?: string; libelleLibre?: string },
): Promise<RoleBenevoleResponse> {
  return apiPost<RoleBenevoleResponse>(
    `/api/distributions/${distributionId}/inscriptions/${inscriptionId}/roles`,
    payload,
  );
}

export function retirerRole(
  distributionId: string,
  inscriptionId: string,
  roleId: string,
): Promise<void> {
  return apiFetch<void>(
    `/api/distributions/${distributionId}/inscriptions/${inscriptionId}/roles/${roleId}`,
    { method: "DELETE" },
  );
}
