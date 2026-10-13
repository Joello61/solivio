// Libelles du dossier social, partages par le formulaire du beneficiaire et la lecture du responsable.
export const STATUTS_BOURSIER = [
  { value: "boursier", label: "Boursier" },
  { value: "non_boursier", label: "Non boursier" },
];

export const CATEGORIES_NATIONALITE = [
  { value: "francaise", label: "Française" },
  { value: "ressortissant_ue", label: "Ressortissant UE" },
  { value: "hors_ue", label: "Hors UE" },
];

export const NIVEAUX_ACADEMIQUES = [
  { value: "L1", label: "Licence 1" },
  { value: "L2", label: "Licence 2" },
  { value: "L3", label: "Licence 3" },
  { value: "M1", label: "Master 1" },
  { value: "M2", label: "Master 2" },
  { value: "doctorat", label: "Doctorat" },
  { value: "BTS", label: "BTS" },
  { value: "autre", label: "Autre" },
];

export const SITUATIONS_LOGEMENT = [
  { value: "seul", label: "Seul(e)" },
  { value: "colocation", label: "Colocation" },
  { value: "chez_parents", label: "Chez les parents" },
  { value: "residence", label: "Résidence universitaire" },
  { value: "sans_domicile_stable", label: "Sans domicile stable" },
  { value: "autre", label: "Autre" },
];

export function libelle(options: { value: string; label: string }[], valeur: string | null | undefined): string {
  if (!valeur) return "Non renseigné";
  return options.find((o) => o.value === valeur)?.label ?? valeur;
}
