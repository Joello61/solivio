import { CalendarX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { List } from "@/components/ui/list-row";
import { PageHeader } from "@/components/ui/page-header";
import { LigneDistribution } from "@/components/agenda/LigneDistribution";
import { lireServeur } from "@/lib/api/serveur";
import { grouperParSemaine } from "@/lib/agenda";
import { jourAssociation } from "@/lib/distribution-du-jour";
import type { DistributionResponse, InscriptionPersonnelle, TypeInscription } from "@/types/distribution";

interface Props {
  distributions: DistributionResponse[];
  type: TypeInscription;
}

/* Les prochaines distributions, semaine par semaine ; le passe vit dans Mes inscriptions. */
export async function AgendaMembre({ distributions, type }: Props) {
  const aujourdhui = jourAssociation(new Date());
  const inscriptions = (await lireServeur<InscriptionPersonnelle[]>("/api/inscriptions/mes")) ?? [];
  const mesStatuts = new Map(
    inscriptions.filter((i) => i.statut !== "ANNULEE").map((i) => [i.distributionId, i.statut]),
  );
  const aVenir = distributions.filter((d) => d.date >= aujourdhui && d.statut !== "TERMINEE");
  const semaines = grouperParSemaine(aVenir, (d) => d.date, aujourdhui);

  return (
    <div className="max-w-2xl">
      <PageHeader titre="Agenda" description="Les prochaines distributions. Touchez une date pour réserver." />
      {semaines.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="Pas de distribution prévue"
          description="Les prochaines dates apparaîtront ici dès qu'elles seront ouvertes."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {semaines.map((s) => (
            <section key={s.lundi} aria-labelledby={`semaine-${s.lundi}`} className="flex flex-col gap-3">
              <h2 id={`semaine-${s.lundi}`} className="font-display text-xl font-bold text-foreground">
                {s.libelle}
              </h2>
              <List>
                {s.elements.map((d) => (
                  <LigneDistribution key={d.id} distribution={d} type={type} monStatut={mesStatuts.get(d.id)} />
                ))}
              </List>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
