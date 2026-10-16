"use client";

import { HandHeart, IdCard, ShoppingBag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ROLES_LIBRES, type RoleLibre } from "@/lib/roles";

export interface ChoixRolesValeur {
  roles: RoleLibre[];
  attestationEtudiant: boolean;
}

const PRESENTATION: Record<RoleLibre, { titre: string; detail: string; icone: LucideIcon }> = {
  benevole: {
    titre: "Bénévole",
    detail: "Je donne de mon temps : distributions, collectes, reconditionnement, événements.",
    icone: HandHeart,
  },
  beneficiaire: {
    titre: "Bénéficiaire",
    detail: "Je viens chercher des denrées aux distributions.",
    icone: ShoppingBag,
  },
};

/** Ce qu'il faut pour etre beneficiaire (ADR-012), affiche partout ou l'on choisit ce role. */
export function ConditionsBeneficiaire({
  attestation,
  onAttestation,
  id,
}: {
  attestation: boolean;
  onAttestation: (v: boolean) => void;
  id: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-secondary p-4">
      <p className="flex items-start gap-3 text-base text-foreground">
        <IdCard aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
        <span>
          <span className="font-semibold">Pour être bénéficiaire</span>, il faut être étudiant inscrit et présenter sa
          carte étudiante à l&apos;accueil de chaque distribution.
        </span>
      </p>
      <label className="flex cursor-pointer items-start gap-3 text-base text-foreground">
        <Checkbox id={id} checked={attestation} onCheckedChange={(v) => onAttestation(v === true)} className="mt-0.5" />
        <span>Je suis étudiant inscrit et je présenterai ma carte étudiante.</span>
      </label>
    </div>
  );
}

/**
 * Choix de ce que l'on vient faire dans l'association : benevole, beneficiaire ou les deux.
 * Les roles de gestion ne se choisissent pas, un responsable les attribue.
 */
export function ChoixRoles({
  valeur,
  onChange,
  erreur,
}: {
  valeur: ChoixRolesValeur;
  onChange: (v: ChoixRolesValeur) => void;
  erreur?: string | null;
}) {
  function basculer(role: RoleLibre, coche: boolean) {
    const roles = coche ? [...valeur.roles, role] : valeur.roles.filter((r) => r !== role);
    onChange({ ...valeur, roles: ROLES_LIBRES.filter((r) => roles.includes(r)) });
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-base font-semibold text-foreground">Vous venez pour être</legend>
      <p className="-mt-1 text-sm text-muted-foreground">L&apos;un, l&apos;autre, ou les deux.</p>
      {ROLES_LIBRES.map((role) => {
        const { titre, detail, icone: Icone } = PRESENTATION[role];
        const coche = valeur.roles.includes(role);
        return (
          <label
            key={role}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-4",
              coche && "border-primary bg-secondary",
            )}
          >
            <Checkbox id={`role-${role}`} checked={coche} onCheckedChange={(v) => basculer(role, v === true)} className="mt-1" />
            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-alt text-on-brand-alt">
              <Icone className="size-5" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-base font-semibold text-foreground">{titre}</span>
              <span className="text-sm text-muted-foreground">{detail}</span>
            </span>
          </label>
        );
      })}
      {valeur.roles.includes("beneficiaire") && (
        <ConditionsBeneficiaire
          id="attestation-etudiant"
          attestation={valeur.attestationEtudiant}
          onAttestation={(v) => onChange({ ...valeur, attestationEtudiant: v })}
        />
      )}
      {erreur && <p className="text-sm font-semibold text-destructive">{erreur}</p>}
    </fieldset>
  );
}

/** Message a afficher si le choix ne peut pas etre envoye, ou null. */
export function erreurChoixRoles(valeur: ChoixRolesValeur): string | null {
  if (valeur.roles.length === 0) return "Choisissez d'être bénévole, bénéficiaire, ou les deux.";
  if (valeur.roles.includes("beneficiaire") && !valeur.attestationEtudiant) {
    return "Pour être bénéficiaire, confirmez être étudiant inscrit, avec votre carte étudiante.";
  }
  return null;
}
