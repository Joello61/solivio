"use client";

import Link from "next/link";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Jauge } from "@/components/ui/jauge";
import { List, ListRow } from "@/components/ui/list-row";
import { Statut } from "@/components/ui/statut";
import { DateBloc } from "@/components/agenda/DateBloc";
import { dateLongue, lieuCourt, plageDistribution } from "@/lib/agenda";
import { STATUT_DISTRIBUTION } from "@/lib/libelles";
import type { DistributionResponse } from "@/types/distribution";

const COURTE = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

function beneficiaires(d: DistributionResponse) {
  const r = d.remplissage;
  return (
    <div className="flex min-w-36 flex-col gap-1">
      <span className="tabular-nums">
        <strong>{r.beneficiairesConfirmes ?? 0}</strong>
        <span className="text-muted-foreground"> / {d.capaciteBeneficiaires}</span>
        {!!r.beneficiairesEnAttente && <span className="text-warning">, {r.beneficiairesEnAttente} en attente</span>}
      </span>
      <Jauge
        sansTexte
        taille="sm"
        valeur={r.beneficiairesConfirmes ?? 0}
        attente={r.beneficiairesEnAttente ?? 0}
        capacite={d.capaciteBeneficiaires}
        libelle={`${r.beneficiairesConfirmes ?? 0} bénéficiaires sur ${d.capaciteBeneficiaires}`}
      />
    </div>
  );
}

function benevoles(d: DistributionResponse): string {
  if (d.capaciteBenevoles == null) return `${d.remplissage.benevolesConfirmes ?? 0}`;
  const manquent = d.remplissage.placesRestantesBenevoles ?? 0;
  return `${d.remplissage.benevolesConfirmes ?? 0} / ${d.capaciteBenevoles}${manquent > 0 ? `, ${manquent} manque${manquent > 1 ? "nt" : ""}` : ""}`;
}

const colonnes: ColumnDef<DistributionResponse>[] = [
  {
    key: "date",
    header: "Date",
    sortable: true,
    cell: (d) => (
      <Link href={`/distributions/${d.id}`} className="flex flex-col font-semibold text-foreground hover:underline">
        <span className="first-letter:uppercase">{COURTE.format(new Date(`${d.date}T00:00:00Z`))}</span>
        <span className="text-sm font-normal text-muted-foreground tabular-nums">{plageDistribution(d)}</span>
      </Link>
    ),
  },
  { key: "lieu", header: "Lieu", cell: (d) => lieuCourt(d.lieu) ?? "-" },
  { key: "beneficiaires", header: "Bénéficiaires", cell: beneficiaires },
  { key: "benevoles", header: "Bénévoles", className: "tabular-nums", cell: benevoles },
  { key: "etat", header: "État", cell: (d) => <Statut libelle={STATUT_DISTRIBUTION[d.statut]} /> },
];

/* Le planning en tableau dense sur ordinateur, en lignes sur telephone. Aucune action destructrice ici. */
export function TablePlanning({ distributions, vide }: { distributions: DistributionResponse[]; vide: string }) {
  return (
    <>
      <DataTable
        className="hidden md:block"
        data={distributions}
        columns={colonnes}
        pageSize={25}
        emptyTitle={vide}
        getRowKey={(d) => d.id}
        sortKey={(d) => d.date}
      />
      <div className="md:hidden">
        {distributions.length === 0 ? (
          <p className="text-base text-muted-foreground">{vide}</p>
        ) : (
          <List>
            {distributions.map((d) => (
              <ListRow
                key={d.id}
                href={`/distributions/${d.id}`}
                debut={<DateBloc date={d.date} avecMois />}
                titre={
                  <span className="tabular-nums">
                    <span className="sr-only">{dateLongue(d.date)}, </span>
                    {plageDistribution(d) ?? d.titre}
                  </span>
                }
                sousTitre={[lieuCourt(d.lieu), `${d.remplissage.beneficiairesConfirmes ?? 0}/${d.capaciteBeneficiaires} inscrits`, `bénévoles ${benevoles(d)}`]
                  .filter(Boolean)
                  .join(", ")}
              />
            ))}
          </List>
        )}
      </div>
    </>
  );
}
