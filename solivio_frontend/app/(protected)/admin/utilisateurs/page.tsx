import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { CompteAdminResponse, PageResponse } from "@/types/profil";
import type { MeResponse } from "@/types/auth";
import { GestionComptes } from "@/components/admin/GestionComptes";

export const metadata: Metadata = { title: "Gestion des utilisateurs" };

async function fetchData(
  cookieHeader: string,
  q: string | null,
  page: number
): Promise<{ me: MeResponse | null; comptes: PageResponse<CompteAdminResponse> | null }> {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";
  const headers = { Cookie: cookieHeader };

  const params = new URLSearchParams({ page: String(page), taille: "20" });
  if (q) params.set("q", q);

  const [meRes, comptesRes] = await Promise.all([
    fetch(`${baseUrl}/api/auth/me`, { headers, cache: "no-store" }),
    fetch(`${baseUrl}/api/admin/comptes?${params}`, { headers, cache: "no-store" }),
  ]);

  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const comptes = comptesRes.ok
    ? ((await comptesRes.json()) as PageResponse<CompteAdminResponse>)
    : null;

  return { me, comptes };
}

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminUtilisateursPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const { q, page: pageStr } = await searchParams;
  const page = Math.max(0, parseInt(pageStr ?? "0", 10) || 0);

  const { me, comptes } = await fetchData(cookieHeader, q ?? null, page);

  if (!me) redirect("/login");
  if (!me.superAdmin) redirect("/dashboard");
  if (!comptes) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Utilisateurs</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {comptes.totalElements} compte{comptes.totalElements !== 1 ? "s" : ""} au total.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <GestionComptes
          page={comptes}
          recherche={q ?? ""}
          currentPage={page}
        />
      </div>
    </div>
  );
}
