import { apiFetch } from "@/lib/api";
import type {
  MissionCollecteResponse,
  CreateMissionCollectePayload,
  UpdateMissionCollectePayload,
  StatutMission,
} from "@/types/collecte";

const BASE = "/api/missions-collecte";

export function listerMissions(statut?: StatutMission): Promise<MissionCollecteResponse[]> {
  const qs = statut ? `?statut=${statut}` : "";
  return apiFetch<MissionCollecteResponse[]>(`${BASE}${qs}`);
}

export function detailMission(id: string): Promise<MissionCollecteResponse> {
  return apiFetch<MissionCollecteResponse>(`${BASE}/${id}`);
}

export function creerMission(payload: CreateMissionCollectePayload): Promise<MissionCollecteResponse> {
  return apiFetch<MissionCollecteResponse>(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function modifierMission(id: string, payload: UpdateMissionCollectePayload): Promise<MissionCollecteResponse> {
  return apiFetch<MissionCollecteResponse>(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function annulerMission(id: string, raison: string): Promise<MissionCollecteResponse> {
  return apiFetch<MissionCollecteResponse>(`${BASE}/${id}/annuler`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raison }),
  });
}

export function prendreEnCharge(id: string): Promise<MissionCollecteResponse> {
  return apiFetch<MissionCollecteResponse>(`${BASE}/${id}/prendre`, { method: "POST" });
}

export function libererMission(id: string): Promise<MissionCollecteResponse> {
  return apiFetch<MissionCollecteResponse>(`${BASE}/${id}/liberer`, { method: "DELETE" });
}

export function validerCollecte(id: string): Promise<MissionCollecteResponse> {
  return apiFetch<MissionCollecteResponse>(`${BASE}/${id}/valider-collecte`, { method: "PUT" });
}

export function validerDepot(id: string): Promise<MissionCollecteResponse> {
  return apiFetch<MissionCollecteResponse>(`${BASE}/${id}/valider-depot`, { method: "PUT" });
}

export function mesMissions(): Promise<MissionCollecteResponse[]> {
  return apiFetch<MissionCollecteResponse[]>(`${BASE}/mes-missions`);
}
