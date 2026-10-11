import { redirect } from "next/navigation";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import type { Metadata } from "next";
import { CatalogueGestionPanel } from "./CatalogueGestionPanel";
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Catalogue des denrées</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {denrees.length} denrée{denrees.length !== 1 ? "s" : ""} dans le catalogue.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-6">
        <CatalogueGestionPanel initialDenrees={denrees} />
      </div>
    </div>
  );
}
