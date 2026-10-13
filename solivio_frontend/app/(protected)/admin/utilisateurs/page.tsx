import { redirect } from "next/navigation";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import type { Metadata } from "next";
import type { CompteAdminResponse, PageResponse } from "@/types/profil";
import type { MeResponse } from "@/types/auth";
import { GestionComptes } from "@/components/admin/GestionComptes";

export const metadata: Metadata = { title: "Gestion des utilisateurs" };

async function fetchData(
  q: string | null,
  page: number
): Promise<{ me: MeResponse | null; comptes: PageResponse<CompteAdminResponse> | null }> {
  const params = new URLSearchParams({ page: String(page), taille: "20" });
  if (q) params.set("q", q);
  const [me, comptes] = await Promise.all([
    lireMoi(),
    lireServeur<PageResponse<CompteAdminResponse>>(`/api/admin/comptes?${params}`),
  ]);
  return { me, comptes };
}

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminUtilisateursPage({ searchParams }: PageProps) {
  const { q, page: pageStr } = await searchParams;
  const page = Math.max(0, parseInt(pageStr ?? "0", 10) || 0);

  const { me, comptes } = await fetchData(q ?? null, page);

  if (!me) redirect("/login");
  if (!me.superAdmin) redirect("/dashboard");
  if (!comptes) redirect("/dashboard");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Utilisateurs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {comptes.totalElements} compte{comptes.totalElements !== 1 ? "s" : ""} au total.
        </p>
      </div>

      <GestionComptes
        page={comptes}
        currentUserId={me.id}
        recherche={q ?? ""}
        currentPage={page}
      />
    </div>
  );
}
