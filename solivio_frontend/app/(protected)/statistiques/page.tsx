import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Heart, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RecalculerStatistiques } from "@/components/statistiques/RecalculerStatistiques";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { estGestionnaireDistribution } from "@/lib/droits-distribution";
import { PERIODES, lirePeriode, periodePredefinie } from "@/lib/periodes";
import { cn } from "@/lib/utils";
import type { StatistiqueDistributionResponse, StatistiquePeriodeResponse } from "@/types/association";
import type { DistributionResponse } from "@/types/distribution";

export const metadata: Metadata = { title: "Statistiques" };

interface PageProps {
  searchParams: Promise<{ debut?: string; fin?: string }>;
}

const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

function Total({ titre, valeur, icon: Icon }: { titre: string; valeur: number; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-5 flex items-center gap-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-3xl font-bold tabular-nums text-foreground font-display leading-none">{valeur}</p>
        <p className="mt-1 text-sm text-muted-foreground">{titre}</p>
      </div>
    </div>
  );
}

export default async function StatistiquesPage({ searchParams }: PageProps) {
  const me = await lireMoi();
  const roles = me?.roles ?? [];
  if (!estGestionnaireDistribution(roles)) notFound();

  const params = await searchParams;
  const aujourdhui = new Date();
  const { debut, fin } = lirePeriode(params.debut, params.fin, aujourdhui);
  const requete = `debut=${debut}&fin=${fin}`;
  const [totaux, parDistribution, distributions] = await Promise.all([
    lireServeur<StatistiquePeriodeResponse>(`/api/statistiques/periode?${requete}`),
    lireServeur<StatistiqueDistributionResponse[]>(`/api/statistiques/distributions?${requete}`),
    lireServeur<DistributionResponse[]>("/api/distributions"),
  ]);
  const titres = new Map((distributions ?? []).map((d) => [d.id, d.titre]));
  // Le recalcul est reserve au responsable (backend).
  const peutRecalculer = roles.includes("responsable") || roles.includes("super_admin");
  const lignes = parDistribution ?? [];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Statistiques</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Chiffres agrégés des distributions terminées, sans donnée nominative.
        </p>
      </div>

      <section aria-label="Période" className="rounded-2xl border border-border/60 bg-card shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {PERIODES.map((p) => {
            const periode = periodePredefinie(p.cle, aujourdhui);
            const actif = periode.debut === debut && periode.fin === fin;
            return (
              <Link
                key={p.cle}
                href={`/statistiques?debut=${periode.debut}&fin=${periode.fin}`}
                aria-current={actif ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-full border px-3.5 text-sm transition-colors",
                  actif
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:border-primary/40 hover:bg-primary/5",
                )}
              >
                {p.libelle}
              </Link>
            );
          })}
        </div>
        <form action="/statistiques" className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="debut">Du</Label>
            <Input id="debut" name="debut" type="date" defaultValue={debut} required className="w-auto" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fin">Au</Label>
            <Input id="fin" name="fin" type="date" defaultValue={fin} required className="w-auto" />
          </div>
          <Button type="submit" variant="outline">Afficher</Button>
        </form>
      </section>

      {totaux === null || parDistribution === null ? (
        <div className="rounded-xl border border-border/60 bg-muted px-5 py-4 text-sm text-muted-foreground">
          Statistiques indisponibles pour le moment.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Total titre="distributions terminées" valeur={totaux.nbDistributions} icon={CalendarDays} />
            <Total titre="bénéficiaires distincts servis" valeur={totaux.nbBeneficiairesDistinctsServis} icon={Heart} />
            <Total titre="bénévoles distincts" valeur={totaux.nbBenevolesDistincts} icon={Users} />
          </div>

          <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <h2 className="px-5 pt-5 text-base font-semibold text-foreground font-display">Par distribution</h2>
            {lignes.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Aucune distribution terminée"
                description="Aucune distribution n'a été clôturée sur cette période."
              />
            ) : (
              <>
                {/* Mobile : une carte par distribution, le tableau ne tient pas en largeur. */}
                <ul className="divide-y divide-border/60 sm:hidden">
                  {lignes.map((s) => {
                    const titre = titres.get(s.distributionId) ?? "Distribution";
                    return (
                      <li key={s.distributionId} className="flex items-start gap-3 px-5 py-4">
                        <div className="min-w-0 flex-1 space-y-1">
                          <Link href={`/distributions/${s.distributionId}`} className="font-medium text-foreground hover:text-primary">
                            {titre}
                          </Link>
                          <p className="text-xs text-muted-foreground">{formatDate(s.distributionDate)}</p>
                          <p className="text-sm text-foreground">
                            <span className="font-semibold tabular-nums">{Math.round(Number(s.tauxPresence))} %</span> de présence
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {pluriel(s.nbPresentsBeneficiaires, "présent")}, {pluriel(s.nbAbsentsBeneficiaires, "absent")},{" "}
                            {pluriel(s.nbNonPointes, "non pointé")} sur {pluriel(s.nbInscritsBeneficiaires, "inscrit")} ;{" "}
                            {pluriel(s.nbInscritsBenevoles, "bénévole")}
                          </p>
                        </div>
                        {peutRecalculer && <RecalculerStatistiques distributionId={s.distributionId} libelle={titre} />}
                      </li>
                    );
                  })}
                </ul>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th scope="col" className="px-5 py-3 font-medium">Distribution</th>
                        <th scope="col" className="px-3 py-3 text-right font-medium">Inscrits</th>
                        <th scope="col" className="px-3 py-3 text-right font-medium">Présents</th>
                        <th scope="col" className="px-3 py-3 text-right font-medium">Absents</th>
                        <th scope="col" className="px-3 py-3 text-right font-medium">Non pointés</th>
                        <th scope="col" className="px-3 py-3 text-right font-medium">Présence</th>
                        <th scope="col" className="px-3 py-3 text-right font-medium">Bénévoles</th>
                        {peutRecalculer && <th scope="col" className="px-3 py-3"><span className="sr-only">Recalculer</span></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {lignes.map((s) => {
                        const titre = titres.get(s.distributionId) ?? "Distribution";
                        return (
                          <tr key={s.distributionId}>
                            <td className="px-5 py-3">
                              <Link href={`/distributions/${s.distributionId}`} className="font-medium text-foreground hover:text-primary">
                                {titre}
                              </Link>
                              <p className="text-xs text-muted-foreground">{formatDate(s.distributionDate)}</p>
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums">{s.nbInscritsBeneficiaires}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{s.nbPresentsBeneficiaires}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{s.nbAbsentsBeneficiaires}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{s.nbNonPointes}</td>
                            <td className="px-3 py-3 text-right tabular-nums font-medium">
                              {Math.round(Number(s.tauxPresence))} %
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums">{s.nbInscritsBenevoles}</td>
                            {peutRecalculer && (
                              <td className="px-3 py-2 text-right">
                                <RecalculerStatistiques distributionId={s.distributionId} libelle={titre} />
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
