import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { PlanDepliable } from "@/components/distributions/PlanDepliable";
import { ActionsSession } from "@/components/reconditionnement/ActionsSession";
import { ParticipationSession } from "@/components/reconditionnement/ParticipationSession";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Jauge } from "@/components/ui/jauge";
import { List, ListRow } from "@/components/ui/list-row";
import { DeuxColonnes } from "@/components/ui/deux-colonnes";
import { ReperesReconditionnement } from "@/components/shared/ReperesActivites";
import { PageHeader } from "@/components/ui/page-header";
import { Rail } from "@/components/ui/rail";
import { Statut } from "@/components/ui/statut";
import { ETAPES_ACTIVITE, etapeActivite, quandActivite } from "@/lib/activites";
import { dateLongue, lieuCourt } from "@/lib/agenda";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { estGestionnaireDistribution } from "@/lib/droits-distribution";
import { STATUT_PRESENCE } from "@/lib/libelles";
import { lienItineraire } from "@/lib/lieu";
import { estResponsable } from "@/lib/roles";
import type { StatutPresence } from "@/types/distribution";
import type { InscriptionReconditionnementResponse, SessionReconditionnementResponse } from "@/types/reconditionnement";

export const metadata: Metadata = { title: "Session de reconditionnement" };

function capitale(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, me] = await Promise.all([
    lireServeur<SessionReconditionnementResponse>(`/api/sessions-reconditionnement/${id}`),
    lireMoi(),
  ]);
  if (!session) notFound();
  const roles = me?.roles ?? [];
  const gestion = estGestionnaireDistribution(roles);
  if (!gestion && !roles.includes("benevole")) notFound();
  const [inscrits, miennes] = await Promise.all([
    gestion ? lireServeur<InscriptionReconditionnementResponse[]>(`/api/sessions-reconditionnement/${id}/inscrits`) : null,
    lireServeur<InscriptionReconditionnementResponse[]>(`/api/sessions-reconditionnement/${id}/inscriptions/mes`),
  ]);
  const inscrit = (miennes ?? []).some((i) => i.statut === "CONFIRMEE");
  const { date, plage } = quandActivite(session.dateHeureDebut, session.dateHeureFin);
  const etape = etapeActivite(session.statut);
  const lieu = session.lieu;
  const itineraire = lieu ? lienItineraire(lieu) : null;
  const avecPresence = session.statut === "EN_COURS" || session.statut === "TERMINEE";
  const liste = (inscrits ?? []).filter((i) => i.statut === "CONFIRMEE");

  const colonne = (
    <>
      {lieu?.adresseFormatee && (
        <section aria-label="Lieu" className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold text-foreground">{lieuCourt(lieu)}</span>
              {lieu.nom && <span className="text-base text-muted-foreground">{lieu.adresseFormatee}</span>}
              {itineraire && (
                <a href={itineraire} target="_blank" rel="noopener noreferrer" className="w-fit font-semibold text-primary underline underline-offset-4">
                  Itinéraire
                </a>
              )}
            </div>
          </div>
          {lieu.latitude != null && lieu.longitude != null && <PlanDepliable lieu={lieu} />}
        </section>
      )}

      <section aria-label="Places" className="flex flex-col gap-2 rounded-3xl bg-secondary p-5">
        {session.capacite ? (
          <Jauge
            valeur={session.nbInscrits}
            capacite={session.capacite}
            libelle={`${session.nbInscrits} inscrits sur ${session.capacite}`}
            detail={session.nbInscrits >= session.capacite ? "Complet" : `${session.capacite - session.nbInscrits} places libres`}
          />
        ) : (
          <p className="text-base text-muted-foreground">
            {session.nbInscrits} inscrit{session.nbInscrits > 1 ? "s" : ""}, sans limite de places.
          </p>
        )}
      </section>
      {!gestion && <ReperesReconditionnement />}
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        className="mb-0 sm:mb-0"
        retour={{ href: "/reconditionnement", libelle: "Reconditionnement" }}
        surtitre="Reconditionnement"
        titre={session.titre}
        description={`${capitale(dateLongue(date))}, ${plage}.`}
        actions={
          gestion && (
            <ActionsSession sessionId={id} statut={session.statut} estResponsable={estResponsable(roles)} nbInscrits={session.nbInscrits} />
          )
        }
      />

      {session.statut === "ANNULEE" ? (
        <Alert variant="destructive">
          <AlertTitle>Session annulée</AlertTitle>
          {session.motifAnnulation && <AlertDescription>{session.motifAnnulation}</AlertDescription>}
        </Alert>
      ) : (
        gestion && etape !== null && <Rail etapes={ETAPES_ACTIVITE} courante={etape} libelle="Cycle de la session" />
      )}

      <DeuxColonnes aside={colonne}>
        {!gestion && (
          <ParticipationSession
            sessionId={id}
            inscrit={inscrit}
            ouverte={session.statut === "PUBLIEE"}
            complet={session.capacite != null && session.nbInscrits >= session.capacite}
          />
        )}

        {session.description && <p className="text-base whitespace-pre-line text-foreground">{session.description}</p>}

        {gestion && (
          <section aria-labelledby="titre-inscrits" className="flex flex-col gap-3">
            <h2 id="titre-inscrits" className="font-display text-xl font-bold text-foreground">
              Inscrits <span className="font-sans text-base font-normal text-muted-foreground tabular-nums">{liste.length}</span>
            </h2>
            {liste.length === 0 ? (
              <p className="text-base text-muted-foreground">Personne pour l&apos;instant.</p>
            ) : (
              <List>
                {liste.map((i) => (
                  <ListRow
                    key={i.id}
                    titre={i.nomComplet}
                    fin={avecPresence ? <Statut libelle={STATUT_PRESENCE[i.presence as StatutPresence]} /> : undefined}
                  />
                ))}
              </List>
            )}
          </section>
        )}
      </DeuxColonnes>
    </div>
  );
}
