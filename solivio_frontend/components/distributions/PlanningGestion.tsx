import Link from "next/link";
import { Copy, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { DistributionDuJour } from "@/components/dashboard/DistributionDuJour";
import { TablePlanning } from "@/components/distributions/TablePlanning";
import { FiltreUrl } from "@/components/shared/FiltreUrl";
import { sectionPlanning, type SectionPlanning } from "@/lib/cycle-distribution";
import type { DistributionResponse } from "@/types/distribution";

const SECTIONS: { valeur: SectionPlanning; libelle: string; vide: string }[] = [
  { valeur: "a-venir", libelle: "À venir", vide: "Aucune distribution à venir." },
  { valeur: "brouillons", libelle: "Brouillons", vide: "Aucun brouillon." },
  { valeur: "passees", libelle: "Passées", vide: "Aucune distribution passée." },
  { valeur: "annulees", libelle: "Annulées", vide: "Aucune distribution annulée." },
];

function pluriel(n: number, mot: string): string {
  return `${n} ${mot}${n > 1 ? "s" : ""}`;
}

interface Props {
  distributions: DistributionResponse[];
  section: string | undefined;
  aujourdhui: string;
}

/*
 * Planning des gestionnaires : le jour J en tete, puis les distributions par
 * section. Les actions du cycle vivent sur la feuille, jamais dans la liste.
 */
export function PlanningGestion({ distributions, section, aujourdhui }: Props) {
  const parSection = Object.fromEntries(SECTIONS.map((s) => [s.valeur, [] as DistributionResponse[]])) as Record<
    SectionPlanning,
    DistributionResponse[]
  >;
  for (const d of distributions) parSection[sectionPlanning(d, aujourdhui)].push(d);
  parSection["a-venir"].sort((a, b) => a.date.localeCompare(b.date));
  parSection.brouillons.sort((a, b) => a.date.localeCompare(b.date));
  parSection.passees.sort((a, b) => b.date.localeCompare(a.date));
  parSection.annulees.sort((a, b) => b.date.localeCompare(a.date));

  const courante = SECTIONS.find((s) => s.valeur === section) ?? SECTIONS[0];
  const duJour = distributions
    .filter((d) => d.statut === "EN_COURS" || (d.statut === "PUBLIEE" && d.date === aujourdhui))
    .sort((a, b) => Number(b.statut === "EN_COURS") - Number(a.statut === "EN_COURS"));
  // La plus recente, passee ou a venir, sert de modele : la date avance d'une semaine.
  const modele = [...distributions]
    .filter((d) => d.statut !== "ANNULEE")
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const aVenir = parSection["a-venir"].length;
  const brouillons = parSection.brouillons.length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        className="mb-0 sm:mb-0"
        titre="Planning"
        description={[
          aVenir ? `${pluriel(aVenir, "distribution")} à venir` : "Aucune distribution à venir",
          brouillons ? `${pluriel(brouillons, "brouillon")} à publier` : null,
        ]
          .filter(Boolean)
          .join(", ")
          .concat(".")}
        actions={
          <>
            {modele && (
              <Link href={`/distributions/nouvelle?depuis=${modele.id}`} className={buttonVariants({ variant: "outline" })}>
                <Copy aria-hidden="true" />
                Dupliquer la dernière
              </Link>
            )}
            <Link href="/distributions/nouvelle" className={buttonVariants()}>
              <Plus aria-hidden="true" />
              Nouvelle distribution
            </Link>
          </>
        }
      />

      <DistributionDuJour distributions={duJour} />

      <FiltreUrl
        label="Distributions à afficher"
        parametre="section"
        valeur={courante.valeur}
        defaut="a-venir"
        options={SECTIONS.map((s) => ({ value: s.valeur, label: s.libelle, count: parSection[s.valeur].length }))}
      />
      <TablePlanning distributions={parSection[courante.valeur]} vide={courante.vide} />
    </div>
  );
}
