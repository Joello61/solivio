import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Mes inscriptions</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Vos inscriptions en cours et passees.
        </p>
      </div>

      <section>
        <h2 className="text-base font-medium text-foreground mb-3">A venir</h2>
        {avenir.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Aucune inscription a venir.</p>
            <Link
              href="/distributions"
              className="mt-3 inline-block text-sm font-medium text-primary underline"
            >
              Voir les distributions disponibles
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {avenir.map((i) => (
              <CarteInscription key={i.id} inscription={i} />
            ))}
          </div>
        )}
      </section>

      {passees.length > 0 && (
        <section>
          <h2 className="text-base font-medium text-foreground mb-3">Historique</h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-card opacity-80">
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
    <div className="px-5 py-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/distributions/${i.distributionId}`}
          className="font-medium text-foreground hover:underline"
        >
          {i.distributionTitre ?? "Distribution"}
        </Link>
        <div className="flex gap-1.5 shrink-0">
          <Badge variant="outline" className="text-xs">
            {typeLabel(i.type)}
          </Badge>
          <Badge
            variant={i.statut === "CONFIRMEE" ? "default" : "secondary"}
            className="text-xs"
          >
            {statutLabel(i.statut, i.rangListeAttente)}
          </Badge>
        </div>
      </div>
      {dateFormatee && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3.5 shrink-0" />
          <span>{dateFormatee}</span>
        </div>
      )}
      {i.distributionLieu && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span>{i.distributionLieu}</span>
        </div>
      )}
      {i.presence !== "NON_POINTE" && (
        <p className="text-xs text-muted-foreground">
          Presence : {presenceLabel(i.presence)}
        </p>
      )}
    </div>
  );
}
