import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus, CalendarX, ListFilter } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DistributionCard } from "@/components/distributions/DistributionCard";
import type { DistributionResponse } from "@/types/distribution";
import type { MeResponse } from "@/types/auth";

export const metadata: Metadata = { title: "Distributions" };

async function fetchMeEtDistributions(cookieHeader: string): Promise<{
  me: MeResponse | null;
  distributions: DistributionResponse[];
}> {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";
  const headers = { Cookie: cookieHeader };

  const [meRes, distribRes] = await Promise.all([
    fetch(`${baseUrl}/api/auth/me`, { headers, cache: "no-store" }),
    fetch(`${baseUrl}/api/distributions`, { headers, cache: "no-store" }),
  ]);

  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const distributions = distribRes.ok ? ((await distribRes.json()) as DistributionResponse[]) : [];

  return { me, distributions };
}

export default async function DistributionsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const { me, distributions } = await fetchMeEtDistributions(cookieHeader);

  const estGestionnaire = me?.roles.some((r) =>
    ["coordinateur", "responsable", "super_admin"].includes(r),
  );

  const nbParStatut = distributions.reduce<Record<string, number>>((acc, d) => {
    acc[d.statut] = (acc[d.statut] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Distributions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {estGestionnaire
              ? "Gerez et suivez toutes les distributions de l'association."
              : "Consultez et inscrivez-vous aux distributions disponibles."}
          </p>
        </div>
        {estGestionnaire && (
          <Link href="/distributions/nouvelle" className={buttonVariants({ size: "sm" })}>
            <Plus className="mr-2 size-4" />
            Nouvelle distribution
          </Link>
        )}
      </div>

      {/* Compteurs par statut (gestionnaire) */}
      {estGestionnaire && distributions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[
            { statut: "BROUILLON", label: "Brouillon" },
            { statut: "PUBLIEE", label: "Publiee" },
            { statut: "EN_COURS", label: "En cours" },
            { statut: "TERMINEE", label: "Terminee" },
            { statut: "ANNULEE", label: "Annulee" },
          ]
            .filter((s) => (nbParStatut[s.statut] ?? 0) > 0)
            .map((s) => (
              <span
                key={s.statut}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
              >
                <ListFilter className="size-3" />
                {s.label}
                <span className="font-semibold text-foreground">{nbParStatut[s.statut]}</span>
              </span>
            ))}
        </div>
      )}

      {/* Contenu */}
      {distributions.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={CalendarX}
            title="Aucune distribution"
            description={
              estGestionnaire
                ? "Aucune distribution n'a ete creee. Commencez par en creer une."
                : "Aucune distribution n'est disponible pour le moment."
            }
            action={
              estGestionnaire
                ? { label: "Creer une distribution", href: "/distributions/nouvelle" }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {distributions.map((d) => (
            <DistributionCard key={d.id} distribution={d} estGestionnaire={estGestionnaire} />
          ))}
        </div>
      )}
    </div>
  );
}
