"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { recalculerStatistiques } from "@/lib/api/association";
import { messageErreur } from "@/lib/erreurs";
import type { StatistiqueDistributionResponse } from "@/types/association";

type Ligne = StatistiqueDistributionResponse;

interface Props {
  lignes: Ligne[];
  titres: Record<string, string>;
  /* Le recalcul est reserve au responsable (backend). */
  peutRecalculer: boolean;
}

const DATE = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const date = (iso: string) => DATE.format(new Date(`${iso}T00:00:00Z`));
const taux = (s: Ligne) => Math.round(Number(s.tauxPresence));

type CleNombre = "nbInscritsBeneficiaires" | "nbPresentsBeneficiaires" | "nbAbsentsBeneficiaires" | "nbNonPointes" | "nbInscritsBenevoles";

const nombre = (cle: CleNombre, header: string): ColumnDef<Ligne> => ({
  key: cle,
  header,
  sortable: true,
  className: "text-right tabular-nums",
  headerClassName: "text-right",
  cell: (s) => s[cle],
});

/* Le detail par distribution, comme dans un tableur : tri par colonne, recalcul dans le menu. */
export function TableStatistiques({ lignes, titres, peutRecalculer }: Props) {
  const router = useRouter();

  async function recalculer(id: string) {
    try {
      await recalculerStatistiques(id);
      toast.success("Statistiques recalculées.");
      router.refresh();
    } catch (e) {
      toast.error(messageErreur(e, "Le recalcul n'a pas abouti."));
    }
  }

  const menu = (s: Ligne) =>
    peutRecalculer && (
      <ActionMenu
        size="sm"
        label={`Plus d'actions sur la distribution du ${date(s.distributionDate)}`}
        className="border-transparent bg-transparent text-muted-foreground"
        items={[{ label: "Recalculer", icon: RefreshCw, onClick: () => recalculer(s.distributionId) }]}
      />
    );

  const colonnes: ColumnDef<Ligne>[] = [
    {
      key: "date",
      header: "Distribution",
      sortable: true,
      cell: (s) => (
        <Link href={`/distributions/${s.distributionId}?onglet=bilan`} className="flex flex-col hover:underline">
          <span className="font-semibold text-foreground">{date(s.distributionDate)}</span>
          {titres[s.distributionId] && <span className="text-sm text-muted-foreground">{titres[s.distributionId]}</span>}
        </Link>
      ),
    },
    nombre("nbInscritsBeneficiaires", "Inscrits"),
    nombre("nbPresentsBeneficiaires", "Présents"),
    nombre("nbAbsentsBeneficiaires", "Absents"),
    nombre("nbNonPointes", "Non pointés"),
    {
      key: "taux",
      header: "Présence",
      sortable: true,
      className: "text-right font-semibold tabular-nums",
      headerClassName: "text-right",
      cell: (s) => `${taux(s)} %`,
    },
    nombre("nbInscritsBenevoles", "Bénévoles"),
    ...(peutRecalculer
      ? [
          {
            key: "menu",
            header: "",
            className: "text-right",
            cell: menu,
          },
        ]
      : []),
  ];

  return (
    <>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card md:hidden">
        {lignes.map((s) => (
          <li key={s.distributionId} className="flex items-center gap-3 px-4 py-3">
            <Link href={`/distributions/${s.distributionId}?onglet=bilan`} className="flex min-w-0 flex-1 flex-col">
              <span className="font-semibold text-foreground">{date(s.distributionDate)}</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {s.nbPresentsBeneficiaires} présents sur {s.nbInscritsBeneficiaires}, {s.nbInscritsBenevoles} bénévoles
              </span>
            </Link>
            <span className="font-display text-xl font-bold tabular-nums text-foreground">{taux(s)} %</span>
            {menu(s)}
          </li>
        ))}
      </ul>
      <DataTable
        className="hidden md:block"
        data={lignes}
        columns={colonnes}
        pageSize={50}
        getRowKey={(s) => s.distributionId}
        sortKey={(s, cle) => (cle === "date" ? s.distributionDate : cle === "taux" ? Number(s.tauxPresence) : s[cle as CleNombre])}
      />
    </>
  );
}
