import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ListeActivites, type LigneActivite } from "@/components/activites/ListeActivites";
import { ListeMissionsBenevole, type VueMissions } from "@/components/collecte/ListeMissionsBenevole";
import { buttonVariants } from "@/components/ui/button";
import { SECTIONS_MISSION, sectionMission, trierActivites, type SectionMission } from "@/lib/activites";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { jourEtHeure } from "@/lib/engagements";
import { STATUT_MISSION } from "@/lib/libelles";
import type { MissionCollecteResponse } from "@/types/collecte";

export const metadata: Metadata = { title: "Missions de collecte" };

const VUES: VueMissions[] = ["disponibles", "miennes", "passees"];

function ligne(m: MissionCollecteResponse): LigneActivite {
  const { date, heure } = jourEtHeure(m.dateHeure);
  return {
    id: m.id,
    href: `/missions-collecte/${m.id}`,
    date,
    titre: m.titre,
    details: [heure, m.lieuCollecte?.adresseFormatee ?? null, m.benevoleNomComplet ? `avec ${m.benevoleNomComplet}` : null],
    statut: STATUT_MISSION[m.statut],
  };
}

export default async function MissionsCollectePage({ searchParams }: { searchParams: Promise<{ vue?: string; section?: string }> }) {
  const [{ vue, section }, me] = await Promise.all([searchParams, lireMoi()]);
  // Les missions se gerent par les responsables ; les benevoles les prennent.
  const gestion = me?.roles.some((r) => r === "responsable" || r === "super_admin") ?? false;
  if (!gestion) return <ListeMissionsBenevole vue={VUES.find((v) => v === vue) ?? "disponibles"} />;

  const missions = (await lireServeur<MissionCollecteResponse[]>("/api/missions-collecte")) ?? [];
  const sections = SECTIONS_MISSION.map((s) => ({
    ...s,
    lignes: trierActivites(
      missions.filter((m) => sectionMission(m.statut) === s.valeur),
      s.valeur,
      (m) => m.dateHeure,
    ).map(ligne),
  }));
  const aPourvoir = sections[0].lignes.length;

  return (
    <ListeActivites<SectionMission>
      titre="Missions de collecte"
      description={aPourvoir ? `${aPourvoir} mission${aPourvoir > 1 ? "s" : ""} attend${aPourvoir > 1 ? "ent" : ""} un bénévole.` : "Aucune mission n'attend de bénévole."}
      actions={
        <Link href="/missions-collecte/nouvelle" className={buttonVariants()}>
          <Plus aria-hidden="true" />
          Nouvelle mission
        </Link>
      }
      sections={sections}
      section={(section as SectionMission) ?? "a-pourvoir"}
      defaut="a-pourvoir"
      vide="Rien dans cette section."
      libelleFiltre="Missions à afficher"
    />
  );
}
