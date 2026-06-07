import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Calendar, MapPin, Users, ClipboardList, Tag, Package, CheckCircle, XCircle, Clock, Percent } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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

  // Filtrer sur la distribution courante (le backend renvoie toutes les inscriptions de l'utilisateur).
  const monInscription = mesInscriptions.find(
    (i) => i.distributionId === id && (i.statut === "CONFIRMEE" || i.statut === "LISTE_ATTENTE"),
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">{distribution.titre}</h1>
            <DistributionStatutBadge statut={distribution.statut} />
          </div>
          {distribution.motifAnnulation && (
            <p className="text-sm text-muted-foreground">Motif : {distribution.motifAnnulation}</p>
          )}
        </div>
        {estGestionnaire && (
          <div className="flex gap-2">
            {distribution.statut === "EN_COURS" && (
              <Link
                href={`/distributions/${id}/pointage`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <ClipboardList className="mr-2 size-4" />
                Pointage
              </Link>
            )}
            <Link
              href={`/distributions/${id}/repartition`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Package className="mr-2 size-4" />
              Repartition
            </Link>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="size-4 shrink-0" />
          <span>{dateFormatee}</span>
        </div>
        {distribution.lieu && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            <span>{distribution.lieu}</span>
          </div>
        )}
        {distribution.description && (
          <p className="text-sm text-foreground">{distribution.description}</p>
        )}
      </div>

      {estGestionnaire && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-medium">Remplissage en temps reel</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {nbBeneficiairesInscrits} / {distribution.capaciteBeneficiaires}
                </p>
                <p className="text-xs text-muted-foreground">beneficiaires confirmes</p>
              </div>
            </div>
            {distribution.capaciteBenevoles != null && (
              <div className="flex items-center gap-3">
                <Users className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {nbBenevoles} / {distribution.capaciteBenevoles}
                  </p>
                  <p className="text-xs text-muted-foreground">benevoles confirmes</p>
                </div>
              </div>
            )}
          </div>

          <DistributionActions distributionId={id} statut={distribution.statut} />
        </div>
      )}

      {estGestionnaire && distribution.statut === "TERMINEE" && stats && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-medium">Statistiques finales</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-lg font-semibold">{stats.nbInscritsBeneficiaires}</p>
                <p className="text-xs text-muted-foreground">beneficiaires inscrits</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="size-5 text-green-600 dark:text-green-400 shrink-0" />
              <div>
                <p className="text-lg font-semibold">{stats.nbPresentsBeneficiaires}</p>
                <p className="text-xs text-muted-foreground">presents</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <XCircle className="size-5 text-destructive shrink-0" />
              <div>
                <p className="text-lg font-semibold">{stats.nbAbsentsBeneficiaires}</p>
                <p className="text-xs text-muted-foreground">absents</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="size-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-lg font-semibold">{stats.nbNonPointes}</p>
                <p className="text-xs text-muted-foreground">non pointes</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Percent className="size-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-lg font-semibold">
                {Number(stats.tauxPresence).toFixed(1)} %
              </p>
              <p className="text-xs text-muted-foreground">taux de presence</p>
            </div>
            {stats.nbInscritsBenevoles > 0 && (
              <div className="ml-8 flex items-center gap-3">
                <Users className="size-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-lg font-semibold">{stats.nbInscritsBenevoles}</p>
                  <p className="text-xs text-muted-foreground">benevoles presents</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!estGestionnaire && distribution.statut === "PUBLIEE" && me && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <h2 className="font-medium">Mon inscription</h2>
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

      {estGestionnaire && inscrits.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <h2 className="font-medium">Inscrits ({inscrits.filter((i) => i.statut !== "ANNULEE").length})</h2>
          <div className="divide-y divide-border">
            {inscrits
              .filter((i) => i.statut !== "ANNULEE")
              .map((inscrit) => (
                <div key={inscrit.id} className="py-3 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {inscrit.nom} {inscrit.prenom}
                    </span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {inscrit.type === "BENEFICIAIRE" ? "Beneficiaire" : "Benevole"}
                      </Badge>
                      {inscrit.statut === "LISTE_ATTENTE" && (
                        <Badge variant="secondary" className="text-xs">
                          Attente #{inscrit.rangListeAttente}
                        </Badge>
                      )}
                      {inscrit.type === "BENEFICIAIRE" && inscrit.nombreAbsencesPassees > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {inscrit.nombreAbsencesPassees} absence
                          {inscrit.nombreAbsencesPassees > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {inscrit.type === "BENEVOLE" && (
                    <div className="flex items-start gap-1.5 pl-0.5">
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
  );
}
