"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      setErreur(err.detail ?? err.message ?? "Impossible d'ajouter le role.");
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
      setErreur(err.detail ?? err.message ?? "Impossible de retirer le role.");
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
            className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-900/20 dark:border-teal-800 dark:text-teal-300"
          >
            {role.libelle}
            <button
              type="button"
              disabled={retirantId === role.id}
              onClick={() => handleRetirer(role.id)}
              className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-100 disabled:opacity-50"
              aria-label={`Retirer le role ${role.libelle}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
            aria-label="Ajouter un role"
          >
            <Plus className="size-3" />
            Ajouter un role
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
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 px-2.5"
            disabled={pending || !libelle.trim()}
            onClick={handleAjouter}
          >
            {pending ? "..." : "OK"}
          </Button>
          <button
            type="button"
            onClick={() => { setShowForm(false); setLibelle(""); setErreur(null); }}
            className="text-muted-foreground hover:text-foreground"
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
