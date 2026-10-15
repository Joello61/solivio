import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { ActionsEvenement } from "@/components/evenement/ActionsEvenement";
import { ParticipationEvenement } from "@/components/evenement/ParticipationEvenement";
import { PlanDepliable } from "@/components/distributions/PlanDepliable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Jauge } from "@/components/ui/jauge";
import { List, ListRow } from "@/components/ui/list-row";
import { PageHeader } from "@/components/ui/page-header";
import { Rail } from "@/components/ui/rail";
import { Statut } from "@/components/ui/statut";
import {
  ETAPES_ACTIVITE,
  MODE_INSCRIPTION,
  PUBLIC_CIBLE,
  TYPE_EVENEMENT,
  etapeActivite,
  placesOuvertes,
  quandActivite,
} from "@/lib/activites";
import { dateLongue } from "@/lib/agenda";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { estGestionnaireDistribution } from "@/lib/droits-distribution";
import { STATUT_PRESENCE } from "@/lib/libelles";
import { lienItineraire } from "@/lib/lieu";
import { estResponsable } from "@/lib/roles";
import type { EvenementResponse, ParticipationEvenementResponse } from "@/types/evenement";

export const metadata: Metadata = { title: "Événement" };

function capitale(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

function Remplissage({ libelle, nombre, capacite }: { libelle: string; nombre: number; capacite: number | null }) {
  if (capacite) {
    return (
      <Jauge
        valeur={nombre}
        capacite={capacite}
        libelle={`${libelle} : ${nombre} sur ${capacite}`}
        detail={nombre >= capacite ? "Complet" : `${capacite - nombre} places libres`}
      />
    );
  }
  return (
    <p className="text-base text-foreground">
      <span className="font-semibold">{libelle}</span> : {nombre}, sans limite de places
    </p>
  );
}

function Inscrits({ titre, liste, avecPresence }: { titre: string; liste: ParticipationEvenementResponse[]; avecPresence: boolean }) {
  if (liste.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-display text-lg font-bold text-foreground">
        {titre} <span className="font-sans text-base font-normal text-muted-foreground tabular-nums">{liste.length}</span>
      </h3>
      <List>
        {liste.map((p) => (
          <ListRow
            key={p.id}
            titre={p.personneNomComplet ?? "Membre"}
            fin={avecPresence ? <Statut libelle={STATUT_PRESENCE[p.presence]} /> : undefined}
          />
        ))}
      </List>
    </section>
  );
}

export default async function DetailEvenementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [evenement, me] = await Promise.all([lireServeur<EvenementResponse>(`/api/evenements/${id}`), lireMoi()]);
  if (!evenement) notFound();
  const roles = me?.roles ?? [];
  const gestion = estGestionnaireDistribution(roles);
  if (!gestion && evenement.statut === "BROUILLON") notFound();

  const [participations, mesParticipations] = await Promise.all([
    gestion ? lireServeur<ParticipationEvenementResponse[]>(`/api/evenements/${id}/participations`) : null,
    lireServeur<ParticipationEvenementResponse[]>("/api/evenements/mes-evenements"),
  ]);
  const maParticipation = (mesParticipations ?? []).find((p) => p.evenementId === id) ?? null;
  const { date, plage } = quandActivite(evenement.dateHeureDebut, evenement.dateHeureFin);
  const etape = etapeActivite(evenement.statut);
  const mode = MODE_INSCRIPTION[evenement.modeInscription];
  const itineraire = evenement.lieuAdresseFormatee ? lienItineraire({ adresseFormatee: evenement.lieuAdresseFormatee, latitude: evenement.lieuLatitude, longitude: evenement.lieuLongitude }) : null;
  const avecPresence = evenement.modeInscription === "OBLIGATOIRE" && (evenement.statut === "EN_COURS" || evenement.statut === "TERMINE");
  const tous = participations ?? [];

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        className="mb-0 sm:mb-0"
        retour={{ href: "/evenements", libelle: "Événements" }}
        surtitre={TYPE_EVENEMENT[evenement.type]}
        titre={evenement.titre}
        description={`${capitale(dateLongue(date))}, ${plage}.`}
        actions={
          gestion && (
            <ActionsEvenement
              evenementId={id}
              statut={evenement.statut}
              modeInscription={evenement.modeInscription}
              estResponsable={estResponsable(roles)}
              nbInscrits={evenement.nbStaff + evenement.nbParticipants}
            />
          )
        }
      />

      {evenement.statut === "ANNULE" ? (
        <Alert variant="destructive">
          <AlertTitle>Événement annulé</AlertTitle>
          {evenement.raisonAnnulation && <AlertDescription>{evenement.raisonAnnulation}</AlertDescription>}
        </Alert>
      ) : (
        gestion && etape !== null && <Rail etapes={ETAPES_ACTIVITE} courante={etape} libelle="Cycle de l'événement" />
      )}

      {!gestion && (
        <ParticipationEvenement
          evenementId={id}
          monRole={maParticipation?.role ?? null}
          places={maParticipation ? [] : placesOuvertes(evenement, roles)}
        />
      )}

      {evenement.description && <p className="text-base whitespace-pre-line text-foreground">{evenement.description}</p>}

      {evenement.lieuAdresseFormatee && (
        <section aria-label="Lieu" className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="flex flex-col gap-0.5">
              <span className="text-base text-foreground">{evenement.lieuAdresseFormatee}</span>
              {itineraire && (
                <a href={itineraire} target="_blank" rel="noopener noreferrer" className="w-fit font-semibold text-primary underline underline-offset-4">
                  Itinéraire
                </a>
              )}
            </div>
          </div>
          {evenement.lieuLatitude != null && evenement.lieuLongitude != null && (
            <PlanDepliable lieu={{ latitude: evenement.lieuLatitude, longitude: evenement.lieuLongitude, adresseFormatee: evenement.lieuAdresseFormatee }} />
          )}
        </section>
      )}

      <section aria-labelledby="titre-organisation" className="flex flex-col gap-4">
        <h2 id="titre-organisation" className="font-display text-xl font-bold text-foreground">
          Organisation
        </h2>
        <p className="text-base text-muted-foreground">
          <span className="font-semibold text-foreground">{mode.libelle}.</span> {mode.consequence}
        </p>
        {evenement.aBesoiNStaff && <Remplissage libelle="Équipe" nombre={evenement.nbStaff} capacite={evenement.capaciteStaff} />}
        {evenement.ouvertParticipants && (
          <>
            <Remplissage libelle="Participants" nombre={evenement.nbParticipants} capacite={evenement.capaciteParticipants} />
            {evenement.publicParticipants && (
              <p className="text-base text-muted-foreground">Ouvert à : {PUBLIC_CIBLE[evenement.publicParticipants].toLowerCase()}.</p>
            )}
          </>
        )}
      </section>

      {gestion && (
        <section aria-labelledby="titre-inscrits" className="flex flex-col gap-4">
          <h2 id="titre-inscrits" className="font-display text-xl font-bold text-foreground">
            Inscrits
          </h2>
          {tous.length === 0 ? (
            <p className="text-base text-muted-foreground">Personne pour l&apos;instant.</p>
          ) : (
            <>
              <Inscrits titre="Équipe" liste={tous.filter((p) => p.role === "STAFF")} avecPresence={avecPresence} />
              <Inscrits titre="Participants" liste={tous.filter((p) => p.role === "PARTICIPANT")} avecPresence={avecPresence} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
