import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { MeResponse } from "@/types/auth";
import type { AssociationAdminResponse } from "@/types/association";
import GestionAssociations from "@/components/admin/GestionAssociations";

export const metadata: Metadata = { title: "Gestion des associations" };

async function fetchData(cookieHeader: string): Promise<{
  me: MeResponse | null;
  associations: AssociationAdminResponse[] | null;
}> {
  const base = process.env.API_URL ?? "http://localhost:8080";
  const headers = { Cookie: cookieHeader };

  const [meRes, assocRes] = await Promise.all([
    fetch(`${base}/api/auth/me`, { headers, cache: "no-store" }),
    fetch(`${base}/api/admin/associations`, { headers, cache: "no-store" }),
  ]);

  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const associations = assocRes.ok
    ? ((await assocRes.json()) as AssociationAdminResponse[])
    : null;

  return { me, associations };
}

export default async function AdminAssociationsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const { me, associations } = await fetchData(cookieHeader);

  if (!me) redirect("/login");
  if (!me.superAdmin) redirect("/dashboard");
  if (!associations) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Associations</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gestion des associations et provisionnement des tenants.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <GestionAssociations associations={associations} />
      </div>
    </div>
  );
}
