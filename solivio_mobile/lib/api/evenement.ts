import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import type {
  EvenementResponse,
  ParticipationEvenementResponse,
  CreateEvenementPayload,
  StatutEvenement,
  TypeEvenement,
  RoleParticipation,
  PresenceEvenement,
} from '@/types/evenement';

const BASE = '/api/evenements';

export function listerEvenements(params?: {
  statut?: StatutEvenement;
  type?: TypeEvenement;
}): Promise<EvenementResponse[]> {
  const qs = new URLSearchParams();
  if (params?.statut) qs.set('statut', params.statut);
  if (params?.type) qs.set('type', params.type);
  const query = qs.toString() ? `?${qs}` : '';
  return apiGet<EvenementResponse[]>(`${BASE}${query}`);
}

export function detailEvenement(id: string): Promise<EvenementResponse> {
  return apiGet<EvenementResponse>(`${BASE}/${id}`);
}

export function creerEvenement(payload: CreateEvenementPayload): Promise<EvenementResponse> {
  return apiPost<EvenementResponse>(BASE, payload);
}

export function publierEvenement(id: string): Promise<EvenementResponse> {
  return apiPut<EvenementResponse>(`${BASE}/${id}/publier`, {});
}

export function annulerEvenement(id: string, raison: string): Promise<EvenementResponse> {
  return apiPut<EvenementResponse>(`${BASE}/${id}/annuler`, { raison });
}

export function sInscrire(
  evenementId: string,
  role: RoleParticipation,
): Promise<ParticipationEvenementResponse> {
  return apiPost<ParticipationEvenementResponse>(`${BASE}/${evenementId}/participations`, { role });
}

export function seDesinscrire(evenementId: string): Promise<void> {
  return apiDelete<void>(`${BASE}/${evenementId}/participations/moi`);
}

export function listerPourPointage(
  evenementId: string,
  q?: string,
): Promise<ParticipationEvenementResponse[]> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return apiGet<ParticipationEvenementResponse[]>(`${BASE}/${evenementId}/pointage${qs}`);
}

export function pointer(
  evenementId: string,
  participationId: string,
  presence: PresenceEvenement,
): Promise<ParticipationEvenementResponse> {
  return apiPut<ParticipationEvenementResponse>(
    `${BASE}/${evenementId}/pointage/${participationId}`,
    { presence },
  );
}

export function mesEvenements(): Promise<ParticipationEvenementResponse[]> {
  return apiGet<ParticipationEvenementResponse[]>(`${BASE}/mes-evenements`);
}
