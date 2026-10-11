"use client";

import { useState } from "react";
import { Archive, Check, CornerDownRight, Pencil, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  archiverTypeRole,
  creerTypeRole,
  listerTypesRoles,
  modifierTypeRole,
} from "@/lib/api/distributions";
import type { TypeRoleResponse } from "@/types/distribution";

interface Props {
  initialTypes: TypeRoleResponse[];
  // L'archivage est reserve au responsable (backend) ; le coordinateur cree et renomme.
  peutArchiver: boolean;
}

type Saisie = { mode: "renommer" | "sous-type"; id: string; valeur: string } | null;

function messageErreur(err: unknown, defaut: string): string {
  const e = err as { detail?: string; message?: string };
  return e.detail ?? e.message ?? defaut;
}

/** Catalogue des roles benevoles (deux niveaux : role et sous-role). */
export function GestionTypesRoles({ initialTypes, peutArchiver }: Props) {
  const [types, setTypes] = useState(initialTypes);
  const [nouveau, setNouveau] = useState("");
  const [saisie, setSaisie] = useState<Saisie>(null);
  const [aArchiver, setAArchiver] = useState<TypeRoleResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Une creation ou un archivage touche l'arbre entier : on relit la liste triee du backend.
  async function executer(action: () => Promise<unknown>, defaut: string): Promise<boolean> {
    setPending(true);
    setErreur(null);
    try {
      await action();
      setTypes(await listerTypesRoles());
      return true;
    } catch (err) {
      setErreur(messageErreur(err, defaut));
      return false;
    } finally {
      setPending(false);
    }
  }

  async function creerRacine(e: React.FormEvent) {
    e.preventDefault();
    const libelle = nouveau.trim();
    if (!libelle) return;
    if (await executer(() => creerTypeRole(libelle), "Le rôle n'a pas pu être créé.")) setNouveau("");
  }

  async function validerSaisie() {
    if (!saisie || !saisie.valeur.trim()) return;
    const { mode, id, valeur } = saisie;
    const ok = await executer(
      () => (mode === "renommer" ? modifierTypeRole(id, valeur.trim()) : creerTypeRole(valeur.trim(), id)),
      mode === "renommer" ? "Le rôle n'a pas pu être renommé." : "Le sous-rôle n'a pas pu être créé.",
    );
    if (ok) setSaisie(null);
  }

  async function confirmerArchivage() {
    if (!aArchiver) return;
    await executer(() => archiverTypeRole(aArchiver.id), "Le rôle n'a pas pu être archivé.");
    setAArchiver(null);
  }

  function champSaisie(placeholder: string) {
    return (
      <div className="flex flex-1 items-center gap-1">
        <Input
          aria-label={placeholder}
          value={saisie?.valeur ?? ""}
          placeholder={placeholder}
          onChange={(e) => setSaisie((s) => (s ? { ...s, valeur: e.target.value } : s))}
          onKeyDown={(e) => {
            if (e.key === "Enter") validerSaisie();
            if (e.key === "Escape") setSaisie(null);
          }}
          disabled={pending}
          autoFocus
          className="h-9 flex-1"
        />
        <Button variant="ghost" size="icon" aria-label="Valider" onClick={validerSaisie} disabled={pending || !saisie?.valeur.trim()}>
          <Check className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Annuler" onClick={() => setSaisie(null)} disabled={pending}>
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  function ligne(type: TypeRoleResponse, sousRole: boolean) {
    const enRenommage = saisie?.mode === "renommer" && saisie.id === type.id;
    return (
      <div className={`flex min-h-12 items-center gap-2 px-4 py-2 ${sousRole ? "pl-10" : ""}`}>
        {sousRole && <CornerDownRight className="size-4 shrink-0 text-muted-foreground" />}
        {enRenommage ? (
          champSaisie("Nouveau libellé")
        ) : (
          <>
            <span className={`flex-1 text-sm ${type.actif ? "text-foreground" : "text-muted-foreground line-through"}`}>
              {type.libelle}
            </span>
            {!type.actif && <Badge variant="secondary">Archivé</Badge>}
            {type.actif && (
              <div className="flex shrink-0 items-center">
                {!sousRole && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Ajouter un sous-rôle à ${type.libelle}`}
                    onClick={() => setSaisie({ mode: "sous-type", id: type.id, valeur: "" })}
                    disabled={pending}
                  >
                    <Plus className="size-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Renommer ${type.libelle}`}
                  onClick={() => setSaisie({ mode: "renommer", id: type.id, valeur: type.libelle })}
                  disabled={pending}
                >
                  <Pencil className="size-4" />
                </Button>
                {peutArchiver && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Archiver ${type.libelle}`}
                    onClick={() => setAArchiver(type)}
                    disabled={pending}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Archive className="size-4" />
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={creerRacine} className="flex gap-2">
        <Input
          aria-label="Nouveau rôle"
          value={nouveau}
          onChange={(e) => setNouveau(e.target.value)}
          placeholder="Nouveau rôle (ex : Accueil)"
          disabled={pending}
          className="flex-1"
        />
        <Button type="submit" disabled={pending || !nouveau.trim()}>
          Ajouter
        </Button>
      </form>

      {erreur && (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/8 px-3 py-2 text-sm text-destructive">
          {erreur}
        </p>
      )}

      {types.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-muted px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">Aucun rôle pour le moment.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
          {types.map((t) => (
            <li key={t.id}>
              {ligne(t, false)}
              {t.sousTypes.map((s) => (
                <div key={s.id} className="border-t border-border/40">
                  {ligne(s, true)}
                </div>
              ))}
              {saisie?.mode === "sous-type" && saisie.id === t.id && (
                <div className="flex items-center gap-2 border-t border-border/40 px-4 py-2 pl-10">
                  <CornerDownRight className="size-4 shrink-0 text-muted-foreground" />
                  {champSaisie(`Sous-rôle de ${t.libelle}`)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={aArchiver !== null} onOpenChange={(open) => { if (!open) setAArchiver(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{`Archiver "${aArchiver?.libelle ?? ""}" ?`}</AlertDialogTitle>
            <AlertDialogDescription>
              Le rôle ne pourra plus être attribué. Les attributions passées restent dans l&apos;historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction onClick={confirmerArchivage} disabled={pending}>
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
