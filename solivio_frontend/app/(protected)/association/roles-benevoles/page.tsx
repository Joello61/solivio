import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GestionTypesRoles } from "@/components/association/GestionTypesRoles";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import type { TypeRoleResponse } from "@/types/distribution";

export const metadata: Metadata = { title: "Rôles bénévoles" };

export default async function RolesBenevolesPage() {
  const [types, me] = await Promise.all([
    lireServeur<TypeRoleResponse[]>("/api/types-roles"),
    lireMoi(),
  ]);
  // Creation et renommage : coordinateur et responsable ; archivage : responsable (backend).
  const roles = me?.roles ?? [];
  if (!roles.some((r) => r === "coordinateur" || r === "responsable")) redirect("/dashboard");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Rôles bénévoles</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Les rôles proposés lors de l&apos;attribution des tâches aux bénévoles inscrits à une distribution.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-6">
        <GestionTypesRoles initialTypes={types ?? []} peutArchiver={roles.includes("responsable")} />
      </div>
    </div>
  );
}
