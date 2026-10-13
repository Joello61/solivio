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
  CatalogueDenreeResponse,
  MembreSuggestion,
  PointageAdHocResponse,
  UpdateDistributionPayload,
} from "@/types/distribution";

export function creerDistribution(payload: CreateDistributionPayload): Promise<DistributionResponse> {
  return apiPost<DistributionResponse>("/api/distributions", payload);
}

export function modifierDistribution(id: string, payload: UpdateDistributionPayload): Promise<DistributionResponse> {
  return apiFetch<DistributionResponse>(`/api/distributions/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

/** Brouillon uniquement : une distribution publiee s'annule. */
export function supprimerDistribution(id: string): Promise<void> {
  return apiFetch<void>(`/api/distributions/${id}`, { method: "DELETE" });
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

export function changerBaseRepartition(
  distributionId: string,
  base: "INSCRITS" | "PRESENTS",
): Promise<DistributionResponse> {
  return apiFetch<DistributionResponse>(`/api/distributions/${distributionId}/base-repartition`, {
    method: "PUT",
    body: JSON.stringify({ base }),
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

// --- Pointage ad hoc (visiteurs ponctuels et membres sans inscription) ---

export function rechercherMembresAdHoc(
  distributionId: string,
  q: string,
): Promise<MembreSuggestion[]> {
  const params = new URLSearchParams({ q });
  return apiGet<MembreSuggestion[]>(
    `/api/distributions/${distributionId}/pointage/ad-hoc/membres?${params}`,
  );
}

export function ajouterBenevoleExistant(
  distributionId: string,
  personneId: string,
): Promise<PointageInfoResponse> {
  return apiPost<PointageInfoResponse>(
    `/api/distributions/${distributionId}/pointage/ad-hoc/benevole-existant`,
    { personneId },
  );
}

export function ajouterVisiteur(
  distributionId: string,
  payload: { nom: string; prenom: string; email?: string; role?: string },
): Promise<PointageAdHocResponse> {
  return apiPost<PointageAdHocResponse>(
    `/api/distributions/${distributionId}/pointage/ad-hoc/visiteur`,
    payload,
  );
}

export function listerVisiteursAdHoc(distributionId: string): Promise<PointageAdHocResponse[]> {
  return apiGet<PointageAdHocResponse[]>(
    `/api/distributions/${distributionId}/pointage/ad-hoc`,
  );
}

export function envoyerInvitationVisiteur(
  distributionId: string,
  adHocId: string,
): Promise<void> {
  return apiPost<void>(
    `/api/distributions/${distributionId}/pointage/ad-hoc/${adHocId}/invitation`,
    {},
  );
}

// --- Catalogue des denrees ---

export function rechercherCatalogueDenrees(q: string): Promise<CatalogueDenreeResponse[]> {
  return apiGet<CatalogueDenreeResponse[]>(`/api/denrees/catalogue?q=${encodeURIComponent(q)}`);
}

export function listerCatalogueDenrees(): Promise<CatalogueDenreeResponse[]> {
  return apiGet<CatalogueDenreeResponse[]>("/api/denrees/catalogue");
}

export function creerCatalogueDenree(libelle: string): Promise<CatalogueDenreeResponse> {
  return apiPost<CatalogueDenreeResponse>("/api/denrees/catalogue", { libelle });
}

export function modifierCatalogueDenree(id: string, libelle: string): Promise<CatalogueDenreeResponse> {
  return apiFetch<CatalogueDenreeResponse>(`/api/denrees/catalogue/${id}`, {
    method: "PUT",
    body: JSON.stringify({ libelle }),
  });
}

export function supprimerCatalogueDenree(id: string): Promise<void> {
  return apiFetch<void>(`/api/denrees/catalogue/${id}`, { method: "DELETE" });
}
