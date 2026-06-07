"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mettreAJourRoleMembre, supprimerMembre } from "@/lib/api/association";
import type { MembreResponse } from "@/types/association";

const ROLES = ["benevole", "coordinateur", "responsable", "super_admin"] as const;

function labelRole(role: string): string {
  switch (role) {
    case "super_admin":
      return "Super admin";
    case "responsable":
      return "Responsable";
    case "coordinateur":
      return "Coordinateur";
    default:
      return "Benevole";
  }
}

function variantStatut(statut: string): "default" | "secondary" | "destructive" {
  if (statut === "actif") return "default";
  if (statut === "suspendu") return "destructive";
  return "secondary";
}

interface LigneMembre {
  membre: MembreResponse;
  currentUserId: string;
}

function LigneMembreRow({ membre, currentUserId }: LigneMembre) {
  const router = useRouter();
  const [role, setRole] = useState(membre.role);
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const estSoi = membre.compteId === currentUserId;

  async function changerRole(nouveauRole: string) {
    setRole(nouveauRole);
    setPending(true);
    setErreur(null);
    try {
      await mettreAJourRoleMembre(membre.compteId, { role: nouveauRole });
      router.refresh();
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      setErreur(e.detail ?? e.message ?? "Erreur lors du changement de role.");
      setRole(membre.role);
    } finally {
      setPending(false);
    }
  }

  async function retirer() {
    if (!confirm(`Retirer ${membre.prenom} ${membre.nom} de l'association ?`)) return;
    setPending(true);
    setErreur(null);
    try {
      await supprimerMembre(membre.compteId);
      router.refresh();
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      setErreur(e.detail ?? e.message ?? "Erreur lors de la suppression.");
      setPending(false);
    }
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4">
        <div className="font-medium text-sm">
          {membre.prenom} {membre.nom}
        </div>
        <div className="text-xs text-muted-foreground">{membre.email}</div>
        {erreur && <div className="text-xs text-destructive mt-1">{erreur}</div>}
      </td>
      <td className="py-3 pr-4">
        <Badge variant={variantStatut(membre.statut)}>
          {membre.statut}
        </Badge>
      </td>
      <td className="py-3 pr-4">
        {estSoi ? (
          <span className="text-sm text-muted-foreground">{labelRole(role)}</span>
        ) : (
          <select
            value={role}
            onChange={(e) => changerRole(e.target.value)}
            disabled={pending}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {labelRole(r)}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className="py-3">
        {!estSoi && (
          <Button
            variant="ghost"
            size="sm"
            onClick={retirer}
            disabled={pending}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Retirer
          </Button>
        )}
      </td>
    </tr>
  );
}

interface Props {
  membres: MembreResponse[];
  currentUserId: string;
}

export function GestionMembres({ membres, currentUserId }: Props) {
  if (membres.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">Aucun membre dans cette association.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="text-left pb-2 pr-4 font-medium">Membre</th>
            <th className="text-left pb-2 pr-4 font-medium">Statut</th>
            <th className="text-left pb-2 pr-4 font-medium">Role</th>
            <th className="text-left pb-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {membres.map((m) => (
            <LigneMembreRow key={m.compteId} membre={m} currentUserId={currentUserId} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
