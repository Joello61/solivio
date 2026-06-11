import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, CalendarSearch, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

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
  dateInscription: string;
}

async function fetchMesInscriptions(
  cookieHeader: string,
): Promise<InscriptionPersonnelle[]> {
  const base = process.env.API_URL ?? "http://localhost:8080";
  try {
    const res = await fetch(`${base}/api/inscriptions/mes`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json() as Promise<InscriptionPersonnelle[]>;
  } catch {
    return [];
  }
}

function statutLabel(statut: string, rang: number | null): string {
  if (statut === "LISTE_ATTENTE") return `Liste d'attente (rang ${rang ?? "?"})`;
  if (statut === "CONFIRMEE") return "Confirme(e)";
  if (statut === "ANNULEE") return "Annule(e)";
  return statut;
}

function typeLabel(type: string): string {
  return type === "BENEFICIAIRE" ? "Beneficiaire" : "Benevole";
}

function presenceLabel(presence: string): string {
  if (presence === "PRESENT") return "Present(e)";
  if (presence === "ABSENT") return "Absent(e)";
  return "Non pointe(e)";
}

const STATUT_PILL: Record<string, string> = {
  CONFIRMEE:     "bg-teal-50 text-primary border-teal-200 dark:bg-teal-950/30 dark:border-teal-800/40",
  LISTE_ATTENTE: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/40",
  ANNULEE:       "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40",
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
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const inscriptions = await fetchMesInscriptions(cookieHeader);

  const maintenant = new Date();
  const avenir = inscriptions.filter(
    (i) =>
      i.statut !== "ANNULEE" &&
      i.distributionDate &&
      new Date(i.distributionDate) >= maintenant,
  );
  const passees = inscriptions.filter(
    (i) =>
      i.statut === "ANNULEE" ||
      !i.distributionDate ||
      new Date(i.distributionDate) < maintenant,
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Mes inscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vos inscriptions en cours et passees.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-foreground font-display">A venir</h2>
          {avenir.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {avenir.length} inscription{avenir.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {avenir.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm">
            <EmptyState
              icon={CalendarSearch}
              title="Aucune inscription a venir"
              description="Inscrivez-vous a une distribution pour la voir apparaitre ici."
              action={{ label: "Voir les distributions", href: "/distributions" }}
              size="sm"
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm divide-y divide-border/60 overflow-hidden">
            {avenir.map((i) => (
              <CarteInscription key={i.id} inscription={i} />
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
          <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm divide-y divide-border/60 overflow-hidden opacity-80">
            {passees.map((i) => (
              <CarteInscription key={i.id} inscription={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CarteInscription({ inscription: i }: { inscription: InscriptionPersonnelle }) {
  const date = i.distributionDate ? new Date(i.distributionDate + "T00:00:00") : null;
  const jour = date?.getDate();
  const mois = date?.toLocaleString("fr-FR", { month: "short" });

  const accentClass = STATUT_ACCENT[i.statut] ?? "border-l-border/60";

  return (
    <Link
      href={`/distributions/${i.distributionId}`}
      className={cn(
        "group flex items-center gap-4 pl-4 pr-5 py-4",
        "border-l-[3px]",
        accentClass,
        "hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-colors",
      )}
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
              Presence : {presenceLabel(i.presence)}
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}
