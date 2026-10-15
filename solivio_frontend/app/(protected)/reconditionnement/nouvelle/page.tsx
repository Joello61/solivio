import type { Metadata } from "next";
import { FormulaireSession } from "@/components/reconditionnement/FormulaireSession";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Nouvelle session de reconditionnement" };

export default function NouvelleSessionPage() {
  return (
    <>
      <PageHeader retour={{ href: "/reconditionnement", libelle: "Reconditionnement" }} titre="Nouvelle session" description="Elle reste en brouillon tant que vous ne la publiez pas." />
      <FormulaireSession />
    </>
  );
}
