import Link from "next/link";
import { BandeauAccueil } from "@/components/accueil/BandeauAccueil";
import { CalendarDays } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { List, ListRow } from "@/components/ui/list-row";
import { DateBloc } from "@/components/agenda/DateBloc";
import { LigneDistribution } from "@/components/agenda/LigneDistribution";
import { LigneEngagement } from "@/components/agenda/LigneEngagement";
import { DistributionDuJour } from "@/components/dashboard/DistributionDuJour";
import { BilletInscription } from "@/components/inscriptions/BilletInscription";
import { lireEngagements, lireServeur } from "@/lib/api/serveur";
import { PHOTOS } from "@/lib/photos";
import { dateLongue, horaire, quand } from "@/lib/agenda";
import { jourAssociation } from "@/lib/distribution-du-jour";
import { evenementCherchantEquipe, missionAPrendre, placesEquipe, type Engagement } from "@/lib/engagements";
import { inscriptionsAVenir, versBillet } from "@/lib/mes-inscriptions";
import type { MissionCollecteResponse } from "@/types/collecte";
import type {
  DistributionResponse,
  InscriptionPersonnelle,
  InscriptionResponse,
  TypeInscription,
} from "@/types/distribution";
import type { EvenementResponse } from "@/types/evenement";

const DATES_OUVERTES = 3;
const BESOINS = 3;

/* Roles attribues au benevole sur sa prochaine distribution. */
async function rolesSur(i: InscriptionPersonnelle | undefined): Promise<string[] | undefined> {
  if (i?.type !== "BENEVOLE") return undefined;
  const miennes = await lireServeur<InscriptionResponse[]>(`/api/distributions/${i.distributionId}/inscriptions/mes`);
  return miennes?.find((m) => m.id === i.id)?.roles.map((r) => r.libelle);
}

/* Missions libres et evenements qui cherchent une equipe, les plus proches d'abord. */
async function besoinsBenevoles(maintenant: Date, dejaPris: Set<string>): Promise<Engagement[]> {
  const [missions, evenements] = await Promise.all([
    lireServeur<MissionCollecteResponse[]>("/api/missions-collecte?statut=DISPONIBLE"),
    lireServeur<EvenementResponse[]>("/api/evenements"),
  ]);
  return [
    ...(missions ?? []).filter((m) => new Date(m.dateHeure) >= maintenant).map(missionAPrendre),
    ...(evenements ?? [])
      .filter((e) => (placesEquipe(e) ?? 0) > 0 && new Date(e.dateHeureDebut) >= maintenant)
      .map(evenementCherchantEquipe),
  ]
    .filter((e) => !dejaPris.has(e.href))
    .sort((a, b) => `${a.date}${a.heure}`.localeCompare(`${b.date}${b.heure}`))
    .slice(0, BESOINS);
}

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
  const maintenant = new Date();
  const aujourdhui = jourAssociation(maintenant);
  const benevole = type === "BENEVOLE";
  const [inscriptions, distributions, autres] = await Promise.all([
    lireServeur<InscriptionPersonnelle[]>("/api/inscriptions/mes"),
    lireServeur<DistributionResponse[]>("/api/distributions"),
    lireEngagements(maintenant),
  ]);
  const avenir = inscriptionsAVenir(inscriptions ?? [], aujourdhui);
  const [prochaine, ...ensuite] = avenir;
  const autresAVenir = autres.filter((e) => e.aVenir);
  const [roles, besoins] = await Promise.all([
    rolesSur(prochaine),
    benevole ? besoinsBenevoles(maintenant, new Set(autres.map((e) => e.href))) : [],
  ]);
  const dejaInscrit = new Set(avenir.map((i) => i.distributionId));
  // Un benevole voit d'abord les distributions ou il manque du monde.
  const ouvertes = (distributions ?? [])
    .filter((d) => d.statut === "PUBLIEE" && d.date >= aujourdhui && !dejaInscrit.has(d.id))
    .filter((d) => !benevole || (d.remplissage.placesRestantesBenevoles ?? 1) > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, DATES_OUVERTES);

  const suite = [
    ...ensuite.map((i) => ({
      moment: `${i.distributionDate}${i.heureDebut ?? ""}`,
      ligne: (
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
          sousTitre={[
            "Distribution",
            i.distributionLieuNom ?? i.distributionLieu,
            i.statut === "LISTE_ATTENTE" ? "liste d'attente" : null,
          ]
            .filter(Boolean)
            .join(", ")}
        />
      ),
    })),
    ...autresAVenir.map((e) => ({ moment: `${e.date}${e.heure}`, ligne: <LigneEngagement key={e.cle} engagement={e} /> })),
  ].sort((a, b) => a.moment.localeCompare(b.moment));

  const prochainJour = [prochaine?.distributionDate, autresAVenir[0]?.date].filter(Boolean).sort()[0];

  const enCours = duJour.filter((d) => d.statut === "EN_COURS");

  return (
    <div className="flex flex-col gap-8">
      <BandeauAccueil
        surtitre={dateLongue(aujourdhui)}
        titre={`Bonjour ${prenom}`}
        description={
          prochainJour ? `Prochain rendez-vous ${quand(prochainJour, aujourdhui)}.` : "Aucun rendez-vous prévu pour l'instant."
        }
        photo={benevole ? PHOTOS.equipeSoiree : PHOTOS.colis}
      >
        {/* Avant le demarrage, le billet suffit ; ensuite, le pointage est a portee. */}
        {enCours.length > 0 && <DistributionDuJour distributions={enCours} />}
      </BandeauAccueil>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          {prochaine ? (
            <BilletInscription billet={versBillet(prochaine, aujourdhui, roles)} lienFiche />
          ) : (
            suite.length === 0 &&
            ouvertes.length > 0 && (
              <Link
                href={`/distributions/${ouvertes[0].id}`}
                className={buttonVariants({ size: "lg", className: "sm:self-start" })}
              >
                <CalendarDays aria-hidden="true" />
                {benevole ? "Venir aider" : "Réserver"} {quand(ouvertes[0].date, aujourdhui)}
              </Link>
            )
          )}

          {suite.length > 0 && (
            <section aria-labelledby="ensuite" className="flex flex-col gap-3">
              <h2 id="ensuite" className="font-display text-xl font-bold text-foreground">
                {prochaine ? "Ensuite" : "À venir"}
              </h2>
              <List>{suite.map((s) => s.ligne)}</List>
            </section>
          )}
        </div>

        <section aria-labelledby="ouvertes" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="ouvertes" className="font-display text-xl font-bold text-foreground">
              {benevole ? "On a besoin de vous" : "Ouvertes aux inscriptions"}
            </h2>
            <Link href="/distributions" className="font-semibold text-primary underline underline-offset-4">
              Agenda
            </Link>
          </div>
          {ouvertes.length === 0 && besoins.length === 0 ? (
            <p className="text-base text-muted-foreground">
              {benevole
                ? "Toutes les équipes sont au complet pour le moment. Merci !"
                : "Pas d'autre date ouverte pour le moment. Les prochaines apparaîtront dans l'agenda."}
            </p>
          ) : (
            <List>
              {ouvertes.map((d) => (
                <LigneDistribution key={d.id} distribution={d} type={type} />
              ))}
              {besoins.map((e) => (
                <LigneEngagement key={e.cle} engagement={e} />
              ))}
            </List>
          )}
        </section>
      </div>
    </div>
  );
}
