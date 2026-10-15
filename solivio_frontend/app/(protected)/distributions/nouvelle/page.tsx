import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { CreateDistributionForm } from "@/components/distributions/CreateDistributionForm";
import { lireServeur } from "@/lib/api/serveur";
import { dateLongue } from "@/lib/agenda";
import { jourAssociation } from "@/lib/distribution-du-jour";
import type { DistributionResponse } from "@/types/distribution";

export const metadata: Metadata = { title: "Nouvelle distribution" };

export default async function NouvellePage({ searchParams }: { searchParams: Promise<{ depuis?: string }> }) {
  const { depuis } = await searchParams;
  const modele = depuis ? await lireServeur<DistributionResponse>(`/api/distributions/${depuis}`) : null;

  return (
    <div>
      <PageHeader
        retour={{ href: "/distributions", libelle: "Planning" }}
        titre={modele ? "Dupliquer une distribution" : "Nouvelle distribution"}
        description={
          modele
            ? `Reprise de celle du ${dateLongue(modele.date)} : lieu, créneaux et capacités. Vérifiez la date.`
            : "Date, lieu et créneaux : le reste se règle sur la feuille de la distribution."
        }
      />
      <CreateDistributionForm modele={modele ?? undefined} aujourdhui={jourAssociation(new Date())} />
    </div>
  );
}
