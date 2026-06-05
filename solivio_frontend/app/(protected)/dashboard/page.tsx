import { cookies } from "next/headers";
import type { Metadata } from "next";
import type { MeResponse } from "@/types/auth";

export const metadata: Metadata = { title: "Tableau de bord" };

async function fetchMe(): Promise<MeResponse | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  try {
    const res = await fetch(
      `${process.env.API_URL ?? "http://localhost:8080"}/api/auth/me`,
      { headers: { Cookie: cookieHeader }, cache: "no-store" },
    );
    if (!res.ok) return null;
    return res.json() as Promise<MeResponse>;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const user = await fetchMe();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Bonjour, {user?.prenom ?? "utilisateur"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Bienvenue sur votre espace{user?.tenantActif ? ` - ${user.tenantActif}` : ""}.
        </p>
      </div>

      {/* Placeholder - sera remplace par les modules metier en Phase 2 */}
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Les modules de gestion des distributions, des inscriptions et
          de la repartition seront disponibles ici lors de la Phase 2.
        </p>
      </div>
    </div>
  );
}
