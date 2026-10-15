import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GestionTypesRoles } from "@/components/association/GestionTypesRoles";
import { PageHeader } from "@/components/ui/page-header";
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
    <>
      <PageHeader titre="Rôles bénévoles" description="Les rôles attribués aux bénévoles d'une distribution. Ils apparaissent sur leur billet." />
      <GestionTypesRoles initialTypes={types ?? []} peutArchiver={roles.includes("responsable")} />
    </>
  );
}
