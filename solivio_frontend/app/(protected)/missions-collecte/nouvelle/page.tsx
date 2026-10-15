import type { Metadata } from "next";
import { FormulaireMissionCollecte } from "@/components/collecte/FormulaireMissionCollecte";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Nouvelle mission collecte" };

export default function NouvelleMissionCollectePage() {
  return (
    <>
      <PageHeader retour={{ href: "/missions-collecte", libelle: "Missions" }} titre="Nouvelle mission" description="Les bénévoles sont prévenus dès sa création." />
      <FormulaireMissionCollecte />
    </>
  );
}
