import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GestionTypesRoles } from "@/components/association/GestionTypesRoles";
import { Archive, ListTree, Ticket, Users } from "lucide-react";
import { DeuxColonnes } from "@/components/ui/deux-colonnes";
import { EncartInfo } from "@/components/shared/Encarts";
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
    <div className="flex flex-col gap-6">
      <PageHeader className="mb-0 sm:mb-0" titre="Rôles bénévoles" description="Les rôles attribués aux bénévoles d'une distribution. Ils apparaissent sur leur billet." />
      <DeuxColonnes
        aside={
          <EncartInfo
            titre="Comment ça sert"
            ton="marque"
            points={[
              { icone: Users, texte: "Un rôle se donne à un bénévole inscrit, depuis l'onglet Équipe de la distribution." },
              { icone: Ticket, texte: "Il s'affiche sur son billet : chacun sait ce qu'il fera en arrivant." },
              { icone: ListTree, texte: "Un sous-rôle précise un rôle, par exemple Distribution, puis Fruits et légumes." },
              { icone: Archive, texte: "Archiver un rôle le retire des choix sans effacer l'historique." },
            ]}
          />
        }
      >
        <GestionTypesRoles initialTypes={types ?? []} peutArchiver={roles.includes("responsable")} />
      </DeuxColonnes>
    </div>
  );
}
