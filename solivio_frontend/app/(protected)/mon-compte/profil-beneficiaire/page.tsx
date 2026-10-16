import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EyeOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DeuxColonnes } from "@/components/ui/deux-colonnes";
import { PageHeader } from "@/components/ui/page-header";
import { FormulaireProfilBeneficiaire } from "@/components/account/FormulaireProfilBeneficiaire";
import { lireServeur } from "@/lib/api/serveur";
import type { ProfilBeneficiaireResponse } from "@/types/profil";

export const metadata: Metadata = { title: "Mon dossier" };

export default async function ProfilBeneficiairePage() {
  const profil = await lireServeur<ProfilBeneficiaireResponse>("/api/me/profil-beneficiaire");
  if (profil === null) redirect("/mon-compte");

  return (
    <DeuxColonnes
      collante
      aside={
        // RG5 : confidentialite par defaut.
        <Alert variant="info">
          <EyeOff aria-hidden="true" />
          <AlertTitle>Qui voit ces informations</AlertTitle>
          <AlertDescription>
            Vous, et les responsables de l&apos;association. Chaque consultation est enregistrée. Les
            bénévoles ne les voient jamais, même à l&apos;accueil d&apos;une distribution, et les
            statistiques restent anonymes.
          </AlertDescription>
        </Alert>
      }
    >
      <PageHeader
        className="mb-0 sm:mb-0"
        retour={{ href: "/mon-compte", libelle: "Mon compte" }}
        titre="Mon dossier"
        description="Ces informations aident l'association à comprendre les besoins. Chaque champ est facultatif."
      />

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <FormulaireProfilBeneficiaire profil={profil} />
      </div>
    </DeuxColonnes>
  );
}
