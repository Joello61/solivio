import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CalendarSearch } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListRow } from "@/components/ui/list-row";
import { PageHeader } from "@/components/ui/page-header";
import { DateBloc } from "@/components/agenda/DateBloc";
import { LigneEngagement } from "@/components/agenda/LigneEngagement";
import { BilletInscription } from "@/components/inscriptions/BilletInscription";
import { lireEngagements, lireMoi, lireServeur } from "@/lib/api/serveur";
import { dateLongue, horaire } from "@/lib/agenda";
import { jourAssociation } from "@/lib/distribution-du-jour";
import { estAVenir, inscriptionsAVenir, versBillet } from "@/lib/mes-inscriptions";
import type { InscriptionPersonnelle } from "@/types/distribution";

export const metadata: Metadata = { title: "Mes engagements" };

/* Ce qui s'est passe, en mots neutres : une absence n'est pas une faute. */
function issue(i: InscriptionPersonnelle): string {
  if (i.distributionStatut === "ANNULEE") return "Distribution annulée";
  if (i.statut === "ANNULEE") return "Inscription annulée";
  if (i.statut === "LISTE_ATTENTE") return "Restée en liste d'attente";
  if (i.presence === "PRESENT") return "Présence notée";
  if (i.presence === "ABSENT") return "Absence";
  return "Inscription confirmée";
}

function LigneHistorique({ inscription: i, avecType }: { inscription: InscriptionPersonnelle; avecType: boolean }) {
  return (
    <ListRow
      href={`/distributions/${i.distributionId}`}
      debut={i.distributionDate ? <DateBloc date={i.distributionDate} avecMois /> : undefined}
      titre={
        <>
          {i.distributionDate && <span className="sr-only">{dateLongue(i.distributionDate)}, </span>}
          {i.distributionLieuNom ?? i.distributionLieu ?? "Distribution"}
        </>
      }
      sousTitre={[avecType ? "Distribution" : null, issue(i), horaire(i.heureDebut, i.heureFin), i.type === "BENEVOLE" ? "bénévole" : null]
        .filter(Boolean)
        .join(", ")}
    />
  );
}

/*
 * Tout ce a quoi le membre s'est engage : distributions en billets, puis
 * evenements, missions et sessions. Le passe se lit en une seule liste.
 */
export default async function MesInscriptionsPage() {
  const [me, inscriptions, autres] = await Promise.all([
    lireMoi(),
    lireServeur<InscriptionPersonnelle[]>("/api/inscriptions/mes"),
    lireEngagements(),
  ]);
  const titre = me?.roles.includes("beneficiaire") ? "Mes inscriptions" : "Mes engagements";
  const aujourdhui = jourAssociation(new Date());
  const distributions = inscriptions ?? [];
  const avenir = inscriptionsAVenir(distributions, aujourdhui);
  const autresAVenir = autres.filter((e) => e.aVenir);

  const historique: { date: string; ligne: ReactNode }[] = [
    ...distributions
      .filter((i) => !estAVenir(i, aujourdhui))
      .map((i) => ({ date: i.distributionDate ?? "", ligne: <LigneHistorique key={i.id} inscription={i} avecType={autres.length > 0} /> })),
    ...autres
      .filter((e) => !e.aVenir)
      .map((e) => ({ date: e.date, ligne: <LigneEngagement key={e.cle} engagement={e} avecMois /> })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="max-w-2xl">
      <PageHeader titre={titre} />

      {distributions.length === 0 && autres.length === 0 ? (
        <EmptyState
          icon={CalendarSearch}
          title="Rien de prévu pour l'instant"
          description="Choisissez une date dans l'agenda pour réserver votre place."
          action={{ label: "Voir l'agenda", href: "/distributions" }}
        />
      ) : (
        <div className="flex flex-col gap-10">
          <section aria-labelledby="a-venir" className="flex flex-col gap-3">
            <h2 id="a-venir" className="font-display text-xl font-bold text-foreground">
              À venir
            </h2>
            {avenir.length === 0 && autresAVenir.length === 0 && (
              <p className="text-base text-muted-foreground">
                Rien de prévu. L&apos;agenda montre les prochaines dates ouvertes.
              </p>
            )}
            {avenir.length > 0 && (
              <div className="grid gap-4 lg:grid-cols-2">
                {avenir.map((i) => (
                  <BilletInscription key={i.id} billet={versBillet(i, aujourdhui)} lienFiche />
                ))}
              </div>
            )}
            {autresAVenir.length > 0 && (
              <List>
                {autresAVenir.map((e) => (
                  <LigneEngagement key={e.cle} engagement={e} />
                ))}
              </List>
            )}
          </section>

          {historique.length > 0 && (
            <section aria-labelledby="historique" className="flex flex-col gap-3">
              <h2 id="historique" className="font-display text-xl font-bold text-foreground">
                Historique
              </h2>
              <List>{historique.map((h) => h.ligne)}</List>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
