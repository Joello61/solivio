import { cookies } from "next/headers";
import type { Metadata } from "next";
import { Truck } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { MissionCollecteCard } from "@/components/collecte/MissionCollecteCard";
import type { MissionCollecteResponse } from "@/types/collecte";

export const metadata: Metadata = { title: "Mes missions collecte" };

async function fetchMesMissions(cookieHeader: string): Promise<MissionCollecteResponse[]> {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";
  const res = await fetch(`${baseUrl}/api/missions-collecte/mes-missions`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  return res.ok ? ((await res.json()) as MissionCollecteResponse[]) : [];
}

export default async function MesMissionsCollectePage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const missions = await fetchMesMissions(cookieHeader);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Mes missions collecte</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Missions que vous avez prises en charge.
        </p>
      </div>

      {missions.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm">
          <EmptyState
            icon={Truck}
            title="Aucune mission"
            description="Vous n'avez pas encore pris de mission en charge."
            action={{ label: "Voir les missions disponibles", href: "/missions-collecte" }}
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
