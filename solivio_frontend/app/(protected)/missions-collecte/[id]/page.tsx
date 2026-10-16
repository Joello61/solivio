import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Warehouse } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DeuxColonnes } from "@/components/ui/deux-colonnes";
import { EncartPhoto } from "@/components/shared/Encarts";
import { PHOTOS } from "@/lib/photos";
import { PageHeader } from "@/components/ui/page-header";
import { Rail } from "@/components/ui/rail";
import { MissionActions } from "@/components/collecte/MissionActions";
import { actionsMission } from "@/lib/missions";
import { PlanDepliable } from "@/components/distributions/PlanDepliable";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { dateLongue } from "@/lib/agenda";
import { jourEtHeure } from "@/lib/engagements";
import { lienItineraire } from "@/lib/lieu";
import type { LieuMissionResponse, MissionCollecteResponse, StatutMission } from "@/types/collecte";

export const metadata: Metadata = { title: "Mission de collecte" };

const ETAPES = ["Libre", "Prise", "Collectée", "Déposée"];
const ETAPE: Record<Exclude<StatutMission, "ANNULEE">, number> = {
  DISPONIBLE: 0,
  PRISE_EN_CHARGE: 1,
  COLLECTE_EFFECTUEE: 2,
  DEPOT_VALIDE: 4,
};

const HORODATAGE = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

function Lieu({ titre, lieu, icone: Icone }: { titre: string; lieu: LieuMissionResponse; icone: typeof MapPin }) {
  const itineraire = lienItineraire(lieu);
  return (
    <div className="flex items-start gap-3">
      <Icone aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold text-muted-foreground">{titre}</span>
        <span className="text-base text-foreground">{lieu.adresseFormatee}</span>
        {itineraire && (
          <a
            href={itineraire}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit font-semibold text-primary underline underline-offset-4"
          >
            Itinéraire
          </a>
        )}
      </div>
    </div>
  );
}

/* Ce qui attend la personne qui lit, en une phrase. */
function prochaineEtape(m: MissionCollecteResponse, gestionnaire: boolean): string | null {
  if (m.statut === "DISPONIBLE") return "Personne ne s'en occupe encore.";
  if (m.statut === "PRISE_EN_CHARGE") {
    if (m.assigneAuLecteur) return "Après la collecte, un responsable la valide : vous pourrez alors confirmer le dépôt.";
    return gestionnaire ? "Validez la collecte une fois les denrées récupérées." : null;
  }
  if (m.statut === "COLLECTE_EFFECTUEE") {
    return m.assigneAuLecteur ? "Collecte validée. Confirmez quand les denrées sont déposées." : "En route vers le dépôt.";
  }
  return null;
}

export default async function DetailMissionCollectePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, mission] = await Promise.all([
    lireMoi(),
    lireServeur<MissionCollecteResponse>(`/api/missions-collecte/${id}`),
  ]);
  if (!mission) notFound();

  // Les missions sont gerees par les responsables ; coordinateurs et responsables
  // agissent aussi comme benevoles (hierarchie des roles, ADR-011).
  const estGestionnaire = me?.roles.some((r) => ["responsable", "super_admin"].includes(r)) ?? false;
  const estBenevole = me?.roles.some((r) => ["benevole", "coordinateur", "responsable"].includes(r)) ?? false;
  const droits = { statut: mission.statut, assigneAuLecteur: mission.assigneAuLecteur, estGestionnaire, estBenevole };
  const { date, heure } = jourEtHeure(mission.dateHeure);
  const etape = prochaineEtape(mission, estGestionnaire);
  const { principale, autres } = actionsMission(droits);

  const historique = [
    { libelle: "Prise en charge", quand: mission.datePriseEnCharge },
    { libelle: "Collecte validée", quand: mission.dateCollecteEffectuee },
    { libelle: "Dépôt confirmé", quand: mission.dateDepotValide },
  ].flatMap(({ libelle, quand }) => (quand ? [{ libelle, quand }] : []));

  const colonne = (
    <>
      <section aria-label="Lieux" className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5">
        {mission.lieuCollecte?.adresseFormatee && <Lieu titre="Collecte" lieu={mission.lieuCollecte} icone={MapPin} />}
        {mission.lieuDepot?.adresseFormatee && <Lieu titre="Dépôt" lieu={mission.lieuDepot} icone={Warehouse} />}
        {!mission.lieuCollecte?.adresseFormatee && !mission.lieuDepot?.adresseFormatee && (
          <p className="text-base text-muted-foreground">Les lieux seront précisés par un responsable.</p>
        )}
      </section>
      {mission.lieuCollecte?.latitude != null && mission.lieuCollecte.longitude != null && (
        <PlanDepliable lieu={mission.lieuCollecte} />
      )}
      <EncartPhoto photo={PHOTOS.camionCollecte} titre="Une collecte, étape par étape">
        Prise en charge par un bénévole, collecte validée par un responsable, puis dépôt au local.
      </EncartPhoto>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        className="mb-0 sm:mb-0"
        retour={{ href: "/missions-collecte", libelle: "Missions" }}
        surtitre={`${dateLongue(date)}, ${heure}`}
        titre={mission.titre}
        description={
          mission.assigneAuLecteur
            ? "Vous avez pris cette mission."
            : mission.benevoleNomComplet && `Prise par ${mission.benevoleNomComplet}.`
        }
      />

      <DeuxColonnes aside={colonne}>
        {mission.statut === "ANNULEE" ? (
          <Alert variant="destructive">
            <AlertTitle>Mission annulée</AlertTitle>
            {mission.raisonAnnulation && <AlertDescription>{mission.raisonAnnulation}</AlertDescription>}
          </Alert>
        ) : (
          <div className="flex flex-col gap-3">
            <Rail etapes={ETAPES} courante={ETAPE[mission.statut]} libelle="Avancement de la mission" />
            {etape && <p className="text-base text-muted-foreground">{etape}</p>}
          </div>
        )}

        {(principale || autres.length > 0) && <MissionActions missionId={mission.id} {...droits} />}

        {mission.description && (
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-1 font-display text-lg font-bold text-foreground">À savoir</h2>
            <p className="text-base leading-relaxed whitespace-pre-line text-foreground">{mission.description}</p>
          </section>
        )}

        {historique.length > 0 && (
          <section aria-labelledby="historique" className="flex flex-col gap-2">
            <h2 id="historique" className="font-display text-lg font-bold text-foreground">
              Historique
            </h2>
            <ol className="flex flex-col gap-1 text-base text-muted-foreground">
              {historique.map((h) => (
                <li key={h.libelle}>
                  {h.libelle} le {HORODATAGE.format(new Date(h.quand))}
                </li>
              ))}
            </ol>
          </section>
        )}
      </DeuxColonnes>
    </div>
  );
}
