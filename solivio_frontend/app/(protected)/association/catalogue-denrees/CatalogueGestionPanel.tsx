"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [suppressionCible, setSuppressionCible] = useState<{ id: string; libelle: string } | null>(null);
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

  function demanderSuppression(id: string, libelle: string) {
    setSuppressionCible({ id, libelle });
  }

  async function confirmerSuppression() {
    if (!suppressionCible) return;
    setErreur(null);
    setPending(true);
    try {
      await supprimerCatalogueDenree(suppressionCible.id);
      setDenrees((prev) => prev.filter((d) => d.id !== suppressionCible.id));
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      setErreur(e.detail ?? e.message ?? "Erreur lors de la suppression.");
    } finally {
      setPending(false);
      setSuppressionCible(null);
    }
  }

  return (
    <>
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
        <div className="rounded-2xl border border-border/60 bg-neutral-50 dark:bg-neutral-900 px-6 py-10 text-center">
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

          <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
            {denrees.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-colors">
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
                      onClick={() => demanderSuppression(d.id, d.libelle)}
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

      <AlertDialog
        open={suppressionCible !== null}
        onOpenChange={(open) => { if (!open) setSuppressionCible(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <AlertTriangle className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Supprimer la denree</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{suppressionCible?.libelle}&quot; sera supprimee du catalogue.
              Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSuppressionCible(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmerSuppression}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
