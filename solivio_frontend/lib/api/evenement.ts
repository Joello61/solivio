import { apiFetch } from "@/lib/api";
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

export function listerEvenements(params?: {
  statut?: StatutEvenement;
  type?: TypeEvenement;
}): Promise<EvenementResponse[]> {
  const qs = new URLSearchParams();
  if (params?.statut) qs.set("statut", params.statut);
  if (params?.type) qs.set("type", params.type);
  const query = qs.toString() ? `?${qs}` : "";
  return apiFetch<EvenementResponse[]>(`${BASE}${query}`);
}

export function detailEvenement(id: string): Promise<EvenementResponse> {
  return apiFetch<EvenementResponse>(`${BASE}/${id}`);
}

export function creerEvenement(payload: CreateEvenementPayload): Promise<EvenementResponse> {
  return apiFetch<EvenementResponse>(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function modifierEvenement(
  id: string,
  payload: UpdateEvenementPayload,
): Promise<EvenementResponse> {
  return apiFetch<EvenementResponse>(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function publierEvenement(id: string): Promise<EvenementResponse> {
  return apiFetch<EvenementResponse>(`${BASE}/${id}/publier`, { method: "PUT" });
}

export function annulerEvenement(id: string, raison: string): Promise<EvenementResponse> {
  return apiFetch<EvenementResponse>(`${BASE}/${id}/annuler`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raison }),
  });
}

export function sInscrire(
  evenementId: string,
  role: RoleParticipation,
): Promise<ParticipationEvenementResponse> {
  return apiFetch<ParticipationEvenementResponse>(`${BASE}/${evenementId}/participations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
}

export function seDesinscrire(evenementId: string): Promise<void> {
  return apiFetch<void>(`${BASE}/${evenementId}/participations/moi`, { method: "DELETE" });
}

export function listerParticipants(
  evenementId: string,
): Promise<ParticipationEvenementResponse[]> {
  return apiFetch<ParticipationEvenementResponse[]>(`${BASE}/${evenementId}/participations`);
}

export function listerPourPointage(
  evenementId: string,
  q?: string,
): Promise<ParticipationEvenementResponse[]> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiFetch<ParticipationEvenementResponse[]>(`${BASE}/${evenementId}/pointage${qs}`);
}

export function pointer(
  evenementId: string,
  participationId: string,
  presence: PresenceEvenement,
): Promise<ParticipationEvenementResponse> {
  return apiFetch<ParticipationEvenementResponse>(
    `${BASE}/${evenementId}/pointage/${participationId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presence }),
    },
  );
}

export function mesEvenements(): Promise<ParticipationEvenementResponse[]> {
  return apiFetch<ParticipationEvenementResponse[]>(`${BASE}/mes-evenements`);
}
