import { MapPin } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Jauge } from "@/components/ui/jauge";
import { DeuxColonnes } from "@/components/ui/deux-colonnes";
import { ReperesDistribution } from "@/components/shared/Reperes";
import { PageHeader } from "@/components/ui/page-header";
import { BilletInscription } from "@/components/inscriptions/BilletInscription";
import { PlanDepliable } from "@/components/distributions/PlanDepliable";
import { ReservationDistribution } from "@/components/distributions/ReservationDistribution";
import { dateLongue, libellePlaces, placesPour, plageDistribution } from "@/lib/agenda";
import { lienItineraire } from "@/lib/lieu";
import { jourAssociation } from "@/lib/distribution-du-jour";
import { estDesistementTardif } from "@/lib/mes-inscriptions";
import { cn } from "@/lib/utils";
import type { DistributionResponse, InscriptionResponse, TypeInscription } from "@/types/distribution";

interface Props {
  distribution: DistributionResponse;
  /* Inscriptions du membre a cette distribution, tous types confondus. */
  mesInscriptions: InscriptionResponse[];
  /* Types d'inscription ouverts au membre ; les deux s'il est benevole et beneficiaire. */
  types: TypeInscription[];
}

const MESSAGE_STATUT: Partial<Record<DistributionResponse["statut"], string>> = {
  BROUILLON: "Cette distribution n'est pas encore ouverte aux inscriptions.",
  EN_COURS: "La distribution a commencé.",
  TERMINEE: "Cette distribution est terminée.",
};

const TITRE_TYPE: Record<TypeInscription, string> = {
  BENEFICIAIRE: "Comme bénéficiaire",
  BENEVOLE: "Comme bénévole",
};

function estActive(i: InscriptionResponse): boolean {
  return i.statut === "CONFIRMEE" || i.statut === "LISTE_ATTENTE";
}

/*
 * Ce que le membre peut faire pour un type d'inscription : son billet s'il est inscrit,
 * sinon la reservation tant que la distribution est ouverte.
 */
function Participation({
  d,
  type,
  inscription,
}: {
  d: DistributionResponse;
  type: TypeInscription;
  inscription: InscriptionResponse | undefined;
}) {
  const places = placesPour(d, type);
  if (inscription && d.statut !== "ANNULEE" && d.statut !== "TERMINEE") {
    const creneau = d.creneaux.find((c) => c.id === inscription.creneauId);
    return (
      <>
        <BilletInscription
          billet={{
            inscriptionId: inscription.id,
            distributionId: d.id,
            date: d.date,
            heureDebut: creneau?.heureDebut ?? d.creneaux[0]?.heureDebut ?? null,
            heureFin: creneau?.heureFin ?? d.creneaux.at(-1)?.heureFin ?? null,
            lieuNom: d.lieu?.nom ?? null,
            adresse: d.lieu?.adresseFormatee ?? null,
            statut: inscription.statut === "LISTE_ATTENTE" ? "LISTE_ATTENTE" : "CONFIRMEE",
            rangListeAttente: inscription.rangListeAttente,
            benevole: inscription.type === "BENEVOLE",
            roles: inscription.roles.map((r) => r.libelle),
            desinscriptionPossible: inscription.presence === "NON_POINTE",
            desistementTardif: estDesistementTardif(inscription, d.date, jourAssociation(new Date())),
          }}
        />
        {inscription.statut === "LISTE_ATTENTE" && (
          <p className="text-base text-muted-foreground">
            Si une place se libère, elle vous revient dans l&apos;ordre de la liste et vous recevez un email.
            Rien à faire d&apos;ici là.
          </p>
        )}
      </>
    );
  }
  if (d.statut !== "PUBLIEE") return null;
  return (
    <div className="flex flex-col gap-6">
      {places && (
        <Jauge
          valeur={places.capacite - places.restantes}
          capacite={places.capacite}
          libelle={libellePlaces(places.restantes, type)}
          detail={`sur ${places.capacite}`}
          detailTon={places.restantes <= 0 ? "attente" : "neutre"}
        />
      )}
      <ReservationDistribution
        distributionId={d.id}
        creneaux={d.creneaux}
        modeCreneau={d.modeCreneau}
        type={type}
        placesRestantes={places?.restantes ?? null}
      />
    </div>
  );
}

