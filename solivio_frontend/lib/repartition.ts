import type { DenreeResponse, DotationDenreeDto, UniteConditionnement } from "@/types/distribution";

const NOMBRE = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 });

const UNITES: Record<UniteConditionnement, [singulier: string, pluriel: string]> = {
  KILOGRAMME: ["kg", "kg"],
  LITRE: ["L", "L"],
  PIECE: ["pièce", "pièces"],
  UNITE: ["unité", "unités"],
};

/** Quantite lisible : "3 kg", "0,5 L", "1 pièce", "12 pièces". */
export function quantite(valeur: number, unite: UniteConditionnement): string {
  const [singulier, pluriel] = UNITES[unite] ?? [unite.toLowerCase(), unite.toLowerCase()];
  return `${NOMBRE.format(valeur)} ${valeur > 1 ? pluriel : singulier}`;
}

/** Ce qui a ete recu : "12 contenants de 5 kg, soit 60 kg". */
export function arrivage(d: Pick<DenreeResponse, "nombreContenants" | "quantiteParContenant" | "quantiteTotale" | "unite">): string {
  const contenants = `${d.nombreContenants} contenant${d.nombreContenants > 1 ? "s" : ""}`;
  if (d.nombreContenants === 1) return `${contenants} de ${quantite(d.quantiteParContenant, d.unite)}`;
  return `${contenants} de ${quantite(d.quantiteParContenant, d.unite)}, soit ${quantite(d.quantiteTotale, d.unite)}`;
}

/* Penurie dite en clair (RG8) : qui recoit combien, et combien n'en auront pas. */
export function phrasePenurie(d: DotationDenreeDto, nbBeneficiaires: number): string {
  if (d.nbPeutRecevoir === 0) return `Pas assez pour en donner à chacun : ${quantite(d.quantiteTotale, d.unite)} en tout.`;
  return `${quantite(d.dotation, d.unite)} par personne, pour ${d.nbPeutRecevoir} bénéficiaire${d.nbPeutRecevoir > 1 ? "s" : ""} sur ${nbBeneficiaires}.`;
}
