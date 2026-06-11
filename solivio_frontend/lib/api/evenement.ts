import type {
  EvenementResponse,
  ParticipationEvenementResponse,
  CreateEvenementPayload,
  UpdateEvenementPayload,
  StatutEvenement,
  TypeEvenement,
  RoleParticipation,
  PresenceEvenement,
} from "@/types/evenement";

const BASE = "/api/evenements";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      detail?: string;
      message?: string;
    };
    throw Object.assign(new Error(err.detail ?? err.message ?? "Erreur reseau"), err);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function listerEvenements(params?: {
  statut?: StatutEvenement;
  type?: TypeEvenement;
}): Promise<EvenementResponse[]> {
  const qs = new URLSearchParams();
  if (params?.statut) qs.set("statut", params.statut);
  if (params?.type) qs.set("type", params.type);
  const query = qs.toString() ? `?${qs}` : "";
  return request<EvenementResponse[]>(`${BASE}${query}`);
}

export function detailEvenement(id: string): Promise<EvenementResponse> {
  return request<EvenementResponse>(`${BASE}/${id}`);
}

export function creerEvenement(payload: CreateEvenementPayload): Promise<EvenementResponse> {
  return request<EvenementResponse>(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function modifierEvenement(
  id: string,
  payload: UpdateEvenementPayload,
): Promise<EvenementResponse> {
  return request<EvenementResponse>(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function publierEvenement(id: string): Promise<EvenementResponse> {
  return request<EvenementResponse>(`${BASE}/${id}/publier`, { method: "PUT" });
}

export function annulerEvenement(id: string, raison: string): Promise<EvenementResponse> {
  return request<EvenementResponse>(`${BASE}/${id}/annuler`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raison }),
  });
}

export function sInscrire(
  evenementId: string,
  role: RoleParticipation,
): Promise<ParticipationEvenementResponse> {
  return request<ParticipationEvenementResponse>(`${BASE}/${evenementId}/participations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
}

export function seDesinscrire(evenementId: string): Promise<void> {
  return request<void>(`${BASE}/${evenementId}/participations/moi`, { method: "DELETE" });
}

export function listerParticipants(
  evenementId: string,
): Promise<ParticipationEvenementResponse[]> {
  return request<ParticipationEvenementResponse[]>(`${BASE}/${evenementId}/participations`);
}

export function listerPourPointage(
  evenementId: string,
  q?: string,
): Promise<ParticipationEvenementResponse[]> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return request<ParticipationEvenementResponse[]>(`${BASE}/${evenementId}/pointage${qs}`);
}

export function pointer(
  evenementId: string,
  participationId: string,
  presence: PresenceEvenement,
): Promise<ParticipationEvenementResponse> {
  return request<ParticipationEvenementResponse>(
    `${BASE}/${evenementId}/pointage/${participationId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presence }),
    },
  );
}

export function mesEvenements(): Promise<ParticipationEvenementResponse[]> {
  return request<ParticipationEvenementResponse[]>(`${BASE}/mes-evenements`);
}
