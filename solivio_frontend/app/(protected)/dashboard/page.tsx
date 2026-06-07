import { cookies } from "next/headers";
import Link from "next/link";
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

      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-medium text-base">Acces rapide</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/distributions"
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent/50 transition-colors"
          >
            Distributions
          </Link>
        </div>
      </div>
    </div>
  );
}
