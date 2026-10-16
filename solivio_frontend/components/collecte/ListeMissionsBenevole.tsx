import { Truck } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListRow } from "@/components/ui/list-row";
import { DeuxColonnes } from "@/components/ui/deux-colonnes";
import { ReperesMissions } from "@/components/shared/ReperesActivites";
import { PageHeader } from "@/components/ui/page-header";
import { Statut } from "@/components/ui/statut";
import { DateBloc } from "@/components/agenda/DateBloc";
import { FiltreUrl } from "@/components/shared/FiltreUrl";
import { lireServeur } from "@/lib/api/serveur";
import { dateLongue } from "@/lib/agenda";
import { jourEtHeure } from "@/lib/engagements";
import { STATUT_MISSION } from "@/lib/libelles";
import type { MissionCollecteResponse } from "@/types/collecte";

export type VueMissions = "disponibles" | "miennes" | "passees";

const ACTIVES = ["PRISE_EN_CHARGE", "COLLECTE_EFFECTUEE"];

const VIDE: Record<VueMissions, { titre: string; texte: string }> = {
  disponibles: { titre: "Aucune mission à prendre", texte: "Les nouvelles missions apparaîtront ici." },
  miennes: { titre: "Aucune mission en cours", texte: "Prenez une mission disponible pour la retrouver ici." },
  passees: { titre: "Pas encore d'historique", texte: "Vos missions déposées ou annulées s'afficheront ici." },
};

function LigneMission({ mission: m, avecStatut }: { mission: MissionCollecteResponse; avecStatut: boolean }) {
  const { date, heure } = jourEtHeure(m.dateHeure);
  return (
    <ListRow
      href={`/missions-collecte/${m.id}`}
      debut={<DateBloc date={date} avecMois />}
      titre={
        <>
          <span className="sr-only">{dateLongue(date)}, </span>
          {m.titre}
        </>
      }
      sousTitre={[heure, m.lieuCollecte?.adresseFormatee].filter(Boolean).join(", ")}
      fin={avecStatut ? <Statut libelle={STATUT_MISSION[m.statut]} /> : undefined}
    />
  );
}

/* Missions vues par un benevole : a prendre, en cours, passees. */
export async function ListeMissionsBenevole({ vue }: { vue: VueMissions }) {
  const [disponibles, miennes] = await Promise.all([
    lireServeur<MissionCollecteResponse[]>("/api/missions-collecte?statut=DISPONIBLE"),
    lireServeur<MissionCollecteResponse[]>("/api/missions-collecte/mes-missions"),
  ]);
  const maintenant = new Date();
  const listes: Record<VueMissions, MissionCollecteResponse[]> = {
    disponibles: (disponibles ?? [])
      .filter((m) => new Date(m.dateHeure) >= maintenant)
      .sort((a, b) => a.dateHeure.localeCompare(b.dateHeure)),
    miennes: (miennes ?? [])
      .filter((m) => ACTIVES.includes(m.statut))
      .sort((a, b) => a.dateHeure.localeCompare(b.dateHeure)),
    passees: (miennes ?? [])
      .filter((m) => !ACTIVES.includes(m.statut))
      .sort((a, b) => b.dateHeure.localeCompare(a.dateHeure)),
  };
  const missions = listes[vue];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader className="mb-0 sm:mb-0" titre="Missions de collecte" description="Récupérer des dons et les déposer au local." />
      <DeuxColonnes aside={<ReperesMissions />}>
        <FiltreUrl
          label="Missions à afficher"
          parametre="vue"
          valeur={vue}
          defaut="disponibles"
          options={[
            { value: "disponibles", label: "À prendre", count: listes.disponibles.length },
            { value: "miennes", label: "Les miennes", count: listes.miennes.length },
            { value: "passees", label: "Passées" },
          ]}
        />
        {missions.length === 0 ? (
          <EmptyState icon={Truck} title={VIDE[vue].titre} description={VIDE[vue].texte} />
        ) : (
          <List>
            {missions.map((m) => (
              <LigneMission key={m.id} mission={m} avecStatut={vue !== "disponibles"} />
            ))}
          </List>
        )}
      </DeuxColonnes>
    </div>
  );
}
