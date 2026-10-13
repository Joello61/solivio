import { apiPost, apiFetch } from "@/lib/api";
import type {
  SessionReconditionnementResponse,
  InscriptionReconditionnementResponse,
  CreateSessionReconditionnementPayload,
} from "@/types/reconditionnement";

export function creerSession(
  payload: CreateSessionReconditionnementPayload
): Promise<SessionReconditionnementResponse> {
  return apiPost<SessionReconditionnementResponse>("/api/sessions-reconditionnement", payload);
}

export function publierSession(id: string): Promise<SessionReconditionnementResponse> {
  return apiPost<SessionReconditionnementResponse>(
    `/api/sessions-reconditionnement/${id}/publier`, {}
  );
}

export function demarrerSession(id: string): Promise<SessionReconditionnementResponse> {
  return apiPost<SessionReconditionnementResponse>(
    `/api/sessions-reconditionnement/${id}/demarrer`, {}
  );
}

export function terminerSession(id: string): Promise<SessionReconditionnementResponse> {
  return apiPost<SessionReconditionnementResponse>(
    `/api/sessions-reconditionnement/${id}/terminer`, {}
  );
}

export function annulerSession(
  id: string, motif: string
): Promise<SessionReconditionnementResponse> {
  return apiPost<SessionReconditionnementResponse>(
    `/api/sessions-reconditionnement/${id}/annuler`, { motif }
  );
}

export function inscrireSession(id: string): Promise<InscriptionReconditionnementResponse> {
  return apiPost<InscriptionReconditionnementResponse>(
    `/api/sessions-reconditionnement/${id}/inscrire`, {}
  );
}

export function desinscrireSession(id: string): Promise<void> {
  return apiFetch(`/api/sessions-reconditionnement/${id}/desinscrire`, {
    method: "DELETE",
  }).then(() => undefined);
}

export function pointerParticipant(
  sessionId: string, personneId: string, presence: string
): Promise<InscriptionReconditionnementResponse> {
  return apiPost<InscriptionReconditionnementResponse>(
    `/api/sessions-reconditionnement/${sessionId}/pointage`, { personneId, presence }
  );
}
