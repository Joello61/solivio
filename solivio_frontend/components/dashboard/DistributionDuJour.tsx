import Link from "next/link";
import { ClipboardCheck, Clock, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DistributionResponse } from "@/types/distribution";

const heure = (h: string) => h.slice(0, 5);

/** Acces direct au pointage des distributions du jour, en tete du tableau de bord. */
export function DistributionDuJour({ distributions }: { distributions: DistributionResponse[] }) {
  if (distributions.length === 0) return null;
  return (
    <section aria-labelledby="distribution-du-jour" className="space-y-3">
      <h2 id="distribution-du-jour" className="text-base font-semibold text-foreground font-display">
        {distributions.length > 1 ? "Distributions du jour" : "Distribution du jour"}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {distributions.map((d) => {
          const enCours = d.statut === "EN_COURS";
          const premier = d.creneaux[0];
          const dernier = d.creneaux[d.creneaux.length - 1];
          return (
            <div
              key={d.id}
              className={cn(
                "rounded-2xl border bg-card p-5 shadow-sm space-y-4",
                enCours ? "border-primary/40" : "border-border/60",
              )}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {enCours && <span className="size-2 rounded-full bg-primary" aria-hidden />}
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {enCours ? "En cours" : "Pas encore démarrée"}
                  </span>
                </div>
                <p className="text-lg font-semibold text-foreground font-display">{d.titre}</p>
                {premier && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-4 shrink-0" />
                    {heure(premier.heureDebut)} - {heure(dernier.heureFin)}
                  </p>
                )}
                {d.lieu?.adresseFormatee && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-4 shrink-0" />
                    <span className="truncate">{d.lieu.adresseFormatee}</span>
                  </p>
                )}
              </div>
              {enCours ? (
                <Link href={`/distributions/${d.id}/pointage`} className={cn(buttonVariants(), "h-11 w-full")}>
                  <ClipboardCheck className="mr-2 size-4" />
                  Ouvrir le pointage
                </Link>
              ) : (
                <Link
                  href={`/distributions/${d.id}`}
                  className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full")}
                >
                  Voir la distribution
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
