import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { List, ListRow } from "@/components/ui/list-row";
import { DateBloc } from "@/components/agenda/DateBloc";
import { LigneDistribution } from "@/components/agenda/LigneDistribution";
import { DistributionDuJour } from "@/components/dashboard/DistributionDuJour";
import { BilletInscription } from "@/components/inscriptions/BilletInscription";
import { lireServeur } from "@/lib/api/serveur";
import { dateLongue, horaire, quand } from "@/lib/agenda";
import { jourAssociation } from "@/lib/distribution-du-jour";
import { inscriptionsAVenir, versBillet } from "@/lib/mes-inscriptions";
import type { DistributionResponse, InscriptionPersonnelle, TypeInscription } from "@/types/distribution";

const DATES_OUVERTES = 3;

interface Props {
  prenom: string;
  type: TypeInscription;
  duJour: DistributionResponse[];
}

/*
 * Accueil d'un beneficiaire ou d'un benevole : le prochain rendez-vous d'abord,
 * puis ce qu'il est possible de reserver.
 */
export async function AccueilMembre({ prenom, type, duJour }: Props) {
  const aujourdhui = jourAssociation(new Date());
  const [inscriptions, distributions] = await Promise.all([
    lireServeur<InscriptionPersonnelle[]>("/api/inscriptions/mes"),
    lireServeur<DistributionResponse[]>("/api/distributions"),
  ]);
  const avenir = inscriptionsAVenir(inscriptions ?? [], aujourdhui);
  const [prochaine, ...ensuite] = avenir;
  const dejaInscrit = new Set(avenir.map((i) => i.distributionId));
  const ouvertes = (distributions ?? [])
    .filter((d) => d.statut === "PUBLIEE" && d.date >= aujourdhui && !dejaInscrit.has(d.id))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, DATES_OUVERTES);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-display text-3xl leading-tight font-extrabold text-foreground sm:text-4xl">
          Bonjour {prenom}
        </h1>
        <p className="text-lg text-muted-foreground">
          {prochaine?.distributionDate
            ? `Prochain rendez-vous ${quand(prochaine.distributionDate, aujourdhui)}.`
            : "Aucun rendez-vous prévu pour l'instant."}
        </p>
      </header>

      <DistributionDuJour distributions={duJour} />

      {prochaine ? (
        <BilletInscription billet={versBillet(prochaine)} lienFiche />
      ) : (
        ouvertes.length > 0 && (
          <Link
            href={`/distributions/${ouvertes[0].id}`}
            className={buttonVariants({ size: "lg", className: "sm:self-start" })}
          >
            <CalendarDays aria-hidden="true" />
            Réserver pour {quand(ouvertes[0].date, aujourdhui)}
          </Link>
        )
      )}

      {ensuite.length > 0 && (
        <section aria-labelledby="ensuite" className="flex flex-col gap-3">
          <h2 id="ensuite" className="font-display text-xl font-bold text-foreground">
            Ensuite
          </h2>
          <List>
            {ensuite.map((i) => (
              <ListRow
                key={i.id}
                href={`/distributions/${i.distributionId}`}
                debut={i.distributionDate ? <DateBloc date={i.distributionDate} /> : undefined}
                titre={
                  <span className="tabular-nums">
                    {i.distributionDate && <span className="sr-only">{dateLongue(i.distributionDate)}, </span>}
                    {horaire(i.heureDebut, i.heureFin) ?? "Horaire à venir"}
                  </span>
                }
                sousTitre={
                  [i.distributionLieuNom ?? i.distributionLieu, i.statut === "LISTE_ATTENTE" ? "liste d'attente" : null]
                    .filter(Boolean)
                    .join(", ")
                }
              />
            ))}
          </List>
        </section>
      )}

      <section aria-labelledby="ouvertes" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="ouvertes" className="font-display text-xl font-bold text-foreground">
            Ouvertes aux inscriptions
          </h2>
          <Link href="/distributions" className="font-semibold text-primary underline underline-offset-4">
            Agenda
          </Link>
        </div>
        {ouvertes.length === 0 ? (
          <p className="text-base text-muted-foreground">
            Pas d&apos;autre date ouverte pour le moment. Les prochaines apparaîtront dans l&apos;agenda.
          </p>
        ) : (
          <List>
            {ouvertes.map((d) => (
              <LigneDistribution key={d.id} distribution={d} type={type} />
            ))}
          </List>
        )}
      </section>

    </div>
  );
}
