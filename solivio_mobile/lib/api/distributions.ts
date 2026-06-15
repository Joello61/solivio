import { apiGet, apiPost, apiPut, apiDelete, apiFetch } from '@/lib/api';
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
} from '@/types/distribution';

export function listerDistributions(): Promise<DistributionResponse[]> {
  return apiGet<DistributionResponse[]>('/api/distributions');
}

export function detailDistribution(id: string): Promise<DistributionResponse> {
  return apiGet<DistributionResponse>(`/api/distributions/${id}`);
}

export function creerDistribution(
  payload: CreateDistributionPayload,
): Promise<DistributionResponse> {
  return apiPost<DistributionResponse>('/api/distributions', payload);
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
  return apiDelete<void>(
    `/api/distributions/${distributionId}/inscriptions/${inscriptionId}`,
  );
}

export function rechercherPointage(
  distributionId: string,
  q: string,
): Promise<PointageInfoResponse[]> {
  const params = new URLSearchParams({ q });
  return apiGet<PointageInfoResponse[]>(
    `/api/distributions/${distributionId}/pointage?${params}`,
  );
}

export function pointer(
  distributionId: string,
  inscriptionId: string,
  presence: string,
): Promise<InscriptionResponse> {
  return apiPut<InscriptionResponse>(
    `/api/distributions/${distributionId}/pointage/${inscriptionId}`,
    { presence },
  );
}

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
  return apiPut<DenreeResponse>(
    `/api/distributions/${distributionId}/denrees/${denreeId}`,
    payload,
  );
}

export function supprimerDenree(distributionId: string, denreeId: string): Promise<void> {
  return apiDelete<void>(`/api/distributions/${distributionId}/denrees/${denreeId}`);
}

export function calculerDotation(
  distributionId: string,
  base?: 'INSCRITS' | 'PRESENTS',
): Promise<DotationResponse> {
  const params = base ? `?base=${base}` : '';
  return apiGet<DotationResponse>(`/api/distributions/${distributionId}/repartition${params}`);
}

export function listerTypesRoles(): Promise<TypeRoleResponse[]> {
  return apiGet<TypeRoleResponse[]>('/api/types-roles');
}

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
    { method: 'DELETE' },
  );
}

// --- Catalogue des denrees ---

export function rechercherCatalogueDenrees(q: string): Promise<CatalogueDenreeResponse[]> {
  return apiGet<CatalogueDenreeResponse[]>(`/api/denrees/catalogue?q=${encodeURIComponent(q)}`);
}

export function listerCatalogueDenrees(): Promise<CatalogueDenreeResponse[]> {
  return apiGet<CatalogueDenreeResponse[]>('/api/denrees/catalogue');
}

export function creerCatalogueDenree(libelle: string): Promise<CatalogueDenreeResponse> {
  return apiPost<CatalogueDenreeResponse>('/api/denrees/catalogue', { libelle });
}

export function modifierCatalogueDenree(id: string, libelle: string): Promise<CatalogueDenreeResponse> {
  return apiFetch<CatalogueDenreeResponse>(`/api/denrees/catalogue/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ libelle }),
  });
}

export function supprimerCatalogueDenree(id: string): Promise<void> {
  return apiFetch<void>(`/api/denrees/catalogue/${id}`, { method: 'DELETE' });
}

// --- Pointage ad hoc ---

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
