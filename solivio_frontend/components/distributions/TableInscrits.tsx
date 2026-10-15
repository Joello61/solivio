"use client";

import { useMemo, useState } from "react";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListRow } from "@/components/ui/list-row";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Statut } from "@/components/ui/statut";
import { STATUT_PRESENCE } from "@/lib/libelles";
import type { InscriptionResponse } from "@/types/distribution";

type Segment = "beneficiaires" | "benevoles" | "attente";

interface Props {
  inscrits: InscriptionResponse[];
  /* Horaire lisible de chaque creneau, par identifiant. */
  horaires: Record<string, string>;
  /* La presence n'a de sens qu'une fois la distribution demarree. */
  avecPresence: boolean;
}

const normaliser = (texte: string) => texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

function absences(n: number): string | null {
  if (n <= 0) return null;
  return n === 1 ? "1 absence passée" : `${n} absences passées`;
}

/*
 * Les inscrits d'une distribution comme dans un tableur, en mieux : segments,
 * recherche, tri. Les absences passees restent neutres, sans rouge.
 */
export function TableInscrits({ inscrits, horaires, avecPresence }: Props) {
  const [segment, setSegment] = useState<Segment>("beneficiaires");
  const [recherche, setRecherche] = useState("");

  const parSegment = useMemo(
    () => ({
      beneficiaires: inscrits.filter((i) => i.statut === "CONFIRMEE" && i.type === "BENEFICIAIRE"),
      benevoles: inscrits.filter((i) => i.statut === "CONFIRMEE" && i.type === "BENEVOLE"),
      attente: inscrits
        .filter((i) => i.statut === "LISTE_ATTENTE")
        .sort((a, b) => (a.rangListeAttente ?? 0) - (b.rangListeAttente ?? 0)),
    }),
    [inscrits],
  );

  const terme = normaliser(recherche.trim());
  const lignes = parSegment[segment].filter((i) => !terme || normaliser(`${i.nom} ${i.prenom}`).includes(terme));
  const horaire = (i: InscriptionResponse) => (i.creneauId ? (horaires[i.creneauId] ?? "") : "");

  function etat(i: InscriptionResponse) {
    if (segment === "attente") {
      return `Rang ${i.rangListeAttente ?? "?"}${i.type === "BENEVOLE" ? ", bénévole" : ""}`;
    }
    if (avecPresence) {
      const libelle = STATUT_PRESENCE[i.presence];
      return <Statut libelle={libelle} detail={i.absenceDeduite ? "non pointée" : undefined} />;
    }
    return i.type === "BENEVOLE" && i.roles.length > 0 ? i.roles.map((r) => r.libelle).join(", ") : null;
  }

  // Avant le jour J, un beneficiaire n'a ni role ni presence : la colonne serait vide.
  const avecEtat = segment !== "beneficiaires" || avecPresence;
  const colonnes: ColumnDef<InscriptionResponse>[] = [
    { key: "nom", header: "Nom", sortable: true, cell: (i) => <span className="font-semibold">{i.nom} {i.prenom}</span> },
    { key: "creneau", header: "Créneau", sortable: true, className: "tabular-nums", cell: (i) => horaire(i) || "-" },
    ...(avecEtat
      ? [{ key: "etat", header: segment === "attente" ? "Rang" : avecPresence ? "Présence" : "Rôles", cell: (i: InscriptionResponse) => etat(i) ?? "-" }]
      : []),
    {
      key: "absences",
      header: "Historique",
      sortable: true,
      className: "text-muted-foreground",
      cell: (i) => (i.type === "BENEFICIAIRE" ? (absences(i.nombreAbsencesPassees) ?? "-") : "-"),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SegmentedControl
          label="Inscrits à afficher"
          value={segment}
          onValueChange={setSegment}
          options={[
            { value: "beneficiaires", label: "Bénéficiaires", count: parSegment.beneficiaires.length },
            { value: "benevoles", label: "Bénévoles", count: parSegment.benevoles.length },
            { value: "attente", label: "Attente", count: parSegment.attente.length },
          ]}
        />
        <SearchField
          label="Chercher une personne"
          placeholder="Nom ou prénom"
          value={recherche}
          onValueChange={setRecherche}
          className="md:w-72"
        />
      </div>

      {lignes.length === 0 ? (
        <EmptyState
          size="sm"
          title={terme ? "Personne ne correspond" : "Personne pour l'instant"}
          description={terme ? "Vérifiez l'orthographe ou cherchez par prénom." : undefined}
        />
      ) : (
        <>
          <DataTable
            className="hidden md:block"
            data={lignes}
            columns={colonnes}
            pageSize={50}
            getRowKey={(i) => i.id}
            sortKey={(i, cle) =>
              cle === "creneau" ? horaire(i) : cle === "absences" ? i.nombreAbsencesPassees : `${i.nom} ${i.prenom}`
            }
          />
          <List className="md:hidden">
            {lignes.map((i) => (
              <ListRow
                key={i.id}
                titre={`${i.nom} ${i.prenom}`}
                sousTitre={[horaire(i), i.type === "BENEFICIAIRE" ? absences(i.nombreAbsencesPassees) : null]
                  .filter(Boolean)
                  .join(", ")}
                fin={etat(i)}
              />
            ))}
          </List>
        </>
      )}
    </div>
  );
}
