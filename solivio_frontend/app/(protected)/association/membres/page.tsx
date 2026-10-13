import type { Metadata } from "next";
import { lireMoi, lireServeur } from "@/lib/api/serveur";
import { GestionMembres } from "@/components/association/GestionMembres";
import { InviterMembre } from "@/components/association/InviterMembre";
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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Membres</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {membres.length} membre{membres.length !== 1 ? "s" : ""} dans l&apos;association.
          </p>
        </div>
        {estResponsable && <InviterMembre />}
      </div>

      <GestionMembres membres={membres} currentUserId={me?.id ?? ""} peutVoirDossiers={estResponsable} />
    </div>
  );
}
