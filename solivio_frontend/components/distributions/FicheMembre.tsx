import Link from "next/link";
import { ClipboardCheck, MapPin } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Jauge } from "@/components/ui/jauge";
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
  monInscription: InscriptionResponse | undefined;
  /* Type d'inscription ouvert au membre, null s'il ne peut pas s'inscrire. */
  type: TypeInscription | null;
  pointageBenevole: boolean;
}

const MESSAGE_STATUT: Partial<Record<DistributionResponse["statut"], string>> = {
  BROUILLON: "Cette distribution n'est pas encore ouverte aux inscriptions.",
  EN_COURS: "La distribution a commencé.",
  TERMINEE: "Cette distribution est terminée.",
};

/*
 * Fiche d'une distribution pour un beneficiaire ou un benevole : quand, ou,
 * combien de places, puis une seule action. Une fois inscrit, le billet remplace
 * la reservation.
 */
export function FicheMembre({ distribution: d, monInscription, type, pointageBenevole }: Props) {
  const plage = plageDistribution(d);
  const places = type ? placesPour(d, type) : null;
  const itineraire = lienItineraire({
    latitude: d.lieu?.latitude ?? null,
    longitude: d.lieu?.longitude ?? null,
    adresseFormatee: d.lieu?.adresseFormatee ?? null,
  });
  const lieu = [d.lieu?.nom, d.lieu?.adresseFormatee].filter(Boolean).join(", ");
  const monCreneau = d.creneaux.find((c) => c.id === monInscription?.creneauId);
  const inscriptionActive =
    monInscription && (monInscription.statut === "CONFIRMEE" || monInscription.statut === "LISTE_ATTENTE")
      ? monInscription
      : undefined;
  const ouverte = d.statut === "PUBLIEE";
  const annulee = d.statut === "ANNULEE";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
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
                {itineraire && !inscriptionActive && (
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
        actions={
          pointageBenevole && (
            <Link href={`/distributions/${d.id}/pointage`} className={buttonVariants({ variant: "accent", size: "lg" })}>
              <ClipboardCheck aria-hidden="true" />
              Ouvrir le pointage
            </Link>
          )
        }
      />

      {annulee && (
        <Alert variant="destructive">
          <AlertTitle>Distribution annulée</AlertTitle>
          {d.motifAnnulation && <AlertDescription>{d.motifAnnulation}</AlertDescription>}
        </Alert>
      )}
      {MESSAGE_STATUT[d.statut] && !inscriptionActive && (
        <p className="text-base text-muted-foreground">{MESSAGE_STATUT[d.statut]}</p>
      )}

      {inscriptionActive && !annulee && d.statut !== "TERMINEE" ? (
        <BilletInscription
          billet={{
            inscriptionId: inscriptionActive.id,
            distributionId: d.id,
            date: d.date,
            heureDebut: monCreneau?.heureDebut ?? d.creneaux[0]?.heureDebut ?? null,
            heureFin: monCreneau?.heureFin ?? d.creneaux.at(-1)?.heureFin ?? null,
            lieuNom: d.lieu?.nom ?? null,
            adresse: d.lieu?.adresseFormatee ?? null,
            statut: inscriptionActive.statut === "LISTE_ATTENTE" ? "LISTE_ATTENTE" : "CONFIRMEE",
            rangListeAttente: inscriptionActive.rangListeAttente,
            benevole: inscriptionActive.type === "BENEVOLE",
            roles: inscriptionActive.roles.map((r) => r.libelle),
            desinscriptionPossible: inscriptionActive.presence === "NON_POINTE",
            desistementTardif: estDesistementTardif(inscriptionActive, d.date, jourAssociation(new Date())),
          }}
        />
      ) : (
        ouverte &&
        type && (
          <section aria-label="Réservation" className="flex flex-col gap-6">
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
          </section>
        )
      )}

      {inscriptionActive?.statut === "LISTE_ATTENTE" && !annulee && (
        <p className="text-base text-muted-foreground">
          Si une place se libère, elle vous revient dans l&apos;ordre de la liste et vous recevez un email.
          Rien à faire d&apos;ici là.
        </p>
      )}
      {d.statut === "TERMINEE" && monInscription?.statut === "CONFIRMEE" && (
        <p className="text-base text-muted-foreground">Votre place était réservée pour cette distribution.</p>
      )}

      {d.description && (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-1 font-display text-lg font-bold text-foreground">À savoir</h2>
          <p className="text-base leading-relaxed whitespace-pre-line text-foreground">{d.description}</p>
        </section>
      )}

      {d.lieu?.latitude != null && d.lieu.longitude != null && (
        <PlanDepliable
          lieu={{ latitude: d.lieu.latitude, longitude: d.lieu.longitude, adresseFormatee: d.lieu.adresseFormatee }}
        />
      )}
    </div>
  );
}
