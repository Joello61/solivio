import { redirect } from "next/navigation";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import type { Metadata } from "next";
import { CatalogueGestionPanel } from "./CatalogueGestionPanel";
import { DeuxColonnes } from "@/components/ui/deux-colonnes";
import { EncartPhoto } from "@/components/shared/Encarts";
import { PHOTOS } from "@/lib/photos";
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
    <div className="flex flex-col gap-6">
      <PageHeader
        className="mb-0 sm:mb-0"
        titre="Catalogue des denrées"
        description={`${denrees.length} denrée${denrees.length > 1 ? "s" : ""}, proposée${denrees.length > 1 ? "s" : ""} à la saisie de la répartition.`}
      />
      <DeuxColonnes
        aside={
          <>
            <EncartPhoto photo={PHOTOS.colis} titre="À quoi sert le catalogue">
              Les noms proposés quand on note ce qu&apos;une distribution a reçu : la saisie va plus vite et les
              noms restent les mêmes d&apos;une semaine à l&apos;autre.
            </EncartPhoto>
          </>
        }
      >
        <CatalogueGestionPanel initialDenrees={denrees} />
      </DeuxColonnes>
    </div>
  );
}
