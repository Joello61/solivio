import Link from "next/link";
import { AlertCircle, CalendarCheck, CircleDot, HeartHandshake, Info, Users } from "lucide-react";
import { BandeauAccueil } from "@/components/accueil/BandeauAccueil";
import { Stat } from "@/components/ui/stat";
import { List, ListRow } from "@/components/ui/list-row";
import { DistributionDuJour } from "@/components/dashboard/DistributionDuJour";
import { lireServeur } from "@/lib/api/serveur";
import { dateLongue } from "@/lib/agenda";
import { tachesDistributions, type Tache, type TonTache } from "@/lib/cycle-distribution";
import { jourEtHeure } from "@/lib/engagements";
import { missionsNonPrises } from "@/lib/missions";
import { PHOTOS } from "@/lib/photos";
import type { StatistiquePeriodeResponse } from "@/types/association";
import type { MissionCollecteResponse } from "@/types/collecte";
import type { DistributionResponse } from "@/types/distribution";

const ICONE: Record<TonTache, typeof AlertCircle> = { action: CircleDot, attention: AlertCircle, info: Info };
const PASTILLE: Record<TonTache, string> = {
  action: "bg-secondary text-secondary-foreground",
  attention: "bg-accent text-accent-foreground",
  info: "bg-muted text-muted-foreground",
};

function resume(taches: number): string {
  if (taches === 0) return "Rien ne presse aujourd'hui.";
  return taches > 1 ? `${taches} choses demandent votre attention.` : "Une chose demande votre attention.";
}

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
    <div className="flex max-w-6xl flex-col gap-8">
      <BandeauAccueil
        surtitre={dateLongue(aujourdhui)}
        titre={`Bonjour ${prenom}`}
        description={resume(taches.length)}
        photo={PHOTOS.salleDistribution}
      >
        {duJour.length > 0 && <DistributionDuJour distributions={duJour} />}
      </BandeauAccueil>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
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
                    debut={
                      <span aria-hidden="true" className={`flex size-10 items-center justify-center rounded-xl ${PASTILLE[t.ton]}`}>
                        <Icone className="size-5" />
                      </span>
                    }
                    titre={t.titre}
                    sousTitre={t.detail}
                  />
                );
              })}
            </List>
          )}
        </section>

        {stats && (
          <section aria-labelledby="ce-mois" className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="ce-mois" className="font-display text-xl font-bold text-foreground">
                Ce mois-ci
              </h2>
              <Link href="/statistiques" className="font-semibold text-primary underline underline-offset-4">
                Statistiques
              </Link>
            </div>
            <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
              <Stat className="p-4" icone={CalendarCheck} valeur={stats.nbDistributions} libelle={stats.nbDistributions > 1 ? "distributions closes" : "distribution close"} />
              <Stat className="p-4" icone={HeartHandshake} ton="turquoise" valeur={stats.nbBeneficiairesDistinctsServis} libelle={stats.nbBeneficiairesDistinctsServis > 1 ? "bénéficiaires servis" : "bénéficiaire servi"} />
              <Stat className="p-4" icone={Users} ton="jaune" valeur={stats.nbBenevolesDistincts} libelle={stats.nbBenevolesDistincts > 1 ? "bénévoles mobilisés" : "bénévole mobilisé"} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
