import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarCheck, HeartHandshake, Users } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Stat } from "@/components/ui/stat";
import { ChoixPeriode } from "@/components/statistiques/ChoixPeriode";
import { TableStatistiques } from "@/components/statistiques/TableStatistiques";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { estGestionnaireDistribution } from "@/lib/droits-distribution";
import { PERIODES, lirePeriode, periodePredefinie } from "@/lib/periodes";
import type { StatistiqueDistributionResponse, StatistiquePeriodeResponse } from "@/types/association";
import type { DistributionResponse } from "@/types/distribution";

export const metadata: Metadata = { title: "Statistiques" };

interface PageProps {
  searchParams: Promise<{ debut?: string; fin?: string }>;
}

const JOUR = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const PLAGE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const versDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

/* Taux de presence par distribution, en barres : la tendance se lit sans compter. */
function BarresPresence({ lignes }: { lignes: StatistiqueDistributionResponse[] }) {
  const chronologiques = [...lignes].sort((a, b) => a.distributionDate.localeCompare(b.distributionDate));
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="font-display text-xl font-bold text-foreground">Présence par distribution</figcaption>
      <ul className="flex flex-col gap-2">
        {chronologiques.map((s) => {
          const taux = Math.round(Number(s.tauxPresence));
          return (
            <li key={s.distributionId} className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-3">
              <span className="text-sm text-muted-foreground tabular-nums">{JOUR.format(versDate(s.distributionDate))}</span>
              <span aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(taux, 100)}%` }} />
              </span>
              <span className="text-right text-base font-semibold text-foreground tabular-nums">{taux} %</span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

export default async function StatistiquesPage({ searchParams }: PageProps) {
  const me = await lireMoi();
  const roles = me?.roles ?? [];
  if (!estGestionnaireDistribution(roles)) notFound();

  const params = await searchParams;
  const aujourdhui = new Date();
  const periode = lirePeriode(params.debut, params.fin, aujourdhui);
  const requete = `debut=${periode.debut}&fin=${periode.fin}`;
  const [totaux, parDistribution, distributions] = await Promise.all([
    lireServeur<StatistiquePeriodeResponse>(`/api/statistiques/periode?${requete}`),
    lireServeur<StatistiqueDistributionResponse[]>(`/api/statistiques/distributions?${requete}`),
    lireServeur<DistributionResponse[]>("/api/distributions"),
  ]);
  const titres = Object.fromEntries((distributions ?? []).map((d) => [d.id, d.titre]));
  const predefinies = Object.fromEntries(PERIODES.map((p) => [p.cle, periodePredefinie(p.cle, aujourdhui)]));
  const lignes = parDistribution ?? [];

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <PageHeader
        className="mb-0 sm:mb-0"
        titre="Statistiques"
        description={`Distributions closes du ${PLAGE.format(versDate(periode.debut))} au ${PLAGE.format(versDate(periode.fin))}. Chiffres agrégés, sans nom.`}
      />
      <ChoixPeriode periode={periode} predefinies={predefinies} />

      {totaux === null || parDistribution === null ? (
        <Alert variant="destructive">Les statistiques n&apos;ont pas pu être chargées. Réessayez dans un instant.</Alert>
      ) : (
        <>
          <div className="grid gap-6 border-y border-border py-5 sm:grid-cols-3">
            <Stat icone={CalendarCheck} valeur={totaux.nbDistributions} libelle={`distribution${totaux.nbDistributions > 1 ? "s" : ""} close${totaux.nbDistributions > 1 ? "s" : ""}`} />
            <Stat icone={HeartHandshake} ton="turquoise" valeur={totaux.nbBeneficiairesDistinctsServis} libelle="bénéficiaires servis" detail="personnes distinctes" />
            <Stat icone={Users} ton="jaune" valeur={totaux.nbBenevolesDistincts} libelle="bénévoles mobilisés" detail="personnes distinctes" />
          </div>

          {lignes.length === 0 ? (
            <EmptyState size="sm" title="Aucune distribution close sur cette période" description="Choisissez une autre période." />
          ) : (
            <>
              <BarresPresence lignes={lignes} />
              <section aria-labelledby="titre-detail" className="flex flex-col gap-3">
                <h2 id="titre-detail" className="font-display text-xl font-bold text-foreground">
                  Détail
                </h2>
                <TableStatistiques
                  lignes={lignes}
                  titres={titres}
                  peutRecalculer={roles.includes("responsable") || roles.includes("super_admin")}
                />
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
