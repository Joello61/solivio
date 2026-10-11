import type { TypeRoleResponse } from "@/types/distribution";

export interface RoleAttribuable {
  id: string;
  libelle: string;
}

/** Roles du catalogue encore attribuables : actifs, sous-roles prefixes de leur role. */
export function rolesAttribuables(types: TypeRoleResponse[]): RoleAttribuable[] {
  return types
    .filter((t) => t.actif)
    .flatMap((t) => [
      { id: t.id, libelle: t.libelle },
      ...t.sousTypes.filter((s) => s.actif).map((s) => ({ id: s.id, libelle: `${t.libelle} - ${s.libelle}` })),
    ]);
}
