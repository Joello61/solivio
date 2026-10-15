import type { Metadata } from "next";
import { AccueilMembre } from "@/components/accueil/AccueilMembre";
import { AujourdhuiGestion } from "@/components/accueil/AujourdhuiGestion";
import { lireDistributionsDuJour, lireMoi } from "@/lib/api/serveur";
import { jourAssociation } from "@/lib/distribution-du-jour";
import { estGestionnaireDistribution, typeInscriptionPossible } from "@/lib/droits-distribution";

export const metadata: Metadata = { title: "Accueil" };

export default async function DashboardPage() {
  const me = await lireMoi();
  const roles = me?.roles ?? [];
  const maintenant = new Date();
  const duJour = await lireDistributionsDuJour(roles, maintenant);
  const type = typeInscriptionPossible(roles);

  if (me && !estGestionnaireDistribution(roles) && type) {
    return <AccueilMembre prenom={me.prenom} type={type} duJour={duJour} />;
  }
  return <AujourdhuiGestion prenom={me?.prenom ?? ""} duJour={duJour} aujourdhui={jourAssociation(maintenant)} />;
}
