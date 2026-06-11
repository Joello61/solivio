import { apiGet, apiPost, apiDelete } from '@/lib/api';
import type {
  SessionReconditionnementResponse,
  InscriptionReconditionnementResponse,
  CreateSessionReconditionnementPayload,
} from '@/types/reconditionnement';

export function listerSessions(): Promise<SessionReconditionnementResponse[]> {
  return apiGet<SessionReconditionnementResponse[]>('/api/sessions-reconditionnement');
}

export function detailSession(id: string): Promise<SessionReconditionnementResponse> {
  return apiGet<SessionReconditionnementResponse>(`/api/sessions-reconditionnement/${id}`);
}

export function creerSession(
  payload: CreateSessionReconditionnementPayload,
): Promise<SessionReconditionnementResponse> {
  return apiPost<SessionReconditionnementResponse>('/api/sessions-reconditionnement', payload);
}

export function publierSession(id: string): Promise<SessionReconditionnementResponse> {
  return apiPost<SessionReconditionnementResponse>(
    `/api/sessions-reconditionnement/${id}/publier`,
    {},
  );
}

export function demarrerSession(id: string): Promise<SessionReconditionnementResponse> {
  return apiPost<SessionReconditionnementResponse>(
    `/api/sessions-reconditionnement/${id}/demarrer`,
    {},
  );
}

export function terminerSession(id: string): Promise<SessionReconditionnementResponse> {
  return apiPost<SessionReconditionnementResponse>(
    `/api/sessions-reconditionnement/${id}/terminer`,
    {},
  );
}

export function annulerSession(
  id: string,
  motif: string,
): Promise<SessionReconditionnementResponse> {
  return apiPost<SessionReconditionnementResponse>(
    `/api/sessions-reconditionnement/${id}/annuler`,
    { motif },
  );
}

export function inscrireSession(id: string): Promise<InscriptionReconditionnementResponse> {
  return apiPost<InscriptionReconditionnementResponse>(
    `/api/sessions-reconditionnement/${id}/inscrire`,
    {},
  );
}

export function desinscrireSession(id: string): Promise<void> {
  return apiDelete(`/api/sessions-reconditionnement/${id}/desinscrire`);
}

export function listerInscrits(id: string): Promise<InscriptionReconditionnementResponse[]> {
  return apiGet<InscriptionReconditionnementResponse[]>(
    `/api/sessions-reconditionnement/${id}/inscrits`,
  );
}

export function pointerParticipant(
  sessionId: string,
  personneId: string,
  presence: string,
): Promise<InscriptionReconditionnementResponse> {
  return apiPost<InscriptionReconditionnementResponse>(
    `/api/sessions-reconditionnement/${sessionId}/pointage`,
    { personneId, presence },
  );
}
