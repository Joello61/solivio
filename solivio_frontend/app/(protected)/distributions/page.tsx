import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DistributionCard } from "@/components/distributions/DistributionCard";
import type { DistributionResponse } from "@/types/distribution";
import type { MeResponse } from "@/types/auth";

export const metadata: Metadata = { title: "Distributions" };

async function fetchMeEtDistributions(cookieHeader: string): Promise<{
  me: MeResponse | null;
  distributions: DistributionResponse[];
}> {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";
  const headers = { Cookie: cookieHeader };

  const [meRes, distribRes] = await Promise.all([
    fetch(`${baseUrl}/api/auth/me`, { headers, cache: "no-store" }),
    fetch(`${baseUrl}/api/distributions`, { headers, cache: "no-store" }),
  ]);

  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const distributions = distribRes.ok ? ((await distribRes.json()) as DistributionResponse[]) : [];

  return { me, distributions };
}

export default async function DistributionsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const { me, distributions } = await fetchMeEtDistributions(cookieHeader);

  const estGestionnaire = me?.roles.some((r) =>
    ["coordinateur", "responsable", "super_admin"].includes(r),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Distributions</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {estGestionnaire
              ? "Gerez et suivez toutes les distributions."
              : "Inscrivez-vous a une distribution disponible."}
          </p>
        </div>
        {estGestionnaire && (
          <Link href="/distributions/nouvelle" className={buttonVariants()}>
            <Plus className="mr-2 size-4" />
            Nouvelle distribution
          </Link>
        )}
      </div>

      {distributions.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">Aucune distribution disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {distributions.map((d) => (
            <DistributionCard key={d.id} distribution={d} estGestionnaire={estGestionnaire} />
          ))}
        </div>
      )}
    </div>
  );
}
