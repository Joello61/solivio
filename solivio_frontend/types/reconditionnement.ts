import type { LieuRequest, LieuResponse } from './distribution';

export interface SessionReconditionnementResponse {
  id: string;
  titre: string;
  description: string | null;
  lieu: LieuResponse | null;
  dateHeureDebut: string;
  dateHeureFin: string;
  capacite: number | null;
  statut: StatutSession;
  motifAnnulation: string | null;
  nbInscrits: number;
  dateCreation: string;
}

export interface InscriptionReconditionnementResponse {
  id: string;
  sessionId: string;
  sessionTitre: string | null;
  sessionDate: string | null;
  sessionLieu: string | null;
  personneId: string;
  nomComplet: string;
  statut: string;
  presence: string;
  dateInscription: string;
}

export interface CreateSessionReconditionnementPayload {
  titre: string;
  description?: string;
  lieu?: LieuRequest;
  dateHeureDebut: string;
  dateHeureFin: string;
  capacite?: number;
}

export type StatutSession = 'BROUILLON' | 'PUBLIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
