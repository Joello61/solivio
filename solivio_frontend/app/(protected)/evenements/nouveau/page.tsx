import type { Metadata } from "next";
import { FormulaireEvenement } from "@/components/evenement/FormulaireEvenement";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Nouvel événement" };

export default function NouvelEvenementPage() {
  return (
    <>
      <PageHeader retour={{ href: "/evenements", libelle: "Événements" }} titre="Nouvel événement" description="Il reste en brouillon tant que vous ne le publiez pas." />
      <FormulaireEvenement />
    </>
  );
}
