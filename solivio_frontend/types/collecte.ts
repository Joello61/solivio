export type StatutMission =
  | "DISPONIBLE"
  | "PRISE_EN_CHARGE"
  | "COLLECTE_EFFECTUEE"
  | "DEPOT_VALIDE"
  | "ANNULEE";

export interface LieuMissionResponse {
  placeId: string | null;
  adresseFormatee: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface LieuMissionPayload {
  placeId?: string;
  adresseFormatee?: string;
  latitude?: number;
  longitude?: number;
}

export interface MissionCollecteResponse {
  id: string;
  titre: string;
  description: string | null;
  lieuCollecte: LieuMissionResponse | null;
  lieuDepot: LieuMissionResponse | null;
  dateHeure: string;
  capacitePersonnes: number;
  statut: StatutMission;
  benevoleId: string | null;
  benevoleNomComplet: string | null;
  datePriseEnCharge: string | null;
  dateCollecteEffectuee: string | null;
  dateDepotValide: string | null;
  raisonAnnulation: string | null;
  dateCreation: string;
}

export interface CreateMissionCollectePayload {
  titre: string;
  description?: string;
  lieuCollecte?: LieuMissionPayload;
  lieuDepot?: LieuMissionPayload;
  dateHeure: string;
  capacitePersonnes?: number;
}

export interface UpdateMissionCollectePayload {
  titre?: string;
  description?: string;
  lieuCollecte?: LieuMissionPayload;
  lieuDepot?: LieuMissionPayload;
  dateHeure?: string;
  capacitePersonnes?: number;
}
