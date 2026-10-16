import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ListeActivites, type LigneActivite } from "@/components/activites/ListeActivites";
import { buttonVariants } from "@/components/ui/button";
import { SECTIONS_ACTIVITE, quandActivite, sectionActivite, trierActivites, type SectionActivite } from "@/lib/activites";
import { lieuCourt } from "@/lib/agenda";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { estGestionnaireDistribution } from "@/lib/droits-distribution";
import { STATUT_SESSION } from "@/lib/libelles";
import { estResponsable } from "@/lib/roles";
import type { SessionReconditionnementResponse } from "@/types/reconditionnement";
import { ReperesReconditionnement } from "@/components/shared/ReperesActivites";

export const metadata: Metadata = { title: "Reconditionnement" };

function places(s: SessionReconditionnementResponse): string {
  const inscrits = `${s.nbInscrits} inscrit${s.nbInscrits > 1 ? "s" : ""}`;
  return s.capacite ? `${inscrits} sur ${s.capacite}` : inscrits;
}

function ligne(s: SessionReconditionnementResponse): LigneActivite {
  const { date, plage } = quandActivite(s.dateHeureDebut, s.dateHeureFin);
  return {
    id: s.id,
    href: `/reconditionnement/${s.id}`,
    date,
    titre: s.titre,
    details: [plage, lieuCourt(s.lieu), places(s)],
    statut: STATUT_SESSION[s.statut],
  };
}

export default async function ReconditionnementPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const [{ section }, me, sessions] = await Promise.all([
    searchParams,
    lireMoi(),
    lireServeur<SessionReconditionnementResponse[]>("/api/sessions-reconditionnement"),
  ]);
  const roles = me?.roles ?? [];
  const gestion = estGestionnaireDistribution(roles);
  // Le reconditionnement des denrees est un travail benevole.
  if (!gestion && !roles.includes("benevole")) notFound();
  const maintenant = new Date();
  const sections = SECTIONS_ACTIVITE.filter((s) => gestion || s.valeur === "a-venir" || s.valeur === "passees").map((s) => ({
    ...s,
    lignes: trierActivites(
      (sessions ?? []).filter((x) => sectionActivite(x, maintenant) === s.valeur),
      s.valeur,
      (x) => x.dateHeureDebut,
    ).map(ligne),
  }));
  const aVenir = sections.find((s) => s.valeur === "a-venir")?.lignes.length ?? 0;

  return (
    <ListeActivites<SectionActivite>
      titre="Reconditionnement"
      description={aVenir ? `${aVenir} session${aVenir > 1 ? "s" : ""} à venir.` : "Aucune session à venir."}
      actions={
        estResponsable(roles) && (
          <Link href="/reconditionnement/nouvelle" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            Nouvelle session
          </Link>
        )
      }
      sections={sections}
      section={(section as SectionActivite) ?? "a-venir"}
      defaut="a-venir"
      vide="Rien dans cette section."
      libelleFiltre="Sessions à afficher"
      aside={<ReperesReconditionnement />}
    />
  );
}
