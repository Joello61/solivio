export interface AssociationResponse {
  id: string;
  nom: string;
  logoUrl: string | null;
  couleurPrimaire: string | null;
  couleurSecondaire: string | null;
  fuseauHoraire: string | null;
  frequenceMaxParSemaine: number | null;
  contactEmail: string | null;
  contactTelephone: string | null;
  dateCreation: string;
}

export interface UpdateAssociationPayload {
  nom?: string;
  logoUrl?: string;
  frequenceMaxParSemaine?: number | null;
  contactEmail?: string;
  contactTelephone?: string;
}

export interface MembreResponse {
  compteId: string;
  nom: string;
  prenom: string;
  email: string;
  roles: string[];
  coordoType: string | null;
  statut: string;
  dateDebut: string;
}

/** Invitation d'une personne sans compte a devenir responsable (ADR-012). */
export interface InviterMembrePayload {
  email: string;
}

export interface UpdateRolesMembrePayload {
  roles: string[];
  coordoType?: string | null;
}

export interface StatistiqueDistributionResponse {
  distributionId: string;
  distributionDate: string;
  nbInscritsBeneficiaires: number;
  nbInscritsBenevoles: number;
  nbPresentsBeneficiaires: number;
  nbAbsentsBeneficiaires: number;
  nbNonPointes: number;
  tauxPresence: number;
  dateCalcul: string;
}

export interface StatistiquePeriodeResponse {
  debut: string;
  fin: string;
  nbDistributions: number;
  nbBeneficiairesDistinctsServis: number;
  nbBenevolesDistincts: number;
}
