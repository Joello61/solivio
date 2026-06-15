import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { MissionCollecteResponse, CreateMissionCollectePayload, StatutMission } from '@/types/collecte';

const BASE = '/api/missions-collecte';

export function listerMissions(statut?: StatutMission): Promise<MissionCollecteResponse[]> {
  const qs = statut ? `?statut=${statut}` : '';
  return apiGet<MissionCollecteResponse[]>(`${BASE}${qs}`);
}

export function detailMission(id: string): Promise<MissionCollecteResponse> {
  return apiGet<MissionCollecteResponse>(`${BASE}/${id}`);
}

export function creerMission(payload: CreateMissionCollectePayload): Promise<MissionCollecteResponse> {
  return apiPost<MissionCollecteResponse>(BASE, payload);
}

export function annulerMission(id: string, raison: string): Promise<MissionCollecteResponse> {
  return apiPut<MissionCollecteResponse>(`${BASE}/${id}/annuler`, { raison });
}

export function prendreEnCharge(id: string): Promise<MissionCollecteResponse> {
  return apiPost<MissionCollecteResponse>(`${BASE}/${id}/prendre`, {});
}

export function libererMission(id: string): Promise<MissionCollecteResponse> {
  return apiDelete<MissionCollecteResponse>(`${BASE}/${id}/liberer`);
}

export function validerCollecte(id: string): Promise<MissionCollecteResponse> {
  return apiPut<MissionCollecteResponse>(`${BASE}/${id}/valider-collecte`, {});
}

export function validerDepot(id: string): Promise<MissionCollecteResponse> {
  return apiPut<MissionCollecteResponse>(`${BASE}/${id}/valider-depot`, {});
}

export function mesMissions(): Promise<MissionCollecteResponse[]> {
  return apiGet<MissionCollecteResponse[]>(`${BASE}/mes-missions`);
}
