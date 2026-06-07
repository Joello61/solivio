import { cookies } from "next/headers";
import type { Metadata } from "next";
import { GestionMembres } from "@/components/association/GestionMembres";
import type { MembreResponse } from "@/types/association";
import type { MeResponse } from "@/types/auth";

export const metadata: Metadata = { title: "Membres de l'association" };

async function fetchMembresEtMe(cookieHeader: string): Promise<{
  membres: MembreResponse[];
  me: MeResponse | null;
}> {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";
  const headers = { Cookie: cookieHeader };

  const [membresRes, meRes] = await Promise.all([
    fetch(`${baseUrl}/api/association/membres`, { headers, cache: "no-store" }),
    fetch(`${baseUrl}/api/auth/me`, { headers, cache: "no-store" }),
  ]);

  const membres = membresRes.ok ? ((await membresRes.json()) as MembreResponse[]) : [];
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;

  return { membres, me };
}

export default async function MembresPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const { membres, me } = await fetchMembresEtMe(cookieHeader);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Membres</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {membres.length} membre{membres.length !== 1 ? "s" : ""} dans l&apos;association.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <GestionMembres membres={membres} currentUserId={me?.id ?? ""} />
      </div>
    </div>
  );
}
