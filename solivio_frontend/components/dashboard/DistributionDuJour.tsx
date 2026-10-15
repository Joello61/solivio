import Link from "next/link";
import { ClipboardCheck, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { lieuCourt, plageDistribution } from "@/lib/agenda";
import { cn } from "@/lib/utils";
import type { DistributionResponse } from "@/types/distribution";

/* Acces direct au jour J des distributions du jour, en tete de l'accueil et du planning. */
export function DistributionDuJour({ distributions }: { distributions: DistributionResponse[] }) {
  if (distributions.length === 0) return null;
  return (
    <section aria-label={distributions.length > 1 ? "Distributions du jour" : "Distribution du jour"} className="grid gap-3 lg:grid-cols-2">
      {distributions.map((d) => {
        const enCours = d.statut === "EN_COURS";
        const lieu = lieuCourt(d.lieu);
        return (
          <div
            key={d.id}
            className={cn(
              "flex flex-col gap-4 rounded-xl border-2 bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
              enCours ? "border-accent" : "border-border",
            )}
          >
            <div className="flex min-w-0 flex-col gap-1">
              <p className="flex items-center gap-2 font-mono text-sm font-semibold tracking-wider text-primary uppercase">
                {enCours && <span aria-hidden="true" className="size-2 rounded-full bg-accent" />}
                {enCours ? "En cours" : "Aujourd'hui"}
              </p>
              <p className="font-display text-2xl leading-tight font-extrabold tabular-nums text-foreground">
                {plageDistribution(d) ?? d.titre}
              </p>
              {lieu && (
                <p className="flex items-center gap-1.5 text-base text-muted-foreground">
                  <MapPin aria-hidden="true" className="size-4 shrink-0" />
                  <span className="truncate">{lieu}</span>
                </p>
              )}
            </div>
            {enCours ? (
              <Link
                href={`/distributions/${d.id}/pointage`}
                className={buttonVariants({ variant: "accent", size: "lg", className: "shrink-0" })}
              >
                <ClipboardCheck aria-hidden="true" />
                Ouvrir le jour J
              </Link>
            ) : (
              <Link href={`/distributions/${d.id}`} className={buttonVariants({ variant: "secondary", size: "lg", className: "shrink-0" })}>
                Voir la distribution
              </Link>
            )}
          </div>
        );
      })}
    </section>
  );
}
