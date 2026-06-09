"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  creerCatalogueDenree,
  modifierCatalogueDenree,
  supprimerCatalogueDenree,
} from "@/lib/api/distributions";
import type { CatalogueDenreeResponse } from "@/types/distribution";

interface Props {
  initialDenrees: CatalogueDenreeResponse[];
}

export function CatalogueGestionPanel({ initialDenrees }: Props) {
  const [denrees, setDenrees] = useState<CatalogueDenreeResponse[]>(initialDenrees);
  const [nouveauLibelle, setNouveauLibelle] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editLibelle, setEditLibelle] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleCreer(e: React.FormEvent) {
    e.preventDefault();
    if (!nouveauLibelle.trim()) return;
    setErreur(null);
    setPending(true);
    try {
      const creee = await creerCatalogueDenree(nouveauLibelle.trim());
      setDenrees((prev) => [...prev, creee].sort((a, b) => a.libelle.localeCompare(b.libelle)));
      setNouveauLibelle("");
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      setErreur(e.detail ?? e.message ?? "Erreur lors de la creation.");
    } finally {
      setPending(false);
    }
  }

  function ouvrirEdition(denree: CatalogueDenreeResponse) {
    setEditId(denree.id);
    setEditLibelle(denree.libelle);
    setErreur(null);
  }

  function annulerEdition() {
    setEditId(null);
    setEditLibelle("");
    setErreur(null);
  }

  async function handleModifier(id: string) {
    if (!editLibelle.trim()) return;
    setErreur(null);
    setPending(true);
    try {
      const modifiee = await modifierCatalogueDenree(id, editLibelle.trim());
      setDenrees((prev) =>
        prev
          .map((d) => (d.id === id ? modifiee : d))
          .sort((a, b) => a.libelle.localeCompare(b.libelle)),
      );
      setEditId(null);
      setEditLibelle("");
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      setErreur(e.detail ?? e.message ?? "Erreur lors de la modification.");
    } finally {
      setPending(false);
    }
  }

  async function handleSupprimer(id: string, libelle: string) {
    if (!window.confirm(`Supprimer "${libelle}" du catalogue ?`)) return;
    setErreur(null);
    setPending(true);
    try {
      await supprimerCatalogueDenree(id);
      setDenrees((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      setErreur(e.detail ?? e.message ?? "Erreur lors de la suppression.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Formulaire d'ajout */}
      <form onSubmit={handleCreer} className="flex gap-2">
        <Input
          value={nouveauLibelle}
          onChange={(e) => setNouveauLibelle(e.target.value)}
          placeholder="Nouvelle denree (ex : Pommes de terre)"
          className="flex-1"
          disabled={pending}
        />
        <Button type="submit" disabled={pending || !nouveauLibelle.trim()}>
          Ajouter
        </Button>
      </form>

      {erreur && (
        <p className="text-sm text-destructive">{erreur}</p>
      )}

      {/* Liste */}
      {denrees.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">Le catalogue est vide.</p>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary">{denrees.length}</Badge>
            <span className="text-sm text-muted-foreground">
              denree{denrees.length !== 1 ? "s" : ""}
            </span>
          </div>

          <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {denrees.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-3 bg-card">
                {editId === d.id ? (
                  <>
                    <Input
                      value={editLibelle}
                      onChange={(e) => setEditLibelle(e.target.value)}
                      className="flex-1 h-8 text-sm"
                      disabled={pending}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleModifier(d.id);
                        if (e.key === "Escape") annulerEdition();
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleModifier(d.id)}
                      disabled={pending || !editLibelle.trim()}
                      className="text-primary hover:text-primary"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={annulerEdition}
                      disabled={pending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-foreground">{d.libelle}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => ouvrirEdition(d)}
                      disabled={pending}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSupprimer(d.id, d.libelle)}
                      disabled={pending}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
