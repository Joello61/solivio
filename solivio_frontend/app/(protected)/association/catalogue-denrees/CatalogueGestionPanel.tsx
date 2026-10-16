"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/ui/search-field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
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

// En dessous, la liste se parcourt d'un coup d'oeil.
const SEUIL_RECHERCHE = 12;
const normaliser = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr");

export function CatalogueGestionPanel({ initialDenrees }: Props) {
  const [denrees, setDenrees] = useState<CatalogueDenreeResponse[]>(initialDenrees);
  const [nouveauLibelle, setNouveauLibelle] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editLibelle, setEditLibelle] = useState("");
  const [suppressionCible, setSuppressionCible] = useState<{ id: string; libelle: string } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [recherche, setRecherche] = useState("");

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
      setErreur(e.detail ?? e.message ?? "Erreur lors de la création.");
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

  const terme = normaliser(recherche.trim());
  const visibles = denrees.filter((d) => !terme || normaliser(d.libelle).includes(terme));

  return (
    <>
      <div className="flex flex-col gap-4">
        <form onSubmit={handleCreer} className="flex gap-2">
          <Input
            aria-label="Nouvelle denrée"
            value={nouveauLibelle}
            onChange={(e) => setNouveauLibelle(e.target.value)}
            placeholder="Nouvelle denrée, par exemple Pâtes"
            className="flex-1"
            disabled={pending}
          />
          <Button type="submit" disabled={pending || !nouveauLibelle.trim()}>
            <Plus aria-hidden="true" />
            Ajouter
          </Button>
        </form>

        {erreur && <Alert variant="destructive">{erreur}</Alert>}

        {denrees.length === 0 ? (
          <EmptyState size="sm" title="Le catalogue est vide" description="Les denrées ajoutées ici sont proposées à la saisie de la répartition." />
        ) : (
          <>
            {denrees.length > SEUIL_RECHERCHE && (
              <SearchField label="Chercher une denrée" placeholder="Nom de la denrée" value={recherche} onValueChange={setRecherche} />
            )}
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {visibles.map((d) => (
                <li key={d.id} className="flex min-h-14 items-center gap-2 px-4 py-2">
                  {editId === d.id ? (
                    <>
                      <Input
                        aria-label={`Nouveau nom pour ${d.libelle}`}
                        value={editLibelle}
                        onChange={(e) => setEditLibelle(e.target.value)}
                        className="flex-1"
                        disabled={pending}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleModifier(d.id);
                          if (e.key === "Escape") annulerEdition();
                        }}
                      />
                      <Button variant="ghost" size="icon" aria-label="Valider" onClick={() => handleModifier(d.id)} disabled={pending || !editLibelle.trim()}>
                        <Check aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Annuler" onClick={annulerEdition} disabled={pending}>
                        <X aria-hidden="true" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-base text-foreground">{d.libelle}</span>
                      <ActionMenu
                        label={`Plus d'actions sur ${d.libelle}`}
                        className="border-transparent bg-transparent text-muted-foreground"
                        items={[
                          { label: "Renommer", icon: Pencil, onClick: () => ouvrirEdition(d) },
                          { label: "Supprimer", icon: Trash2, destructive: true, onClick: () => demanderSuppression(d.id, d.libelle) },
                        ]}
                      />
                    </>
                  )}
                </li>
              ))}
            </ul>
            {terme && visibles.length === 0 && <p className="text-base text-muted-foreground">Aucune denrée ne correspond.</p>}
          </>
        )}
      </div>

      <AlertDialog
        open={suppressionCible !== null}
        onOpenChange={(open) => { if (!open) setSuppressionCible(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {suppressionCible?.libelle}</AlertDialogTitle>
            <AlertDialogDescription>La denrée sort du catalogue. Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSuppressionCible(null)}>Garder</AlertDialogCancel>
            <AlertDialogAction variant="destructive-solid" onClick={confirmerSuppression}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
