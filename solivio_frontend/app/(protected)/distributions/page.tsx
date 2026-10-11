import Link from "next/link";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import type { Metadata } from "next";
import { Plus, CalendarX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DistributionCard } from "@/components/distributions/DistributionCard";
import type { DistributionResponse } from "@/types/distribution";
import type { MeResponse } from "@/types/auth";

export const metadata: Metadata = { title: "Distributions" };

async function fetchMeEtDistributions(): Promise<{
  me: MeResponse | null;
  distributions: DistributionResponse[];
}> {
  const [me, distributions] = await Promise.all([
    lireMoi(),
    lireServeur<DistributionResponse[]>("/api/distributions"),
  ]);
  return { me, distributions: distributions ?? [] };
}

export default async function DistributionsPage() {
  const { me, distributions } = await fetchMeEtDistributions();

  const estGestionnaire = me?.roles.some((r) =>
    ["coordinateur", "responsable", "super_admin"].includes(r),
  );

  const nbParStatut = distributions.reduce<Record<string, number>>((acc, d) => {
    acc[d.statut] = (acc[d.statut] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* En-tete */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Distributions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {estGestionnaire
              ? "Gérez et suivez toutes les distributions de l'association."
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
            { statut: "BROUILLON", label: "Brouillon", cls: "bg-muted text-muted-foreground border-border" },
            { statut: "PUBLIEE",   label: "Publiée",   cls: "bg-primary text-primary-foreground border-transparent" },
            { statut: "EN_COURS",  label: "En cours",  cls: "bg-primary/10 text-primary border-primary/25" },
            { statut: "TERMINEE",  label: "Terminée",  cls: "bg-muted text-muted-foreground border-border" },
            { statut: "ANNULEE",   label: "Annulée",   cls: "bg-destructive/10 text-destructive border-destructive/30" },
          ]
            .filter((s) => (nbParStatut[s.statut] ?? 0) > 0)
            .map((s) => (
              <span
                key={s.statut}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${s.cls}`}
              >
                {s.label}
                <span className="font-bold">{nbParStatut[s.statut]}</span>
              </span>
            ))}
        </div>
      )}

      {/* Contenu */}
      {distributions.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <EmptyState
            icon={CalendarX}
            title="Aucune distribution"
            description={
              estGestionnaire
                ? "Aucune distribution n'a été créée. Commencez par en créer une."
                : "Aucune distribution n'est disponible pour le moment."
            }
            action={
              estGestionnaire
                ? { label: "Créer une distribution", href: "/distributions/nouvelle" }
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
