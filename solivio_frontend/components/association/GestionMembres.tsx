"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserX, UserCheck, UserMinus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { mettreAJourRoleMembre, supprimerMembre, changerStatutMembre } from "@/lib/api/association";
import type { MembreResponse } from "@/types/association";

const ROLES = ["benevole", "coordinateur", "responsable", "super_admin"] as const;
type RoleValue = (typeof ROLES)[number];

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

type DialogType = "statut" | "retirer" | null;

function getInitiales(prenom: string, nom: string): string {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
}

function LigneMembreRow({
  membre,
  currentUserId,
}: {
  membre: MembreResponse;
  currentUserId: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState(membre.role);
  const [statut, setStatut] = useState(membre.statut);
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [dialogOuvert, setDialogOuvert] = useState<DialogType>(null);

  const estSoi = membre.compteId === currentUserId;
  const estSuspendu = statut === "suspendu";

  function fermerDialog() {
    setDialogOuvert(null);
  }

  async function changerRole(nouveauRole: string) {
    if (nouveauRole === role) return;
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

  async function confirmerToggleStatut() {
    const nouveauStatut = estSuspendu ? "actif" : "suspendu";
    fermerDialog();
    setPending(true);
    setErreur(null);
    try {
      await changerStatutMembre(membre.compteId, nouveauStatut);
      setStatut(nouveauStatut);
      router.refresh();
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      setErreur(e.detail ?? e.message ?? "Erreur lors du changement de statut.");
    } finally {
      setPending(false);
    }
  }

  async function confirmerRetirer() {
    fermerDialog();
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

  const initiales = getInitiales(membre.prenom, membre.nom);

  return (
    <>
      <tr
        className={`border-b border-border last:border-0 transition-opacity ${estSuspendu ? "opacity-50" : ""}`}
      >
        {/* Membre */}
        <td className="py-3.5 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
              {initiales}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {membre.prenom} {membre.nom}
              </p>
              <p className="text-xs text-muted-foreground truncate">{membre.email}</p>
            </div>
          </div>
          {erreur && <p className="text-xs text-destructive mt-1.5 ml-11">{erreur}</p>}
        </td>

        {/* Statut */}
        <td className="py-3.5 px-4">
          <Badge variant={variantStatut(statut)}>
            {statut === "actif" ? "Actif" : statut === "suspendu" ? "Suspendu" : statut}
          </Badge>
        </td>

        {/* Role */}
        <td className="py-3.5 px-4">
          {estSoi ? (
            <span className="text-sm text-muted-foreground">{labelRole(role)}</span>
          ) : (
            <Select
              value={role as RoleValue}
              onValueChange={changerRole}
              disabled={pending || estSuspendu}
            >
              <SelectTrigger size="sm" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {labelRole(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </td>

        {/* Actions */}
        <td className="py-3.5 px-4">
          {!estSoi && (
            <div className="flex items-center gap-1">
              {pending ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDialogOuvert("statut")}
                    className={estSuspendu
                      ? "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                      : "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    }
                  >
                    {estSuspendu ? (
                      <><UserCheck className="h-3.5 w-3.5 mr-1" />Reactiver</>
                    ) : (
                      <><UserX className="h-3.5 w-3.5 mr-1" />Suspendre</>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDialogOuvert("retirer")}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <UserMinus className="h-3.5 w-3.5 mr-1" />
                    Retirer
                  </Button>
                </>
              )}
            </div>
          )}
        </td>
      </tr>

      {/* Dialog de confirmation - suspension/reactivation */}
      <AlertDialog
        open={dialogOuvert === "statut"}
        onOpenChange={(open) => { if (!open) fermerDialog(); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className={estSuspendu ? "bg-primary/10" : "bg-amber-100 dark:bg-amber-950/30"}>
              {estSuspendu
                ? <UserCheck className="text-primary" />
                : <UserX className="text-amber-600" />}
            </AlertDialogMedia>
            <AlertDialogTitle>
              {estSuspendu ? "Reactiver le membre" : "Suspendre le membre"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {estSuspendu
                ? `${membre.prenom} ${membre.nom} pourra a nouveau participer aux activites de l'association.`
                : `${membre.prenom} ${membre.nom} ne pourra plus participer aux activites de l'association.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={fermerDialog}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmerToggleStatut}>
              {estSuspendu ? "Reactiver" : "Suspendre"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation - retrait */}
      <AlertDialog
        open={dialogOuvert === "retirer"}
        onOpenChange={(open) => { if (!open) fermerDialog(); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <AlertTriangle className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Retirer le membre</AlertDialogTitle>
            <AlertDialogDescription>
              {membre.prenom} {membre.nom} sera retire definitivement de l&apos;association.
              Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={fermerDialog}>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmerRetirer}>
              Retirer definitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface Props {
  membres: MembreResponse[];
  currentUserId: string;
}

export function GestionMembres({ membres, currentUserId }: Props) {
  if (membres.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">Aucun membre dans cette association.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Membre</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
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
