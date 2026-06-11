import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus, CalendarDays } from "lucide-react";
import { EvenementCard } from "@/components/evenement/EvenementCard";
import type { EvenementResponse } from "@/types/evenement";
import type { MeResponse } from "@/types/auth";

export const metadata: Metadata = { title: "Evenements" };

const FILTRES = [
  { label: "Tous", statut: "" },
  { label: "Publies", statut: "PUBLIE" },
  { label: "En cours", statut: "EN_COURS" },
  { label: "Termines", statut: "TERMINE" },
  { label: "Brouillons", statut: "BROUILLON" },
] as const;

async function fetchData(cookieHeader: string, statut: string, type: string) {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";
  const headers = { Cookie: cookieHeader };
  const qs = new URLSearchParams();
  if (statut) qs.set("statut", statut);
  if (type) qs.set("type", type);

  const [evRes, meRes] = await Promise.all([
    fetch(`${baseUrl}/api/evenements?${qs}`, { headers, cache: "no-store" }),
    fetch(`${baseUrl}/api/auth/me`, { headers, cache: "no-store" }),
  ]);
  const evenements = evRes.ok ? ((await evRes.json()) as EvenementResponse[]) : [];
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  return { evenements, me };
}

interface Props {
  searchParams: Promise<{ statut?: string; type?: string }>;
}

export default async function EvenementsPage({ searchParams }: Props) {
  const { statut = "", type = "" } = await searchParams;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const { evenements, me } = await fetchData(cookieHeader, statut, type);

  const estGestionnaire =
    me?.roles.some((r) => ["admin", "coordinateur", "responsable", "super_admin"].includes(r)) ??
    false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground font-display">Evenements</h1>
        {estGestionnaire && (
          <Link
            href="/evenements/nouveau"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Nouvel evenement
          </Link>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTRES.map((f) => (
          <Link
            key={f.label}
            href={`/evenements${f.statut ? `?statut=${f.statut}` : ""}${type ? `${f.statut ? "&" : "?"}type=${type}` : ""}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              statut === f.statut
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {evenements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="size-7 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Aucun evenement pour ce filtre.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {evenements.map((e) => (
            <EvenementCard key={e.id} evenement={e} />
          ))}
        </div>
      )}
    </div>
  );
}
