import type { ReactNode } from "react";
import { DateBloc } from "@/components/agenda/DateBloc";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListRow } from "@/components/ui/list-row";
import { DeuxColonnes } from "@/components/ui/deux-colonnes";
import { PageHeader } from "@/components/ui/page-header";
import { Statut } from "@/components/ui/statut";
import { FiltreUrl } from "@/components/shared/FiltreUrl";
import type { LibelleStatut } from "@/lib/libelles";

export interface LigneActivite {
  id: string;
  href: string;
  /* Jour (aaaa-mm-jj) dans le fuseau de l'association. */
  date: string;
  titre: string;
  /* Horaire, lieu, remplissage : ce qui aide a choisir. */
  details: (string | null)[];
  statut: LibelleStatut;
}

export interface SectionListe<S extends string> {
  valeur: S;
  libelle: string;
  lignes: LigneActivite[];
}

interface Props<S extends string> {
  titre: string;
  description: string;
  actions?: ReactNode;
  sections: SectionListe<S>[];
  section: S;
  defaut: S;
  vide: string;
  libelleFiltre: string;
  /* Colonne de droite sur ordinateur : ce qu'est l'activite. */
  aside?: ReactNode;
}

/*
 * Liste de gestion d'une activite : une ligne par element, par section. Les
 * actions du cycle vivent sur la fiche, jamais dans la liste.
 */
export function ListeActivites<S extends string>({ titre, description, actions, sections, section, defaut, vide, libelleFiltre, aside }: Props<S>) {
  const courante = sections.find((s) => s.valeur === section) ?? sections[0];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader className="mb-0 sm:mb-0" titre={titre} description={description} actions={actions} />
      <DeuxColonnes aside={aside}>
        <FiltreUrl
          label={libelleFiltre}
          parametre="section"
          valeur={courante.valeur}
          defaut={defaut}
          options={sections.map((s) => ({ value: s.valeur, label: s.libelle, count: s.lignes.length }))}
        />
        {courante.lignes.length === 0 ? (
          <EmptyState size="sm" title={vide} />
        ) : (
          <List>
            {courante.lignes.map((l) => (
              <ListRow
                key={l.id}
                href={l.href}
                debut={<DateBloc date={l.date} avecMois />}
                titre={l.titre}
                sousTitre={l.details.filter(Boolean).join(", ")}
                fin={<Statut libelle={l.statut} className="hidden sm:inline-flex" />}
              />
            ))}
          </List>
        )}
      </DeuxColonnes>
    </div>
  );
}
