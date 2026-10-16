import type { Metadata } from "next";
import { lireServeur } from "@/lib/api/serveur";
import { ExportDonnees } from "@/components/association/ExportDonnees";
import { FormulaireConfiguration } from "@/components/association/FormulaireConfiguration";
import { Alert } from "@/components/ui/alert";
import { DeuxColonnes } from "@/components/ui/deux-colonnes";
import { PageHeader } from "@/components/ui/page-header";
import type { AssociationResponse } from "@/types/association";

export const metadata: Metadata = { title: "Réglages" };

export default async function ConfigurationPage() {
  const association = await lireServeur<AssociationResponse>("/api/association");

  if (!association) {
    return (
      <>
        <PageHeader titre="Réglages" />
        <Alert variant="destructive">Les réglages n&apos;ont pas pu être chargés. Rechargez la page dans un instant.</Alert>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader className="mb-0 sm:mb-0" titre="Réglages" description={`Ce qui s'applique à toute l'association ${association.nom}.`} />
      <DeuxColonnes aside={<ExportDonnees />} collante>
        <FormulaireConfiguration association={association} />
      </DeuxColonnes>
    </div>
  );
}
