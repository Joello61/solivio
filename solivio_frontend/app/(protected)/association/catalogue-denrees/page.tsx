import { redirect } from "next/navigation";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import type { Metadata } from "next";
import { CatalogueGestionPanel } from "./CatalogueGestionPanel";
import { PageHeader } from "@/components/ui/page-header";
import type { CatalogueDenreeResponse } from "@/types/distribution";
import type { MeResponse } from "@/types/auth";

export const metadata: Metadata = { title: "Catalogue des denrées" };

async function fetchDonneesInitiales(): Promise<{
  denrees: CatalogueDenreeResponse[];
  me: MeResponse | null;
}> {
  const [denrees, me] = await Promise.all([
    lireServeur<CatalogueDenreeResponse[]>("/api/denrees/catalogue"),
    lireMoi(),
  ]);
  return { denrees: denrees ?? [], me };
}

export default async function CatalogueDenreesPage() {
  const { denrees, me } = await fetchDonneesInitiales();

  const rolesAutorises = ["responsable", "super_admin"];
  const estAutorise =
    me !== null && me.roles.some((r) => rolesAutorises.includes(r));

  if (!estAutorise) {
    redirect("/dashboard");
  }

  return (
    <>
      <PageHeader
        titre="Catalogue des denrées"
        description={`${denrees.length} denrée${denrees.length > 1 ? "s" : ""}, proposée${denrees.length > 1 ? "s" : ""} à la saisie de la répartition.`}
      />
      <CatalogueGestionPanel initialDenrees={denrees} />
    </>
  );
}
