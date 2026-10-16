"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConditionsBeneficiaire } from "@/components/shared/ChoixRoles";
import { ajouterMonRole } from "@/lib/api/profil";
import { messageErreur } from "@/lib/erreurs";
import { ROLES_LIBRES, libelleRoles, type RoleLibre } from "@/lib/roles";

const PROPOSITION: Record<RoleLibre, { bouton: string; detail: string }> = {
  benevole: {
    bouton: "Devenir aussi bénévole",
    detail: "Pour donner un coup de main aux distributions, collectes et événements.",
  },
  beneficiaire: {
    bouton: "Devenir aussi bénéficiaire",
    detail: "Pour vous inscrire aux distributions et recevoir des denrées.",
  },
};

/*
 * Roles du membre, et ceux qu'il peut prendre seul (ADR-012) : sans validation, mais
 * les conditions pour etre beneficiaire sont rappelees et attestees.
 */
export function MesRoles({ roles }: { roles: string[] }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState<RoleLibre | null>(null);
  const [attestation, setAttestation] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const responsable = roles.includes("responsable");
  const possibles = responsable ? [] : ROLES_LIBRES.filter((r) => !roles.includes(r));

  async function ajouter(role: RoleLibre) {
    if (role === "beneficiaire" && !attestation) {
      setErreur("Cochez d'abord la case : être bénéficiaire suppose d'être étudiant inscrit.");
      return;
    }
    setEnCours(role);
    setErreur(null);
    try {
      await ajouterMonRole(role, role === "beneficiaire" && attestation);
      toast.success(role === "benevole" ? "Vous êtes aussi bénévole." : "Vous êtes aussi bénéficiaire.");
      router.refresh();
    } catch (e) {
      setErreur(messageErreur(e, "Le rôle n'a pas pu être ajouté. Réessayez dans un instant."));
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {libelleRoles(roles)
          .split(", ")
          .map((libelle) => (
            <Badge key={libelle} variant="secondary">
              {libelle}
            </Badge>
          ))}
      </div>
      {responsable && (
        <p className="text-base text-muted-foreground">Un responsable n&apos;a que ce rôle.</p>
      )}
      {possibles.map((role) => (
        <div key={role} className="flex flex-col gap-3 rounded-2xl border border-border p-4">
          <p className="text-base text-foreground">{PROPOSITION[role].detail}</p>
          {role === "beneficiaire" && (
            <ConditionsBeneficiaire id="attestation-compte" attestation={attestation} onAttestation={setAttestation} />
          )}
          <Button variant="outline" className="self-start" disabled={enCours !== null} onClick={() => ajouter(role)}>
            {enCours === role ? <Spinner size="sm" /> : <UserPlus aria-hidden="true" />}
            {PROPOSITION[role].bouton}
          </Button>
        </div>
      ))}
      {erreur && <Alert variant="destructive">{erreur}</Alert>}
    </div>
  );
}
