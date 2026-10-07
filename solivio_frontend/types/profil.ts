export interface ProfilBeneficiaireResponse {
  dateNaissance: string | null;
  statutBoursier: "boursier" | "non_boursier" | null;
  echelonBourse: number | null;
  categorieNationalite: "francaise" | "ressortissant_ue" | "hors_ue" | null;
  resteAVivreMensuel: number | null;
  niveauAcademique: "L1" | "L2" | "L3" | "M1" | "M2" | "doctorat" | "BTS" | "autre" | null;
  etablissement: string | null;
  situationLogement:
    | "seul"
    | "colocation"
    | "chez_parents"
    | "residence"
    | "sans_domicile_stable"
    | "autre"
    | null;
  aEmploiEtudiant: boolean | null;
  complet: boolean;
}

export interface UpdateProfilBeneficiairePayload {
  dateNaissance?: string | null;
  statutBoursier?: string | null;
  echelonBourse?: number | null;
  categorieNationalite?: string | null;
  resteAVivreMensuel?: number | null;
  niveauAcademique?: string | null;
  etablissement?: string | null;
  situationLogement?: string | null;
  aEmploiEtudiant?: boolean | null;
}

export interface UpdateProfilPayload {
  nom?: string;
  prenom?: string;
  telephone?: string;
}

export interface CompteAdminResponse {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  photoUrl: string | null;
  emailVerifie: boolean;
  actif: boolean;
  superAdmin: boolean;
  dateCreation: string;
  // Role et statut du membre dans l'association ; null si le compte n'a pas de role.
  role: string | null;
  statutMembre: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
