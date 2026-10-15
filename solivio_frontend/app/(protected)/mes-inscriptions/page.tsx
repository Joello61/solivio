import type { Metadata } from "next";
import { CalendarSearch } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListRow } from "@/components/ui/list-row";
import { PageHeader } from "@/components/ui/page-header";
import { DateBloc } from "@/components/agenda/DateBloc";
import { BilletInscription } from "@/components/inscriptions/BilletInscription";
import { lireServeur } from "@/lib/api/serveur";
import { dateLongue, horaire } from "@/lib/agenda";
import { jourAssociation } from "@/lib/distribution-du-jour";
import { estAVenir, inscriptionsAVenir, versBillet } from "@/lib/mes-inscriptions";
import type { InscriptionPersonnelle } from "@/types/distribution";

export const metadata: Metadata = { title: "Mes inscriptions" };

/* Ce qui s'est passe, en mots neutres : une absence n'est pas une faute. */
function issue(i: InscriptionPersonnelle): string {
  if (i.distributionStatut === "ANNULEE") return "Distribution annulée";
  if (i.statut === "ANNULEE") return "Inscription annulée";
  if (i.statut === "LISTE_ATTENTE") return "Restée en liste d'attente";
  if (i.presence === "PRESENT") return "Présence notée";
  if (i.presence === "ABSENT") return "Absence";
  return "Inscription confirmée";
}

export default async function MesInscriptionsPage() {
  const inscriptions = (await lireServeur<InscriptionPersonnelle[]>("/api/inscriptions/mes")) ?? [];
  const aujourdhui = jourAssociation(new Date());
  const avenir = inscriptionsAVenir(inscriptions, aujourdhui);
  const passees = inscriptions
    .filter((i) => !estAVenir(i, aujourdhui))
    .sort((a, b) => (b.distributionDate ?? "").localeCompare(a.distributionDate ?? ""));

  return (
    <div className="max-w-2xl">
      <PageHeader titre="Mes inscriptions" />

      {inscriptions.length === 0 ? (
        <EmptyState
          icon={CalendarSearch}
          title="Aucune inscription pour l'instant"
          description="Choisissez une date dans l'agenda pour réserver votre place."
          action={{ label: "Voir l'agenda", href: "/distributions" }}
        />
      ) : (
        <div className="flex flex-col gap-10">
          <section aria-labelledby="a-venir" className="flex flex-col gap-3">
            <h2 id="a-venir" className="font-display text-xl font-bold text-foreground">
              À venir
            </h2>
            {avenir.length === 0 ? (
              <p className="text-base text-muted-foreground">
                Rien de prévu. L&apos;agenda montre les prochaines dates ouvertes.
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {avenir.map((i) => (
                  <BilletInscription key={i.id} billet={versBillet(i)} lienFiche />
                ))}
              </div>
            )}
          </section>

          {passees.length > 0 && (
            <section aria-labelledby="historique" className="flex flex-col gap-3">
              <h2 id="historique" className="font-display text-xl font-bold text-foreground">
                Historique
              </h2>
              <List>
                {passees.map((i) => (
                  <ListRow
                    key={i.id}
                    href={`/distributions/${i.distributionId}`}
                    debut={i.distributionDate ? <DateBloc date={i.distributionDate} avecMois /> : undefined}
                    titre={
                      <>
                        {i.distributionDate && <span className="sr-only">{dateLongue(i.distributionDate)}, </span>}
                        {i.distributionLieuNom ?? i.distributionLieu ?? "Distribution"}
                      </>
                    }
                    sousTitre={[issue(i), horaire(i.heureDebut, i.heureFin), i.type === "BENEVOLE" ? "bénévole" : null]
                      .filter(Boolean)
                      .join(", ")}
                  />
                ))}
              </List>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
