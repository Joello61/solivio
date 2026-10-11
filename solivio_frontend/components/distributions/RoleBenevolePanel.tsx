"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { assignerRole, retirerRole } from "@/lib/api/distributions";
import type { RoleBenevoleResponse } from "@/types/distribution";

interface Props {
  distributionId: string;
  inscriptionId: string;
  rolesInitiaux: RoleBenevoleResponse[];
}

export function RoleBenevolePanel({ distributionId, inscriptionId, rolesInitiaux }: Props) {
  const [roles, setRoles] = useState<RoleBenevoleResponse[]>(rolesInitiaux);
  const [showForm, setShowForm] = useState(false);
  const [libelle, setLibelle] = useState("");
  const [pending, setPending] = useState(false);
  const [retirantId, setRetirantId] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleAjouter() {
    const libelleNormalise = libelle.trim();
    if (!libelleNormalise) return;
    setPending(true);
    setErreur(null);
    try {
      const role = await assignerRole(distributionId, inscriptionId, {
        libelleLibre: libelleNormalise,
      });
      setRoles((prev) => [...prev, role]);
      setLibelle("");
      setShowForm(false);
    } catch (e: unknown) {
      const err = e as { detail?: string; message?: string };
      setErreur(err.detail ?? err.message ?? "Impossible d'ajouter le rôle.");
    } finally {
      setPending(false);
    }
  }

  async function handleRetirer(roleId: string) {
    setRetirantId(roleId);
    setErreur(null);
    try {
      await retirerRole(distributionId, inscriptionId, roleId);
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
    } catch (e: unknown) {
      const err = e as { detail?: string; message?: string };
      setErreur(err.detail ?? err.message ?? "Impossible de retirer le rôle.");
    } finally {
      setRetirantId(null);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5 items-center">
        {roles.map((role) => (
          <span
            key={role.id}
            className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 dark:bg-teal-950/30 dark:border-teal-800/40 px-2.5 py-0.5 text-xs font-medium text-primary"
          >
            {role.libelle}
            <button
              type="button"
              disabled={retirantId === role.id}
              onClick={() => handleRetirer(role.id)}
              className="text-primary/60 hover:text-primary disabled:opacity-40 transition-colors"
              aria-label={`Retirer le rôle ${role.libelle}`}
            >
              {retirantId === role.id ? (
                <Spinner size="sm" className="h-2.5 w-2.5" />
              ) : (
                <X className="size-3" />
              )}
            </button>
          </span>
        ))}
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary/80 transition-colors"
            aria-label="Ajouter un rôle"
          >
            <Plus className="size-3" />
            Ajouter un rôle
          </button>
        )}
      </div>

      {showForm && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={libelle}
            onChange={(e) => setLibelle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAjouter();
              if (e.key === "Escape") { setShowForm(false); setLibelle(""); }
            }}
            placeholder="Ex : distribution des carottes"
            autoFocus
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 px-2.5"
            disabled={pending || !libelle.trim()}
            onClick={handleAjouter}
          >
            {pending ? <Spinner size="sm" /> : "OK"}
          </Button>
          <button
            type="button"
            onClick={() => { setShowForm(false); setLibelle(""); setErreur(null); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Annuler"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {erreur && <p className="text-xs text-destructive">{erreur}</p>}
    </div>
  );
}
