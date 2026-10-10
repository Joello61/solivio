import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CatalogueGestionPanel } from "./CatalogueGestionPanel";
import type { CatalogueDenreeResponse } from "@/types/distribution";
import type { MeResponse } from "@/types/auth";

export const metadata: Metadata = { title: "Catalogue des denrées" };

async function fetchDonneesInitiales(cookieHeader: string): Promise<{
  denrees: CatalogueDenreeResponse[];
  me: MeResponse | null;
}> {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";
  const headers = { Cookie: cookieHeader };

  const [denreesRes, meRes] = await Promise.all([
    fetch(`${baseUrl}/api/denrees/catalogue`, { headers, cache: "no-store" }),
    fetch(`${baseUrl}/api/auth/me`, { headers, cache: "no-store" }),
  ]);

  const denrees = denreesRes.ok ? ((await denreesRes.json()) as CatalogueDenreeResponse[]) : [];
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;

  return { denrees, me };
}

export default async function CatalogueDenreesPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const { denrees, me } = await fetchDonneesInitiales(cookieHeader);

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
