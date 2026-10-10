import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Truck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MissionCollecteCard } from "@/components/collecte/MissionCollecteCard";
import type { MissionCollecteResponse, StatutMission } from "@/types/collecte";
import type { MeResponse } from "@/types/auth";

export const metadata: Metadata = { title: "Missions collecte" };

const ONGLETS: { statut: StatutMission | null; label: string }[] = [
  { statut: null, label: "Toutes" },
  { statut: "DISPONIBLE", label: "Disponibles" },
  { statut: "PRISE_EN_CHARGE", label: "En cours" },
  { statut: "COLLECTE_EFFECTUEE", label: "Collecte faite" },
  { statut: "DEPOT_VALIDE", label: "Terminees" },
  { statut: "ANNULEE", label: "Annulees" },
];

async function fetchData(cookieHeader: string, statut?: string): Promise<{
  me: MeResponse | null;
  missions: MissionCollecteResponse[];
}> {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";
  const headers = { Cookie: cookieHeader };
  const qs = statut ? `?statut=${statut}` : "";

  const [meRes, missionsRes] = await Promise.all([
    fetch(`${baseUrl}/api/auth/me`, { headers, cache: "no-store" }),
    fetch(`${baseUrl}/api/missions-collecte${qs}`, { headers, cache: "no-store" }),
  ]);

  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const missions = missionsRes.ok ? ((await missionsRes.json()) as MissionCollecteResponse[]) : [];
  return { me, missions };
}

interface Props {
  searchParams: Promise<{ statut?: string }>;
}

export default async function MissionsCollectePage({ searchParams }: Props) {
  const { statut } = await searchParams;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const { me, missions } = await fetchData(cookieHeader, statut);

  const estGestionnaire = me?.roles.some((r) => ["responsable", "super_admin"].includes(r));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Missions collecte</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {estGestionnaire
              ? "Gerez les missions de collecte et de depot."
              : "Consultez et prenez en charge les missions disponibles."}
          </p>
        </div>
        {estGestionnaire && (
          <Link href="/missions-collecte/nouvelle" className={buttonVariants({ size: "sm" })}>
            <Plus className="mr-2 size-4" />
            Nouvelle mission
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {ONGLETS.map((o) => {
          const actif = (o.statut ?? "") === (statut ?? "");
          const href = o.statut ? `/missions-collecte?statut=${o.statut}` : "/missions-collecte";
          return (
            <Link
              key={o.label}
              href={href}
              className={
                actif
                  ? "rounded-lg px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground"
                  : "rounded-lg px-3 py-1.5 text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80"
              }
            >
              {o.label}
            </Link>
          );
        })}
      </div>

      {missions.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm">
          <EmptyState
            icon={Truck}
            title="Aucune mission"
            description={
              estGestionnaire
                ? "Aucune mission de collecte pour ce filtre."
                : "Aucune mission n'est disponible pour le moment."
            }
            action={
              estGestionnaire
                ? { label: "Creer une mission", href: "/missions-collecte/nouvelle" }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {missions.map((m) => (
            <MissionCollecteCard key={m.id} mission={m} />
          ))}
        </div>
      )}
    </div>
  );
}
