import Link from "next/link";
import { lireServeur } from "@/lib/api/serveur";
import type { Metadata } from "next";
import { MapPin, CalendarSearch, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { BoutonDesinscription } from "@/components/inscriptions/BoutonDesinscription";

export const metadata: Metadata = { title: "Mes inscriptions" };

interface InscriptionPersonnelle {
  id: string;
  distributionId: string;
  distributionTitre: string | null;
  distributionDate: string | null;
  distributionLieu: string | null;
  type: string;
  statut: string;
  rangListeAttente: number | null;
  presence: string;
  absenceDeduite: boolean;
  dateInscription: string;
}


function statutLabel(statut: string, rang: number | null): string {
  if (statut === "LISTE_ATTENTE") return `Liste d'attente (rang ${rang ?? "?"})`;
  if (statut === "CONFIRMEE") return "Confirmé(e)";
  if (statut === "ANNULEE") return "Annulé(e)";
  return statut;
}

function typeLabel(type: string): string {
  return type === "BENEFICIAIRE" ? "Bénéficiaire" : "Bénévole";
}

function presenceLabel(presence: string, absenceDeduite: boolean): string {
  if (presence === "PRESENT") return "Présent(e)";
  if (presence === "ABSENT") return absenceDeduite ? "Absent(e), non pointé(e)" : "Absent(e)";
  return "Non pointé(e)";
}

const STATUT_PILL: Record<string, string> = {
  CONFIRMEE:     "bg-primary/10 text-primary border-primary/25",
  LISTE_ATTENTE: "bg-warning/10 text-warning border-warning/30",
  ANNULEE:       "bg-destructive/10 text-destructive border-destructive/30",
};

const STATUT_ACCENT: Record<string, string> = {
  CONFIRMEE:     "border-l-primary",
  LISTE_ATTENTE: "border-l-orange-400",
  ANNULEE:       "border-l-destructive",
};

const TYPE_PILL: Record<string, string> = {
  BENEFICIAIRE: "bg-muted text-muted-foreground border-border",
  BENEVOLE:     "bg-muted text-muted-foreground border-border",
};

export default async function MesInscriptionsPage() {
  const inscriptions = (await lireServeur<InscriptionPersonnelle[]>("/api/inscriptions/mes")) ?? [];

  const aujourdhui = new Date().toISOString().split("T")[0];
  const avenir = inscriptions.filter(
    (i) =>
      i.statut !== "ANNULEE" &&
      i.distributionDate &&
      i.distributionDate >= aujourdhui,
  );
  const passees = inscriptions.filter(
    (i) =>
      i.statut === "ANNULEE" ||
      !i.distributionDate ||
      i.distributionDate < aujourdhui,
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Mes inscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vos inscriptions en cours et passées.
        </p>
      </div>

      {inscriptions.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <EmptyState
            icon={CalendarSearch}
            title="Aucune inscription"
            description="Vous n'êtes inscrit(e) à aucune distribution pour le moment."
            action={{ label: "Voir les distributions", href: "/distributions" }}
          />
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-semibold text-foreground font-display">À venir</h2>
              {avenir.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {avenir.length} inscription{avenir.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {avenir.length === 0 ? (
              <p className="text-sm text-muted-foreground italic px-1">
                Aucune inscription à venir.
              </p>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-card shadow-sm divide-y divide-border/60 overflow-hidden">
                {avenir.map((i) => (
                  <CarteInscription
                    key={i.id}
                    inscription={i}
                    // Le backend refuse une desinscription apres pointage ou une fois la distribution terminee.
                    desinscriptionPossible={i.presence === "NON_POINTE"}
                  />
                ))}
              </div>
            )}
          </section>

          {passees.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-baseline gap-2">
                <h2 className="text-base font-semibold text-foreground font-display">Historique</h2>
                <span className="text-sm text-muted-foreground">
                  {passees.length} inscription{passees.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card shadow-sm divide-y divide-border/60 overflow-hidden opacity-80">
                {passees.map((i) => (
                  <CarteInscription key={i.id} inscription={i} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function CarteInscription({
  inscription: i,
  desinscriptionPossible = false,
}: {
  inscription: InscriptionPersonnelle;
  desinscriptionPossible?: boolean;
}) {
  const date = i.distributionDate ? new Date(i.distributionDate + "T00:00:00") : null;
  const jour = date?.getDate();
  const mois = date?.toLocaleString("fr-FR", { month: "short" });

  const accentClass = STATUT_ACCENT[i.statut] ?? "border-l-border/60";

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 pr-4", "border-l-[3px]", accentClass)}>
      <Link
        href={`/distributions/${i.distributionId}`}
        className="group flex min-w-0 flex-1 items-center gap-4 py-4 pl-4 hover:bg-primary/5 transition-colors"
      >
        {/* Bloc date */}
        {date ? (
          <div className="flex-shrink-0 w-10 text-center">
            <p className="text-xl font-bold text-foreground leading-none tabular-nums">{jour}</p>
            <p className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider mt-0.5 capitalize">{mois}</p>
          </div>
        ) : (
          <div className="flex-shrink-0 w-10" />
        )}

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
              {i.distributionTitre ?? "Distribution"}
            </span>
            <div className="flex gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  TYPE_PILL[i.type] ?? "bg-muted text-muted-foreground border-border",
                )}
              >
                {typeLabel(i.type)}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  STATUT_PILL[i.statut] ?? "bg-muted text-muted-foreground border-border",
                )}
              >
                {statutLabel(i.statut, i.rangListeAttente)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {i.distributionLieu && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span>{i.distributionLieu}</span>
              </div>
            )}
            {i.presence !== "NON_POINTE" && (
              <span className="text-xs text-muted-foreground">
                Présence : {presenceLabel(i.presence, i.absenceDeduite)}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </Link>
      {desinscriptionPossible && (
        <div className="flex w-full justify-end pb-3 sm:w-auto sm:pb-0">
          <BoutonDesinscription
            distributionId={i.distributionId}
            inscriptionId={i.id}
            titre={i.distributionTitre ?? "cette distribution"}
            benevole={i.type === "BENEVOLE"}
            enAttente={i.statut === "LISTE_ATTENTE"}
          />
        </div>
      )}
    </div>
  );
}
