export type StatutDistribution =
  | "BROUILLON"
  | "PUBLIEE"
  | "EN_COURS"
  | "TERMINEE"
  | "ANNULEE";

export type ModeCreneauDistribution = "CRENEAU_UNIQUE" | "CRENEAUX_DECOUPES";

export type TypeInscription = "BENEFICIAIRE" | "BENEVOLE";

export type StatutInscription = "CONFIRMEE" | "LISTE_ATTENTE" | "ANNULEE";

export type StatutPresence = "NON_POINTE" | "PRESENT" | "ABSENT";

export interface CreneauResponse {
  id: string;
  heureDebut: string;
  heureFin: string;
  capacite: number;
  // Tient compte de la capacite globale de la distribution.
  placesRestantes: number;
  // Effectifs reserves aux gestionnaires, null sinon.
  confirmes: number | null;
  enAttente: number | null;
}

/** Places restantes pour tous ; effectifs reserves aux gestionnaires (null sinon). */
export interface RemplissageResponse {
  placesRestantesBeneficiaires: number;
  placesRestantesBenevoles: number | null;
  beneficiairesConfirmes: number | null;
  beneficiairesEnAttente: number | null;
  benevolesConfirmes: number | null;
  benevolesEnAttente: number | null;
}

/** Prochaine distribution annoncee sur la page d'accueil publique. */
export interface DistributionPubliqueResponse {
  date: string;
  heureDebut: string | null;
  heureFin: string | null;
  lieuNom: string | null;
  lieuAdresse: string | null;
  complet: boolean;
}

export interface LieuResponse {
  placeId: string | null;
  nom: string | null;
  adresseFormatee: string | null;
  latitude: number | null;
  longitude: number | null;
  numeroRue: string | null;
  voie: string | null;
  codePostal: string | null;
  ville: string | null;
}

export interface LieuRequest {
  placeId?: string;
  nom?: string;
  adresseFormatee?: string;
  latitude?: number;
  longitude?: number;
  numeroRue?: string;
  voie?: string;
  codePostal?: string;
  ville?: string;
}

export interface DistributionResponse {
  id: string;
  titre: string;
  description: string | null;
  lieu: LieuResponse | null;
  date: string;
  statut: StatutDistribution;
  capaciteBeneficiaires: number;
  capaciteBenevoles: number | null;
  modeCreneau: ModeCreneauDistribution;
  baseRepartition: "INSCRITS" | "PRESENTS";
  motifAnnulation: string | null;
  dateCreation: string;
  creneaux: CreneauResponse[];
  remplissage: RemplissageResponse;
}

export interface RoleBenevoleResponse {
  id: string;
  typeRoleId: string | null;
  libelle: string;
}

export interface InscriptionResponse {
  id: string;
  distributionId: string;
  creneauId: string | null;
  nom: string;
  prenom: string;
  type: TypeInscription;
  statut: StatutInscription;
  rangListeAttente: number | null;
  roles: RoleBenevoleResponse[];
  presence: StatutPresence;
  // RG4 : absence enregistree a la cloture faute de pointage.
  absenceDeduite: boolean;
  dateInscription: string;
  nombreAbsencesPassees: number;
}

export interface PointageInfoResponse {
  inscriptionId: string;
  nom: string;
  prenom: string;
  type: TypeInscription;
  statut: StatutInscription;
  presence: StatutPresence;
  heureCreneauDebut: string | null;
  heureCreneauFin: string | null;
}

export interface TypeRoleResponse {
  id: string;
  parentId: string | null;
  libelle: string;
  actif: boolean;
  sousTypes: TypeRoleResponse[];
}

export type UniteConditionnement = "UNITE" | "KILOGRAMME" | "LITRE" | "PIECE";

export interface DenreeResponse {
  id: string;
  distributionId: string;
  libelle: string;
  unite: UniteConditionnement;
  nombreContenants: number;
  quantiteParContenant: number;
  quantiteTotale: number;
}

export interface DotationDenreeDto {
  id: string;
  libelle: string;
  unite: UniteConditionnement;
  nombreContenants: number;
  quantiteParContenant: number;
  quantiteTotale: number;
  dotation: number;
  reste: number;
  penurie: boolean;
  nbPeutRecevoir: number;
}

export interface DotationResponse {
  distributionId: string;
  base: "INSCRITS" | "PRESENTS";
  nbBeneficiaires: number;
  denrees: DotationDenreeDto[];
}

export interface SaisirDenreePayload {
  libelle: string;
  unite: UniteConditionnement;
  nombreContenants: number;
  quantiteParContenant: number;
}

export interface CreateDistributionPayload {
  titre: string;
  description?: string;
  lieu?: LieuRequest;
  date: string;
  capaciteBeneficiaires: number;
  capaciteBenevoles?: number;
  modeCreneau?: string;
  creneaux: { heureDebut: string; heureFin: string; capacite: number }[];
}

export interface UpdateDistributionPayload extends Omit<CreateDistributionPayload, "creneaux"> {
  creneaux: { id?: string; heureDebut: string; heureFin: string; capacite: number }[];
}

export interface CatalogueDenreeResponse {
  id: string;
  libelle: string;
  dateCreation: string;
  dateModification: string;
}

export interface MembreSuggestion {
  id: string;
  email: string;
  prenom: string;
  nom: string;
}

export interface PointageAdHocResponse {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  role: string | null;
  presence: "PRESENT" | "ABSENT";
  invitationEnvoyee: boolean;
  datePointage: string;
}
