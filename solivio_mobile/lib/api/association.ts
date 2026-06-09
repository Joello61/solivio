import { apiGet, apiPost, apiFetch, apiUpload } from '@/lib/api';
import type {
  AssociationResponse,
  UpdateAssociationPayload,
  MembreResponse,
  UpdateRoleMembrePayload,
  StatistiqueDistributionResponse,
  StatistiquePeriodeResponse,
  AssociationAdminResponse,
  CreateAssociationPayload,
} from '@/types/association';

export function lireAssociation(): Promise<AssociationResponse> {
  return apiGet<AssociationResponse>('/api/association');
}

export function mettreAJourAssociation(
  payload: UpdateAssociationPayload,
): Promise<AssociationResponse> {
  return apiFetch<AssociationResponse>('/api/association', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function uploadLogo(uri: string): Promise<AssociationResponse> {
  const form = new FormData();
  form.append('file', { uri, name: 'logo.jpg', type: 'image/jpeg' } as unknown as Blob);
  return apiUpload<AssociationResponse>('/api/association/logo', form);
}

export function listerMembres(): Promise<MembreResponse[]> {
  return apiGet<MembreResponse[]>('/api/association/membres');
}

export function mettreAJourRoleMembre(
  compteId: string,
  payload: UpdateRoleMembrePayload,
): Promise<MembreResponse> {
  return apiFetch<MembreResponse>(`/api/association/membres/${compteId}/role`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function supprimerMembre(compteId: string): Promise<void> {
  return apiFetch<void>(`/api/association/membres/${compteId}`, { method: 'DELETE' });
}

export function changerStatutMembre(
  compteId: string,
  statut: 'actif' | 'suspendu',
): Promise<MembreResponse> {
  return apiFetch<MembreResponse>(`/api/association/membres/${compteId}/statut`, {
    method: 'PATCH',
    body: JSON.stringify({ statut }),
  });
}

export function statsDistribution(id: string): Promise<StatistiqueDistributionResponse> {
  return apiGet<StatistiqueDistributionResponse>(`/api/statistiques/distributions/${id}`);
}

export function statsPeriode(debut: string, fin: string): Promise<StatistiquePeriodeResponse> {
  return apiGet<StatistiquePeriodeResponse>(
    `/api/statistiques/periode?debut=${debut}&fin=${fin}`,
  );
}

export function listerAssociationsAdmin(): Promise<AssociationAdminResponse[]> {
  return apiGet<AssociationAdminResponse[]>('/api/admin/associations');
}

export function creerAssociation(
  payload: CreateAssociationPayload,
): Promise<AssociationAdminResponse> {
  return apiPost<AssociationAdminResponse>('/api/admin/associations', payload);
}
