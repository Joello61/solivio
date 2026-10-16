import type { Metadata } from "next";
import { MessageMembres } from "@/components/association/MessageMembres";
import { PageHeader } from "@/components/ui/page-header";
import { lireServeur } from "@/lib/api/serveur";
import type { CibleEmail } from "@/lib/api/notification";
import type { MembreResponse } from "@/types/association";

export const metadata: Metadata = { title: "Message aux membres" };

// Le backend ecrit aux membres actifs du role vise (EmailLibreService).
const ROLE: Record<Exclude<CibleEmail, "TOUS">, string> = {
  BENEVOLES: "benevole",
  BENEFICIAIRES: "beneficiaire",
  COORDINATEURS: "coordinateur",
  RESPONSABLES: "responsable",
};

export default async function MessageMembresPage() {
  const membres = ((await lireServeur<MembreResponse[]>("/api/association/membres")) ?? []).filter((m) => m.statut === "actif");
  const compte = (role: string) => membres.filter((m) => m.roles.includes(role)).length;
  const parRole = Object.fromEntries(Object.entries(ROLE).map(([cible, role]) => [cible, compte(role)])) as Record<Exclude<CibleEmail, "TOUS">, number>;
  // Une personne qui cumule les roles ne recoit qu'un email : on compte des personnes.
  const destinataires = { ...parRole, TOUS: membres.filter((m) => m.roles.length > 0).length };

  return (
    <>
      <PageHeader titre="Message aux membres" description="Un email à un groupe de membres, envoyé tout de suite." />
      <MessageMembres destinataires={destinataires} />
    </>
  );
}
