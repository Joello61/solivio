import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import type { ParticipationEvenementResponse } from "@/types/evenement";

export const metadata: Metadata = { title: "Mes evenements" };

const LABEL_ROLE: Record<string, string> = {
  STAFF: "Staff",
  PARTICIPANT: "Participant",
};

const COULEUR_PRESENCE: Record<string, string> = {
  NON_POINTE: "bg-slate-100 text-slate-600",
  PRESENT: "bg-emerald-100 text-emerald-700",
  ABSENT: "bg-red-100 text-red-700",
};

async function fetchParticipations(cookieHeader: string): Promise<ParticipationEvenementResponse[]> {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";
  const res = await fetch(`${baseUrl}/api/evenements/mes-evenements`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  return res.ok ? ((await res.json()) as ParticipationEvenementResponse[]) : [];
}

export default async function MesEvenementsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const participations = await fetchParticipations(cookieHeader);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground font-display">Mes evenements</h1>

      {participations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="size-7 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Vous n&apos;etes inscrit a aucun evenement.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {participations.map((p) => (
            <Link
              key={p.id}
              href={`/evenements/${p.evenementId}`}
              className="block rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-shadow p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {p.personneNomComplet ?? "Evenement"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Role : {LABEL_ROLE[p.role] ?? p.role} - Inscrit le{" "}
                    {new Date(p.dateInscription).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${COULEUR_PRESENCE[p.presence] ?? ""}`}
                >
                  {p.presence === "NON_POINTE"
                    ? "Non pointe"
                    : p.presence === "PRESENT"
                      ? "Present"
                      : "Absent"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
