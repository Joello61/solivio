export type TypeEvenement = "STAND" | "FETE" | "AUTRE";
export type PublicCible = "BENEVOLES" | "BENEFICIAIRES" | "TOUS";
export type ModeInscription = "OBLIGATOIRE" | "LIBRE" | "SANS_INSCRIPTION";
export type RoleParticipation = "STAFF" | "PARTICIPANT";
export type PresenceEvenement = "NON_POINTE" | "PRESENT" | "ABSENT";
export type StatutEvenement = "BROUILLON" | "PUBLIE" | "EN_COURS" | "TERMINE" | "ANNULE";

export interface EvenementResponse {
  id: string;
  titre: string;
  description: string | null;
  type: TypeEvenement;
  lieuPlaceId: string | null;
  lieuAdresseFormatee: string | null;
  lieuLatitude: number | null;
  lieuLongitude: number | null;
  dateHeureDebut: string;
  dateHeureFin: string;
  aBesoiNStaff: boolean;
  ouvertParticipants: boolean;
  publicParticipants: PublicCible | null;
  modeInscription: ModeInscription;
  capaciteStaff: number | null;
  capaciteParticipants: number | null;
  statut: StatutEvenement;
  raisonAnnulation: string | null;
  nbStaff: number;
  nbParticipants: number;
  dateCreation: string;
}

export interface ParticipationEvenementResponse {
  id: string;
  evenementId: string;
  personneId: string;
  personneNomComplet: string | null;
  role: RoleParticipation;
  presence: PresenceEvenement;
  dateInscription: string;
}

export interface CreateEvenementPayload {
  titre: string;
  description?: string;
  type?: TypeEvenement;
  lieuPlaceId?: string;
  lieuAdresseFormatee?: string;
  lieuLatitude?: number;
  lieuLongitude?: number;
  dateHeureDebut: string;
  dateHeureFin: string;
  aBesoiNStaff?: boolean;
  ouvertParticipants?: boolean;
  publicParticipants?: PublicCible;
  modeInscription?: ModeInscription;
  capaciteStaff?: number;
  capaciteParticipants?: number;
}

export type UpdateEvenementPayload = Partial<CreateEvenementPayload>;
