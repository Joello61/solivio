import type { Metadata } from "next";
import { AccueilMembre } from "@/components/accueil/AccueilMembre";
import { AujourdhuiGestion } from "@/components/accueil/AujourdhuiGestion";
import { lireDistributionsDuJour, lireMoi } from "@/lib/api/serveur";
import { jourAssociation } from "@/lib/distribution-du-jour";
import { estGestionnaireDistribution, typesInscriptionPossibles } from "@/lib/droits-distribution";

export const metadata: Metadata = { title: "Accueil" };

export default async function DashboardPage() {
  const me = await lireMoi();
  const roles = me?.roles ?? [];
  const maintenant = new Date();
  const types = typesInscriptionPossibles(roles);

  if (me && !estGestionnaireDistribution(roles) && types.length > 0) {
    return <AccueilMembre prenom={me.prenom} types={types} />;
  }
  const duJour = await lireDistributionsDuJour(roles, maintenant);
  return <AujourdhuiGestion prenom={me?.prenom ?? ""} duJour={duJour} aujourdhui={jourAssociation(maintenant)} />;
}
