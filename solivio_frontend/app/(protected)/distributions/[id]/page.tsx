import { notFound } from "next/navigation";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Calendar,
  MapPin,
  Users,
  ClipboardList,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Percent,
  Tag,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DistributionStatutBadge } from "@/components/distributions/DistributionStatutBadge";
import { DistributionActions } from "@/components/distributions/DistributionActions";
import { InscriptionButton } from "@/components/distributions/InscriptionButton";
import { RoleBenevolePanel } from "@/components/distributions/RoleBenevolePanel";
import { CarteEmplacement } from "@/components/shared/CarteEmplacement";
import type { DistributionResponse, InscriptionResponse } from "@/types/distribution";
import {
  estGestionnaireDistribution,
  peutPointer,
  typeInscriptionPossible,
} from "@/lib/droits-distribution";
import type { MeResponse } from "@/types/auth";
import type { StatistiqueDistributionResponse } from "@/types/association";

export const metadata: Metadata = { title: "Détail distribution" };

async function fetchData(id: string): Promise<{
  distribution: DistributionResponse | null;
  me: MeResponse | null;
  inscrits: InscriptionResponse[];
  mesInscriptions: InscriptionResponse[];
  stats: StatistiqueDistributionResponse | null;
}> {
  const [distribution, me] = await Promise.all([
    lireServeur<DistributionResponse>(`/api/distributions/${id}`),
    lireMoi(),
  ]);
  if (!distribution) return { distribution: null, me: null, inscrits: [], mesInscriptions: [], stats: null };

  const estGestionnaire = estGestionnaireDistribution(me?.roles ?? []);
  const [inscrits, mesInscriptions, stats] = await Promise.all([
    estGestionnaire ? lireServeur<InscriptionResponse[]>(`/api/distributions/${id}/inscriptions`) : null,
    lireServeur<InscriptionResponse[]>(`/api/distributions/${id}/inscriptions/mes`),
    estGestionnaire && distribution.statut === "TERMINEE"
      ? lireServeur<StatistiqueDistributionResponse>(`/api/statistiques/distributions/${id}`)
      : null,
  ]);
  return { distribution, me, inscrits: inscrits ?? [], mesInscriptions: mesInscriptions ?? [], stats };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DistributionDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { distribution, me, inscrits, mesInscriptions, stats } = await fetchData(id);

  if (!distribution) notFound();

  const estGestionnaire = estGestionnaireDistribution(me?.roles ?? []);

  const dateFormatee = new Date(distribution.date + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const nbBeneficiairesInscrits = inscrits.filter(
    (i) => i.type === "BENEFICIAIRE" && i.statut === "CONFIRMEE",
  ).length;
  const nbBenevoles = inscrits.filter(
    (i) => i.type === "BENEVOLE" && i.statut === "CONFIRMEE",
  ).length;

  const monInscription = mesInscriptions.find(
    (i) => i.distributionId === id && (i.statut === "CONFIRMEE" || i.statut === "LISTE_ATTENTE"),
  );

  const inscritsVisibles = inscrits.filter((i) => i.statut !== "ANNULEE");
  const typeInscription = typeInscriptionPossible(me?.roles ?? []);
  const pointageBenevole =
    !estGestionnaire && peutPointer(me?.roles ?? [], distribution.statut, mesInscriptions);

  return (
    <div className="space-y-8">
      {/* En-tete */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-foreground font-display">{distribution.titre}</h1>
          <DistributionStatutBadge statut={distribution.statut} />
        </div>
        {distribution.motifAnnulation && (
          <p className="text-sm text-muted-foreground">
            Motif d&apos;annulation : {distribution.motifAnnulation}
          </p>
        )}
      </div>

      {/* Corps en 2 colonnes sur desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Colonne principale (2/3) */}
        <div className="space-y-6 lg:col-span-2">

          {/* Informations generales */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-5 space-y-3">
            <p className="text-sm font-semibold text-foreground font-display">
              Informations
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="size-4 shrink-0 text-muted-foreground" />
                <span className="capitalize text-foreground">{dateFormatee}</span>
              </div>
              {distribution.lieu?.adresseFormatee && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-foreground">{distribution.lieu.adresseFormatee}</span>
                </div>
              )}
              {distribution.description && (
                <p className="text-sm text-muted-foreground pt-1">{distribution.description}</p>
              )}
              {distribution.lieu && (
                distribution.lieu.latitude != null && distribution.lieu.longitude != null
              ) && (
                <CarteEmplacement
                  lieu={{
                    latitude: distribution.lieu!.latitude,
                    longitude: distribution.lieu!.longitude,
                    adresseFormatee: distribution.lieu!.adresseFormatee,
                  }}
                  interactive={true}
                />
              )}
            </div>
          </div>

          {/* Remplissage (gestionnaire uniquement) */}
          {estGestionnaire && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-5 space-y-3">
              <p className="text-sm font-semibold text-foreground font-display">
                Remplissage
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                    <Users className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">
                      {nbBeneficiairesInscrits}
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}/ {distribution.capaciteBeneficiaires}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">bénéficiaires confirmés</p>
                  </div>
                </div>
                {distribution.capaciteBenevoles != null && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                      <Users className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-base font-semibold">
                        {nbBenevoles}
                        <span className="text-sm font-normal text-muted-foreground">
                          {" "}/ {distribution.capaciteBenevoles}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">bénévoles confirmés</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Liste des inscrits (gestionnaire) */}
          {estGestionnaire && inscritsVisibles.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <p className="text-sm font-semibold text-foreground font-display">
                  Inscrits
                </p>
                <Badge variant="secondary" className="text-xs">
                  {inscritsVisibles.length}
                </Badge>
              </div>
              <div className="divide-y divide-border">
                {inscritsVisibles.map((inscrit) => (
                  <div key={inscrit.id} className="px-5 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">
                        {inscrit.nom} {inscrit.prenom}
                      </span>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        <Badge variant="outline" className="shrink-0">
                          {inscrit.type === "BENEFICIAIRE" ? "Bénéficiaire" : "Bénévole"}
                        </Badge>
                        {inscrit.statut === "LISTE_ATTENTE" && (
                          <Badge variant="secondary" className="shrink-0">
                            Attente #{inscrit.rangListeAttente}
                          </Badge>
                        )}
                        {inscrit.type === "BENEFICIAIRE" && inscrit.nombreAbsencesPassees > 0 && (
                          <Badge variant="destructive" className="shrink-0">
                            {inscrit.nombreAbsencesPassees} absence
                            {inscrit.nombreAbsencesPassees > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {inscrit.type === "BENEVOLE" && (
                      <div className="flex items-start gap-2 pl-0.5">
                        <Tag className="size-3.5 shrink-0 text-muted-foreground mt-0.5" />
                        <RoleBenevolePanel
                          distributionId={id}
                          inscriptionId={inscrit.id}
                          rolesInitiaux={inscrit.roles}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne laterale (1/3) */}
        <div className="space-y-6">

          {/* Outils de la distribution (gestionnaire) */}
          {estGestionnaire && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-5 space-y-3">
              <p className="text-sm font-semibold text-foreground font-display">
                Outils
              </p>
              <div className="space-y-2">
                {distribution.statut === "EN_COURS" && (
                  <Link
                    href={`/distributions/${id}/pointage`}
                    className="group flex items-center gap-3 rounded-xl border border-border/60 p-3 hover:bg-primary/10 hover:border-primary/40 transition-all"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/15 transition-colors">
                      <ClipboardList className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Pointage</p>
                      <p className="text-xs text-muted-foreground">Pointer les présences en temps réel</p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </Link>
                )}
                <Link
                  href={`/distributions/${id}/repartition`}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 p-3 hover:bg-primary/10 hover:border-primary/40 transition-all"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/15 transition-colors">
                    <Package className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Répartition des denrées</p>
                    <p className="text-xs text-muted-foreground">Calculer et ajuster les dotations</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </Link>
              </div>
            </div>
          )}

          {/* Actions gestionnaire */}
          {estGestionnaire && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-5 space-y-4">
              <p className="text-sm font-semibold text-foreground font-display">
                Actions
              </p>
              <DistributionActions
                distributionId={id}
                statut={distribution.statut}
                distributionDate={distribution.date}
              />
            </div>
          )}

          {/* Bilan final (terminee) */}
          {estGestionnaire && distribution.statut === "TERMINEE" && stats && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-5 space-y-4">
              <p className="text-sm font-semibold text-foreground font-display">
                Bilan de la distribution
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Users className="size-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Inscrits</p>
                  </div>
                  <p className="text-2xl font-bold">{stats.nbInscritsBeneficiaires}</p>
                </div>
                <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="size-3.5 text-primary" />
                    <p className="text-xs text-muted-foreground">Présents</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {stats.nbPresentsBeneficiaires}
                  </p>
                </div>
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <XCircle className="size-3.5 text-destructive" />
                    <p className="text-xs text-muted-foreground">Absents</p>
                  </div>
                  <p className="text-2xl font-bold text-destructive">{stats.nbAbsentsBeneficiaires}</p>
                </div>
                <div className="rounded-xl bg-muted p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Non pointes</p>
                  </div>
                  <p className="text-2xl font-bold">{stats.nbNonPointes}</p>
                </div>
              </div>
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="size-4 text-primary" />
                  <p className="text-sm font-medium text-primary">Taux de présence</p>
                </div>
                <p className="text-2xl font-bold text-primary leading-none">
                  {Number(stats.tauxPresence).toFixed(1)} %
                </p>
              </div>
              {stats.nbInscritsBenevoles > 0 && (
                <div className="flex items-center gap-3 text-sm border-t border-border pt-3">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{stats.nbInscritsBenevoles}</strong> bénévoles présents
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Pointage pour un benevole inscrit (le backend le lui ouvre) */}
          {pointageBenevole && (
            <Link
              href={`/distributions/${id}/pointage`}
              className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm hover:border-primary/40 transition-all"
            >
              <ClipboardList className="size-5 shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Pointage</p>
                <p className="text-xs text-muted-foreground">Pointer les arrivées des bénéficiaires</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </Link>
          )}

          {/* Mon inscription : ouverte a tout membre qui peut s'inscrire (spec 4.5) */}
          {typeInscription && distribution.statut === "PUBLIEE" && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-5 space-y-3">
              <p className="text-sm font-semibold text-foreground font-display">
                Mon inscription
              </p>
              <InscriptionButton
                distributionId={id}
                creneaux={distribution.creneaux}
                inscriptionExistante={monInscription ?? null}
                typeParDefaut={typeInscription}
              />
            </div>
          )}

          {/* Inscription en lecture seule une fois la distribution demarree */}
          {monInscription && (distribution.statut === "EN_COURS" || distribution.statut === "TERMINEE") && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-5 space-y-1">
              <p className="text-sm font-semibold text-foreground font-display">Mon inscription</p>
              <p className="text-sm text-muted-foreground">
                {monInscription.statut === "CONFIRMEE"
                  ? `Inscription confirmée (${monInscription.type === "BENEVOLE" ? "bénévole" : "bénéficiaire"}).`
                  : "Vous étiez sur liste d'attente."}
              </p>
            </div>
          )}

          {/* Message sur une distribution non publiee */}
          {!estGestionnaire && distribution.statut !== "PUBLIEE" && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-5">
              <p className="text-sm text-muted-foreground">
                {distribution.statut === "BROUILLON" &&
                  "Cette distribution n'est pas encore ouverte aux inscriptions."}
                {distribution.statut === "EN_COURS" && "Cette distribution est en cours."}
                {distribution.statut === "TERMINEE" && "Cette distribution est terminée."}
                {distribution.statut === "ANNULEE" && "Cette distribution a été annulée."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
