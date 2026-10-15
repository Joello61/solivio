import Link from "next/link";
import { AlertCircle, CircleDot, Info } from "lucide-react";
import { List, ListRow } from "@/components/ui/list-row";
import { DistributionDuJour } from "@/components/dashboard/DistributionDuJour";
import { lireServeur } from "@/lib/api/serveur";
import { dateLongue } from "@/lib/agenda";
import { tachesDistributions, type Tache, type TonTache } from "@/lib/cycle-distribution";
import { jourEtHeure } from "@/lib/engagements";
import { missionsNonPrises } from "@/lib/missions";
import type { StatistiquePeriodeResponse } from "@/types/association";
import type { MissionCollecteResponse } from "@/types/collecte";
import type { DistributionResponse } from "@/types/distribution";

const ICONE: Record<TonTache, typeof AlertCircle> = { action: CircleDot, attention: AlertCircle, info: Info };
const COULEUR: Record<TonTache, string> = { action: "text-primary", attention: "text-warning", info: "text-muted-foreground" };

function premierDuMois(jour: string): string {
  return `${jour.slice(0, 8)}01`;
}

function dernierDuMois(jour: string): string {
  const [annee, mois] = jour.split("-").map(Number);
  return `${jour.slice(0, 8)}${String(new Date(Date.UTC(annee, mois, 0)).getUTCDate()).padStart(2, "0")}`;
}

interface Props {
  prenom: string;
  duJour: DistributionResponse[];
  aujourdhui: string;
}

/*
 * Accueil des gestionnaires : le jour J s'il y en a un, puis ce qui demande une
 * action, enfin les chiffres du mois. Le tableur ne disait rien de tout cela.
 */
export async function AujourdhuiGestion({ prenom, duJour, aujourdhui }: Props) {
  const maintenant = new Date();
  const [distributions, missions, stats] = await Promise.all([
    lireServeur<DistributionResponse[]>("/api/distributions"),
    lireServeur<MissionCollecteResponse[]>("/api/missions-collecte?statut=DISPONIBLE"),
    lireServeur<StatistiquePeriodeResponse>(
      `/api/statistiques/periode?debut=${premierDuMois(aujourdhui)}&fin=${dernierDuMois(aujourdhui)}`,
    ),
  ]);
  const taches: Tache[] = [
    ...tachesDistributions(distributions ?? [], aujourdhui),
    ...missionsNonPrises(missions ?? [], maintenant).map((m) => ({
      cle: `mission-${m.id}`,
      titre: "Mission non prise",
      detail: `${m.titre}, ${dateLongue(jourEtHeure(m.dateHeure).date)} à ${jourEtHeure(m.dateHeure).heure}.`,
      href: `/missions-collecte/${m.id}`,
      ton: "attention" as const,
    })),
  ];

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-display text-3xl leading-tight font-extrabold text-foreground sm:text-4xl">
          Bonjour {prenom}
        </h1>
        <p className="text-lg text-muted-foreground first-letter:uppercase">{dateLongue(aujourdhui)}.</p>
      </header>

      <DistributionDuJour distributions={duJour} />

      <section aria-labelledby="a-faire" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="a-faire" className="font-display text-xl font-bold text-foreground">
            À faire
          </h2>
          <Link href="/distributions" className="font-semibold text-primary underline underline-offset-4">
            Planning
          </Link>
        </div>
        {taches.length === 0 ? (
          <p className="text-base text-muted-foreground">Rien ne presse : tout est publié et les équipes sont complètes.</p>
        ) : (
          <List>
            {taches.map((t) => {
              const Icone = ICONE[t.ton];
              return (
                <ListRow
                  key={t.cle}
                  href={t.href}
                  debut={<Icone aria-hidden="true" className={`size-5 ${COULEUR[t.ton]}`} />}
                  titre={t.titre}
                  sousTitre={t.detail}
                />
              );
            })}
          </List>
        )}
      </section>

      {stats && (
        <section aria-labelledby="ce-mois" className="flex flex-col gap-2">
          <h2 id="ce-mois" className="font-display text-xl font-bold text-foreground">
            Ce mois-ci
          </h2>
          <p className="text-base text-foreground">
            <strong className="tabular-nums">{stats.nbDistributions}</strong>{" "}
            {stats.nbDistributions > 1 ? "distributions" : "distribution"},{" "}
            <strong className="tabular-nums">{stats.nbBeneficiairesDistinctsServis}</strong>{" "}
            {stats.nbBeneficiairesDistinctsServis > 1 ? "bénéficiaires servis" : "bénéficiaire servi"},{" "}
            <strong className="tabular-nums">{stats.nbBenevolesDistincts}</strong>{" "}
            {stats.nbBenevolesDistincts > 1 ? "bénévoles mobilisés" : "bénévole mobilisé"}.{" "}
            <Link href="/statistiques" className="font-semibold text-primary underline underline-offset-4">
              Statistiques
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}
