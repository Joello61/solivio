import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ListeActivites, type LigneActivite } from "@/components/activites/ListeActivites";
import { buttonVariants } from "@/components/ui/button";
import {
  SECTIONS_ACTIVITE,
  TYPE_EVENEMENT,
  quandActivite,
  sectionActivite,
  trierActivites,
  type SectionActivite,
} from "@/lib/activites";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { estGestionnaireDistribution } from "@/lib/droits-distribution";
import { STATUT_EVENEMENT } from "@/lib/libelles";
import { estResponsable } from "@/lib/roles";
import type { EvenementResponse } from "@/types/evenement";
import { ReperesEvenements } from "@/components/shared/ReperesActivites";

export const metadata: Metadata = { title: "Événements" };

function equipe(e: EvenementResponse): string | null {
  if (!e.aBesoiNStaff) return null;
  return e.capaciteStaff ? `équipe ${e.nbStaff} sur ${e.capaciteStaff}` : `équipe de ${e.nbStaff}`;
}

function participants(e: EvenementResponse): string | null {
  if (!e.ouvertParticipants) return null;
  const n = `${e.nbParticipants} participant${e.nbParticipants > 1 ? "s" : ""}`;
  return e.capaciteParticipants ? `${n} sur ${e.capaciteParticipants}` : n;
}

function ligne(e: EvenementResponse): LigneActivite {
  const { date, plage } = quandActivite(e.dateHeureDebut, e.dateHeureFin);
  return {
    id: e.id,
    href: `/evenements/${e.id}`,
    date,
    titre: e.titre,
    details: [`${TYPE_EVENEMENT[e.type]}, ${plage}`, [equipe(e), participants(e)].filter(Boolean).join(", ") || null],
    statut: STATUT_EVENEMENT[e.statut],
  };
}

export default async function EvenementsPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const [{ section }, me, evenements] = await Promise.all([
    searchParams,
    lireMoi(),
    lireServeur<EvenementResponse[]>("/api/evenements"),
  ]);
  const roles = me?.roles ?? [];
  const maintenant = new Date();
  const gestion = estGestionnaireDistribution(roles);
  // Un membre ne voit ni les brouillons ni les annulations.
  const visibles = (evenements ?? []).filter((e) => gestion || (e.statut !== "BROUILLON" && e.statut !== "ANNULE"));
  const sections = SECTIONS_ACTIVITE.filter((s) => gestion || s.valeur === "a-venir" || s.valeur === "passees").map((s) => ({
    ...s,
    lignes: trierActivites(
      visibles.filter((e) => sectionActivite(e, maintenant) === s.valeur),
      s.valeur,
      (e) => e.dateHeureDebut,
    ).map(ligne),
  }));
  const aVenir = sections.find((s) => s.valeur === "a-venir")?.lignes.length ?? 0;

  return (
    <ListeActivites<SectionActivite>
      titre="Événements"
      description={aVenir ? `${aVenir} événement${aVenir > 1 ? "s" : ""} à venir.` : "Aucun événement à venir."}
      actions={
        estResponsable(roles) && (
          <Link href="/evenements/nouveau" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            Nouvel événement
          </Link>
        )
      }
      sections={sections}
      section={(section as SectionActivite) ?? "a-venir"}
      defaut="a-venir"
      vide="Rien dans cette section."
      libelleFiltre="Événements à afficher"
      aside={<ReperesEvenements />}
    />
  );
}
