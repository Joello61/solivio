import type {
  MissionCollecteResponse,
  CreateMissionCollectePayload,
  UpdateMissionCollectePayload,
  StatutMission,
} from "@/types/collecte";

const BASE = "/api/missions-collecte";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string; message?: string };
    throw Object.assign(new Error(err.detail ?? err.message ?? "Erreur reseau"), err);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function listerMissions(statut?: StatutMission): Promise<MissionCollecteResponse[]> {
  const qs = statut ? `?statut=${statut}` : "";
  return request<MissionCollecteResponse[]>(`${BASE}${qs}`);
}

export function detailMission(id: string): Promise<MissionCollecteResponse> {
  return request<MissionCollecteResponse>(`${BASE}/${id}`);
}

export function creerMission(payload: CreateMissionCollectePayload): Promise<MissionCollecteResponse> {
  return request<MissionCollecteResponse>(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function modifierMission(id: string, payload: UpdateMissionCollectePayload): Promise<MissionCollecteResponse> {
  return request<MissionCollecteResponse>(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function annulerMission(id: string, raison: string): Promise<MissionCollecteResponse> {
  return request<MissionCollecteResponse>(`${BASE}/${id}/annuler`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raison }),
  });
}

export function prendreEnCharge(id: string): Promise<MissionCollecteResponse> {
  return request<MissionCollecteResponse>(`${BASE}/${id}/prendre`, { method: "POST" });
}

export function libererMission(id: string): Promise<MissionCollecteResponse> {
  return request<MissionCollecteResponse>(`${BASE}/${id}/liberer`, { method: "DELETE" });
}

export function validerCollecte(id: string): Promise<MissionCollecteResponse> {
  return request<MissionCollecteResponse>(`${BASE}/${id}/valider-collecte`, { method: "PUT" });
}

export function validerDepot(id: string): Promise<MissionCollecteResponse> {
  return request<MissionCollecteResponse>(`${BASE}/${id}/valider-depot`, { method: "PUT" });
}

export function mesMissions(): Promise<MissionCollecteResponse[]> {
  return request<MissionCollecteResponse[]>(`${BASE}/mes-missions`);
}
