import type { ReactNode } from "react";
import { CalendarX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListRow } from "@/components/ui/list-row";
import { PageHeader } from "@/components/ui/page-header";
import { DateBloc } from "@/components/agenda/DateBloc";
import { LigneDistribution } from "@/components/agenda/LigneDistribution";
import { FiltreUrl } from "@/components/shared/FiltreUrl";
import { TYPE_EVENEMENT, placesOuvertes, quandActivite } from "@/lib/activites";
import { lireServeur } from "@/lib/api/serveur";
import { dateLongue, grouperParSemaine, lieuCourt } from "@/lib/agenda";
import { jourAssociation } from "@/lib/distribution-du-jour";
import type { DistributionResponse, InscriptionPersonnelle, TypeInscription } from "@/types/distribution";
import type { EvenementResponse, ParticipationEvenementResponse } from "@/types/evenement";
import type { InscriptionReconditionnementResponse, SessionReconditionnementResponse } from "@/types/reconditionnement";

type Filtre = "tout" | "distributions" | "evenements" | "reconditionnement";

interface Props {
  distributions: DistributionResponse[];
  type: TypeInscription;
  roles: string[];
  filtre?: string;
}

interface Element {
  cle: string;
  date: string;
  genre: Exclude<Filtre, "tout">;
  rendu: ReactNode;
}

function ligneActivite(cle: string, href: string, debut: string, fin: string, titre: string, details: (string | null)[]): Element["rendu"] {
  const { date, plage } = quandActivite(debut, fin);
  return (
    <ListRow
      key={cle}
      href={href}
      debut={<DateBloc date={date} />}
      titre={
        <>
          <span className="sr-only">{dateLongue(date)}, </span>
          {titre}
        </>
      }
      sousTitre={[plage, ...details].filter(Boolean).join(". ")}
    />
  );
}

/*
 * Ce qui vient, semaine par semaine : distributions, et pour qui peut y aller,
 * evenements et sessions. Le passe vit dans Mes inscriptions.
 */
export async function AgendaMembre({ distributions, type, roles, filtre }: Props) {
  const aujourdhui = jourAssociation(new Date());
  const maintenant = new Date();
  const benevole = roles.includes("benevole");
  const [inscriptions, evenements, participations, sessions, inscriptionsSessions] = await Promise.all([
    lireServeur<InscriptionPersonnelle[]>("/api/inscriptions/mes"),
    lireServeur<EvenementResponse[]>("/api/evenements"),
    lireServeur<ParticipationEvenementResponse[]>("/api/evenements/mes-evenements"),
    // Le reconditionnement est reserve aux benevoles.
    benevole ? lireServeur<SessionReconditionnementResponse[]>("/api/sessions-reconditionnement") : null,
    benevole ? lireServeur<InscriptionReconditionnementResponse[]>("/api/sessions-reconditionnement/mes-inscriptions") : null,
  ]);
  const mesStatuts = new Map(
    (inscriptions ?? []).filter((i) => i.statut !== "ANNULEE").map((i) => [i.distributionId, i.statut]),
  );
  const mesEvenements = new Set((participations ?? []).map((p) => p.evenementId));
  const mesSessions = new Set((inscriptionsSessions ?? []).filter((i) => i.statut === "CONFIRMEE").map((i) => i.sessionId));

  const elements: Element[] = [
    ...distributions
      .filter((d) => d.date >= aujourdhui && d.statut !== "TERMINEE")
      .map((d) => ({
        cle: `d-${d.id}`,
        date: d.date,
        genre: "distributions" as const,
        rendu: <LigneDistribution key={d.id} distribution={d} type={type} monStatut={mesStatuts.get(d.id)} />,
      })),
    ...(evenements ?? [])
      .filter((e) => (e.statut === "PUBLIE" || e.statut === "EN_COURS") && new Date(e.dateHeureFin) > maintenant)
      .filter((e) => mesEvenements.has(e.id) || placesOuvertes(e, roles).length > 0)
      .map((e) => ({
        cle: `e-${e.id}`,
        date: quandActivite(e.dateHeureDebut, e.dateHeureFin).date,
        genre: "evenements" as const,
        rendu: ligneActivite(`e-${e.id}`, `/evenements/${e.id}`, e.dateHeureDebut, e.dateHeureFin, e.titre, [
          TYPE_EVENEMENT[e.type],
          mesEvenements.has(e.id) ? "Vous y participez" : null,
        ]),
      })),
    ...(sessions ?? [])
      .filter((s) => s.statut === "PUBLIEE" && new Date(s.dateHeureFin) > maintenant)
      .map((s) => ({
        cle: `s-${s.id}`,
        date: quandActivite(s.dateHeureDebut, s.dateHeureFin).date,
        genre: "reconditionnement" as const,
        rendu: ligneActivite(`s-${s.id}`, `/reconditionnement/${s.id}`, s.dateHeureDebut, s.dateHeureFin, s.titre, [
          lieuCourt(s.lieu),
          mesSessions.has(s.id) ? "Place réservée" : null,
        ]),
      })),
  ];

  const genres = new Set(elements.map((e) => e.genre));
  const options: { value: Filtre; label: string }[] = [
    { value: "tout", label: "Tout" },
    { value: "distributions", label: "Distributions" },
    ...(genres.has("evenements") ? [{ value: "evenements" as const, label: "Événements" }] : []),
    ...(genres.has("reconditionnement") ? [{ value: "reconditionnement" as const, label: "Reconditionnement" }] : []),
  ];
  const courant = options.find((o) => o.value === filtre)?.value ?? "tout";
  const visibles = courant === "tout" ? elements : elements.filter((e) => e.genre === courant);
  const semaines = grouperParSemaine(visibles, (e) => e.date, aujourdhui);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader className="mb-0 sm:mb-0" titre="Agenda" description="Ce qui vient. Touchez une date pour vous inscrire." />
      {options.length > 2 && <FiltreUrl label="Afficher" parametre="type" valeur={courant} defaut="tout" options={options} />}
      {semaines.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="Rien de prévu pour l'instant"
          description="Les prochaines dates apparaîtront ici dès qu'elles seront ouvertes."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {semaines.map((s) => (
            <section key={s.lundi} aria-labelledby={`semaine-${s.lundi}`} className="flex flex-col gap-3">
              <h2 id={`semaine-${s.lundi}`} className="font-display text-xl font-bold text-foreground">
                {s.libelle}
              </h2>
              <List>{s.elements.map((e) => e.rendu)}</List>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
