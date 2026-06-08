import { cookies } from "next/headers";
import { notFound } from "next/navigation";
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
import type { DistributionResponse, InscriptionResponse, TypeInscription } from "@/types/distribution";
import type { MeResponse } from "@/types/auth";
import type { StatistiqueDistributionResponse } from "@/types/association";

export const metadata: Metadata = { title: "Detail distribution" };

async function fetchData(
  id: string,
  cookieHeader: string,
): Promise<{
  distribution: DistributionResponse | null;
  me: MeResponse | null;
  inscrits: InscriptionResponse[];
  mesInscriptions: InscriptionResponse[];
  stats: StatistiqueDistributionResponse | null;
}> {
  const base = process.env.API_URL ?? "http://localhost:8080";
  const h = { Cookie: cookieHeader };

  const [distRes, meRes] = await Promise.all([
    fetch(`${base}/api/distributions/${id}`, { headers: h, cache: "no-store" }),
    fetch(`${base}/api/auth/me`, { headers: h, cache: "no-store" }),
  ]);

  if (!distRes.ok) return { distribution: null, me: null, inscrits: [], mesInscriptions: [], stats: null };

  const distribution = (await distRes.json()) as DistributionResponse;
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;

  const estGestionnaire = me?.roles.some((r) =>
    ["coordinateur", "responsable", "super_admin"].includes(r),
  );

  const [inscritsRes, mesRes, statsRes] = await Promise.all([
    estGestionnaire
      ? fetch(`${base}/api/distributions/${id}/inscriptions`, { headers: h, cache: "no-store" })
      : Promise.resolve(null),
    fetch(`${base}/api/distributions/${id}/inscriptions/mes`, { headers: h, cache: "no-store" }),
    estGestionnaire && distribution.statut === "TERMINEE"
      ? fetch(`${base}/api/statistiques/distributions/${id}`, { headers: h, cache: "no-store" })
      : Promise.resolve(null),
  ]);

  const inscrits = inscritsRes?.ok ? ((await inscritsRes.json()) as InscriptionResponse[]) : [];
  const mesInscriptions = mesRes?.ok ? ((await mesRes.json()) as InscriptionResponse[]) : [];
  const stats = statsRes?.ok ? ((await statsRes.json()) as StatistiqueDistributionResponse) : null;

  return { distribution, me, inscrits, mesInscriptions, stats };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DistributionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const { distribution, me, inscrits, mesInscriptions, stats } = await fetchData(id, cookieHeader);

  if (!distribution) notFound();

  const estGestionnaire = me?.roles.some((r) =>
    ["coordinateur", "responsable", "super_admin"].includes(r),
  );

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

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">{distribution.titre}</h1>
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
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Informations
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="size-4 shrink-0 text-muted-foreground" />
                <span className="capitalize text-foreground">{dateFormatee}</span>
              </div>
              {distribution.lieu && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-foreground">{distribution.lieu}</span>
                </div>
              )}
              {distribution.description && (
                <p className="text-sm text-muted-foreground pt-1">{distribution.description}</p>
              )}
            </div>
          </div>

          {/* Remplissage (gestionnaire uniquement) */}
          {estGestionnaire && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Remplissage
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">
                      {nbBeneficiairesInscrits}
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}/ {distribution.capaciteBeneficiaires}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">beneficiaires confirmes</p>
                  </div>
                </div>
                {distribution.capaciteBenevoles != null && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Users className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-base font-semibold">
                        {nbBenevoles}
                        <span className="text-sm font-normal text-muted-foreground">
                          {" "}/ {distribution.capaciteBenevoles}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">benevoles confirmes</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Liste des inscrits (gestionnaire) */}
          {estGestionnaire && inscritsVisibles.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                        <Badge variant="outline" className="text-[11px] shrink-0">
                          {inscrit.type === "BENEFICIAIRE" ? "Beneficiaire" : "Benevole"}
                        </Badge>
                        {inscrit.statut === "LISTE_ATTENTE" && (
                          <Badge variant="secondary" className="text-[11px] shrink-0">
                            Attente #{inscrit.rangListeAttente}
                          </Badge>
                        )}
                        {inscrit.type === "BENEFICIAIRE" && inscrit.nombreAbsencesPassees > 0 && (
                          <Badge variant="destructive" className="text-[11px] shrink-0">
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
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Outils
              </p>
              <div className="space-y-2">
                {distribution.statut === "EN_COURS" && (
                  <Link
                    href={`/distributions/${id}/pointage`}
                    className="group flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/40 hover:border-primary/30 transition-all"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <ClipboardList className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Pointage</p>
                      <p className="text-xs text-muted-foreground">Pointer les presences en temps reel</p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </Link>
                )}
                <Link
                  href={`/distributions/${id}/repartition`}
                  className="group flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/40 hover:border-primary/30 transition-all"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <Package className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Repartition des denrees</p>
                    <p className="text-xs text-muted-foreground">Calculer et ajuster les dotations</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </Link>
              </div>
            </div>
          )}

          {/* Actions gestionnaire */}
          {estGestionnaire && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bilan de la distribution
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Users className="size-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Inscrits</p>
                  </div>
                  <p className="text-xl font-bold">{stats.nbInscritsBeneficiaires}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-xs text-muted-foreground">Presents</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    {stats.nbPresentsBeneficiaires}
                  </p>
                </div>
                <div className="rounded-lg bg-destructive/5 p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <XCircle className="size-3.5 text-destructive" />
                    <p className="text-xs text-muted-foreground">Absents</p>
                  </div>
                  <p className="text-xl font-bold text-destructive">{stats.nbAbsentsBeneficiaires}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Non pointes</p>
                  </div>
                  <p className="text-xl font-bold">{stats.nbNonPointes}</p>
                </div>
              </div>
              <div className="rounded-lg bg-primary/10 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="size-4 text-primary" />
                  <p className="text-sm font-medium text-primary">Taux de presence</p>
                </div>
                <p className="text-lg font-bold text-primary">
                  {Number(stats.tauxPresence).toFixed(1)} %
                </p>
              </div>
              {stats.nbInscritsBenevoles > 0 && (
                <div className="flex items-center gap-3 text-sm border-t border-border pt-3">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{stats.nbInscritsBenevoles}</strong> benevoles presents
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mon inscription (beneficiaire) */}
          {!estGestionnaire && distribution.statut === "PUBLIEE" && me && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mon inscription
              </p>
              <InscriptionButton
                distributionId={id}
                creneaux={distribution.creneaux}
                inscriptionExistante={monInscription ?? null}
                typeParDefaut={
                  (me.roles.includes("benevole") && !me.roles.includes("beneficiaire")
                    ? "BENEVOLE"
                    : "BENEFICIAIRE") as TypeInscription
                }
              />
            </div>
          )}

          {/* Message pour les beneficiaires sur une distrib non publiee */}
          {!estGestionnaire && distribution.statut !== "PUBLIEE" && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">
                {distribution.statut === "BROUILLON" &&
                  "Cette distribution n'est pas encore ouverte aux inscriptions."}
                {distribution.statut === "EN_COURS" && "Cette distribution est en cours."}
                {distribution.statut === "TERMINEE" && "Cette distribution est terminee."}
                {distribution.statut === "ANNULEE" && "Cette distribution a ete annulee."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
