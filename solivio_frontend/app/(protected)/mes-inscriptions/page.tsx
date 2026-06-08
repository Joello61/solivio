import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { Calendar, MapPin, CalendarSearch, ArrowRight } from "lucide-react";
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
  CONFIRMEE:     "bg-primary/10 text-primary border-primary/20",
  LISTE_ATTENTE: "bg-ambre-100 text-ambre-800 border-ambre-200 dark:bg-ambre-950/30 dark:text-ambre-300 dark:border-ambre-800/40",
  ANNULEE:       "bg-destructive/10 text-destructive border-destructive/20",
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
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Mes inscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vos inscriptions en cours et passees.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            A venir
          </p>
          {avenir.length > 0 && (
            <span className="text-xs text-muted-foreground">{avenir.length} inscription{avenir.length > 1 ? "s" : ""}</span>
          )}
        </div>
        {avenir.length === 0 ? (
          <div className="rounded-xl border border-border bg-card">
            <EmptyState
              icon={CalendarSearch}
              title="Aucune inscription a venir"
              description="Inscrivez-vous a une distribution pour la voir apparaitre ici."
              action={{ label: "Voir les distributions", href: "/distributions" }}
              size="sm"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {avenir.map((i) => (
              <CarteInscription key={i.id} inscription={i} />
            ))}
          </div>
        )}
      </section>

      {passees.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Historique
            </p>
            <span className="text-xs text-muted-foreground">{passees.length} inscription{passees.length > 1 ? "s" : ""}</span>
          </div>
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden opacity-80">
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
  const dateFormatee = i.distributionDate
    ? new Date(i.distributionDate + "T00:00:00").toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Link
      href={`/distributions/${i.distributionId}`}
      className="group flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
    >
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
            {i.distributionTitre ?? "Distribution"}
          </span>
          <div className="flex gap-1.5">
            <span
              className={cn(
                "inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium",
                TYPE_PILL[i.type] ?? "bg-muted text-muted-foreground border-border",
              )}
            >
              {typeLabel(i.type)}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium",
                STATUT_PILL[i.statut] ?? "bg-muted text-muted-foreground border-border",
              )}
            >
              {statutLabel(i.statut, i.rangListeAttente)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {dateFormatee && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5 shrink-0" />
              <span className="capitalize">{dateFormatee}</span>
            </div>
          )}
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

      <ArrowRight className="size-4 shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}