/*
 * Fiche d'une distribution pour un beneficiaire ou un benevole : quand, ou,
 * combien de places, puis une seule action par type. Une fois inscrit, le billet
 * remplace la reservation.
 */
export function FicheMembre({ distribution: d, mesInscriptions, types }: Props) {
  const plage = plageDistribution(d);
  const itineraire = lienItineraire({
    latitude: d.lieu?.latitude ?? null,
    longitude: d.lieu?.longitude ?? null,
    adresseFormatee: d.lieu?.adresseFormatee ?? null,
  });
  const lieu = [d.lieu?.nom, d.lieu?.adresseFormatee].filter(Boolean).join(", ");
  const actives = mesInscriptions.filter(estActive);
  const annulee = d.statut === "ANNULEE";
  const plusieurs = types.length > 1;
  const aside = (
    <>
      {d.description && (
        <section className="rounded-3xl border border-border bg-card p-5">
          <h2 className="mb-1 font-display text-lg font-bold text-foreground">Le mot de l&apos;équipe</h2>
          <p className="text-base leading-relaxed whitespace-pre-line text-foreground">{d.description}</p>
        </section>
      )}
      {d.lieu?.latitude != null && d.lieu.longitude != null && (
        <PlanDepliable
          lieu={{ latitude: d.lieu.latitude, longitude: d.lieu.longitude, adresseFormatee: d.lieu.adresseFormatee }}
        />
      )}
      <ReperesDistribution benevole={(actives[0]?.type ?? types[0]) === "BENEVOLE"} />
    </>
  );

  return (
    <DeuxColonnes aside={aside}>
      <PageHeader
        className="mb-0 sm:mb-0"
        retour={{ href: "/distributions", libelle: "Agenda" }}
        surtitre={dateLongue(d.date)}
        titre={<span className={cn("tabular-nums", annulee && "line-through decoration-2")}>{plage ?? "Horaire à venir"}</span>}
        description={
          lieu && (
            <span className="flex items-start gap-2">
              <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0" />
              <span>
                {lieu}
                {itineraire && actives.length === 0 && (
                  <>
                    {" "}
                    <a
                      href={itineraire}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary underline underline-offset-4"
                    >
                      Itinéraire
                    </a>
                  </>
                )}
              </span>
            </span>
          )
        }
      />

      {annulee && (
        <Alert variant="destructive">
          <AlertTitle>Distribution annulée</AlertTitle>
          {d.motifAnnulation && <AlertDescription>{d.motifAnnulation}</AlertDescription>}
        </Alert>
      )}
      {MESSAGE_STATUT[d.statut] && actives.length === 0 && (
        <p className="text-base text-muted-foreground">{MESSAGE_STATUT[d.statut]}</p>
      )}

      {types.map((type) => {
        const inscription = actives.find((i) => i.type === type);
        return plusieurs ? (
          <section key={type} aria-labelledby={`participation-${type}`} className="flex flex-col gap-4">
            <h2 id={`participation-${type}`} className="font-display text-xl font-bold text-foreground">
              {TITRE_TYPE[type]}
            </h2>
            <Participation d={d} type={type} inscription={inscription} />
          </section>
        ) : (
          <section key={type} aria-label="Réservation" className="flex flex-col gap-4">
            <Participation d={d} type={type} inscription={inscription} />
          </section>
        );
      })}

      {d.statut === "TERMINEE" && mesInscriptions.some((i) => i.statut === "CONFIRMEE") && (
        <p className="text-base text-muted-foreground">Votre place était réservée pour cette distribution.</p>
      )}
    </DeuxColonnes>
  );
}
