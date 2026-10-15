import type { Metadata } from "next";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { GestionMembres } from "@/components/association/GestionMembres";
import { InviterMembre } from "@/components/association/InviterMembre";
import { PageHeader } from "@/components/ui/page-header";
import type { MembreResponse } from "@/types/association";
import type { MeResponse } from "@/types/auth";

export const metadata: Metadata = { title: "Membres de l'association" };

async function fetchMembresEtMe(): Promise<{
  membres: MembreResponse[];
  me: MeResponse | null;
}> {
  const [membres, me] = await Promise.all([
    lireServeur<MembreResponse[]>("/api/association/membres"),
    lireMoi(),
  ]);
  return { membres: membres ?? [], me };
}

export default async function MembresPage() {
  const { membres, me } = await fetchMembresEtMe();
  // Le backend reserve l'invitation et la lecture des dossiers au role responsable.
  const estResponsable = me?.roles.includes("responsable") ?? false;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        className="mb-0 sm:mb-0"
        titre="Membres"
        description={`${membres.length} membre${membres.length > 1 ? "s" : ""} dans l'association.`}
        actions={estResponsable && <InviterMembre />}
      />
      <GestionMembres membres={membres} currentUserId={me?.id ?? ""} peutVoirDossiers={estResponsable} />
    </div>
  );
}
