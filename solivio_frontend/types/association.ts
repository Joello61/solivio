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
  couleurPrimaire?: string;
  couleurSecondaire?: string;
  fuseauHoraire?: string;
  frequenceMaxParSemaine?: number | null;
  contactEmail?: string;
  contactTelephone?: string;
}

export interface MembreResponse {
  compteId: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  coordoType: string | null;
  statut: string;
  dateDebut: string;
}

export interface InviterMembrePayload {
  email: string;
  role: "responsable" | "coordinateur" | "benevole";
  coordoType?: string;
}

export interface UpdateRoleMembrePayload {
  role: string;
  coordoType?: string;
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
