"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, AlertTriangle, UserCheck, UserX, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
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
import { changerStatutCompte, changerSuperAdmin, supprimerCompteAdmin } from "@/lib/api/profil";
import type { CompteAdminResponse, PageResponse } from "@/types/profil";

interface Props {
  page: PageResponse<CompteAdminResponse>;
  recherche: string;
  currentPage: number;
}

type DialogType = "actif" | "admin" | "supprimer" | null;

function getInitiales(prenom: string, nom: string): string {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
}

function LigneCompte({ compte }: { compte: CompteAdminResponse }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [dialogOuvert, setDialogOuvert] = useState<DialogType>(null);

  function fermerDialog() {
    setDialogOuvert(null);
  }

  async function executer(fn: () => Promise<void>) {
    fermerDialog();
    setPending(true);
    setErreur(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      setErreur(e.detail ?? e.message ?? "Erreur.");
    } finally {
      setPending(false);
    }
  }

  const initiales = getInitiales(compte.prenom, compte.nom);

  return (
    <>
      <tr
        className={`border-b border-border last:border-0 transition-opacity ${!compte.actif ? "opacity-50" : ""}`}
      >
        {/* Utilisateur */}
        <td className="py-3.5 pr-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
              {initiales}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {compte.prenom} {compte.nom}
              </p>
              <p className="text-xs text-muted-foreground truncate">{compte.email}</p>
            </div>
          </div>
          {erreur && <p className="text-xs text-destructive mt-1.5 ml-11">{erreur}</p>}
        </td>

        {/* Statut */}
        <td className="py-3.5 pr-4">
          <div className="flex flex-wrap gap-1">
            <Badge variant={compte.actif ? "default" : "destructive"}>
              {compte.actif ? "Actif" : "Inactif"}
            </Badge>
            {compte.superAdmin && <Badge variant="secondary">Super admin</Badge>}
            {!compte.emailVerifie && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Email non verifie
              </Badge>
            )}
          </div>
        </td>

        {/* Associations */}
        <td className="py-3.5 pr-4 text-xs text-muted-foreground max-w-[160px]">
          {compte.affiliations.length > 0
            ? compte.affiliations.map((a) => a.associationNom).join(", ")
            : <span className="text-border">-</span>}
        </td>

        {/* Actions */}
        <td className="py-3.5">
          <div className="flex items-center gap-1">
            {pending ? (
              <Spinner size="sm" className="mx-2" />
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDialogOuvert("actif")}
                  disabled={pending}
                  className={compte.actif
                    ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                  }
                >
                  {compte.actif ? (
                    <><UserX className="h-3.5 w-3.5 mr-1" />Desactiver</>
                  ) : (
                    <><UserCheck className="h-3.5 w-3.5 mr-1" />Reactiver</>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDialogOuvert("admin")}
                  disabled={pending}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {compte.superAdmin ? (
                    <><ShieldOff className="h-3.5 w-3.5 mr-1" />Retirer admin</>
                  ) : (
                    <><ShieldCheck className="h-3.5 w-3.5 mr-1" />Super admin</>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDialogOuvert("supprimer")}
                  disabled={pending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Supprimer
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>

      {/* Dialog de confirmation - activation/desactivation */}
      <AlertDialog
        open={dialogOuvert === "actif"}
        onOpenChange={(open) => { if (!open) fermerDialog(); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-amber-100 dark:bg-amber-950/30">
              <AlertTriangle className="text-amber-600" />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {compte.actif ? "Desactiver le compte" : "Reactiver le compte"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {compte.actif
                ? `Le compte de ${compte.prenom} ${compte.nom} sera desactive. L'utilisateur ne pourra plus se connecter.`
                : `Le compte de ${compte.prenom} ${compte.nom} sera reactive. L'utilisateur pourra a nouveau se connecter.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={fermerDialog}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant={compte.actif ? "outline" : "default"}
              onClick={() => executer(async () => { await changerStatutCompte(compte.id, !compte.actif); })}
            >
              {compte.actif ? "Desactiver" : "Reactiver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation - droits super admin */}
      <AlertDialog
        open={dialogOuvert === "admin"}
        onOpenChange={(open) => { if (!open) fermerDialog(); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className={compte.superAdmin ? "bg-amber-100 dark:bg-amber-950/30" : "bg-primary/10"}>
              {compte.superAdmin
                ? <ShieldOff className="text-amber-600" />
                : <ShieldCheck className="text-primary" />}
            </AlertDialogMedia>
            <AlertDialogTitle>
              {compte.superAdmin ? "Retirer les droits super admin" : "Accorder les droits super admin"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {compte.superAdmin
                ? `${compte.prenom} ${compte.nom} perdra l'acces a l'administration globale de la plateforme.`
                : `${compte.prenom} ${compte.nom} aura acces a l'administration globale de toutes les associations.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={fermerDialog}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executer(async () => { await changerSuperAdmin(compte.id, !compte.superAdmin); })}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation - suppression */}
      <AlertDialog
        open={dialogOuvert === "supprimer"}
        onOpenChange={(open) => { if (!open) fermerDialog(); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <AlertTriangle className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Supprimer le compte</AlertDialogTitle>
            <AlertDialogDescription>
              Le compte de {compte.prenom} {compte.nom} ({compte.email}) sera supprime
              definitivement. Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={fermerDialog}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => executer(() => supprimerCompteAdmin(compte.id))}
            >
              Supprimer definitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function GestionComptes({ page, recherche: rechercheInitiale, currentPage }: Props) {
  const router = useRouter();
  const [recherche, setRecherche] = useState(rechercheInitiale);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (recherche) params.set("q", recherche);
    params.set("page", "0");
    router.push(`/admin/utilisateurs?${params}`);
  }

  function naviguerPage(p: number) {
    const params = new URLSearchParams();
    if (rechercheInitiale) params.set("q", rechercheInitiale);
    params.set("page", String(p));
    router.push(`/admin/utilisateurs?${params}`);
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Nom, prenom ou email..."
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="outline">
          Rechercher
        </Button>
      </form>

      {/* Tableau */}
      {page.content.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">Aucun compte trouve.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Utilisateur</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Associations</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {page.content.map((c) => (
                <LigneCompte key={c.id} compte={c} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {page.totalPages > 1 && (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => naviguerPage(currentPage - 1)}
            disabled={currentPage === 0}
          >
            Precedent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} / {page.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => naviguerPage(currentPage + 1)}
            disabled={currentPage >= page.totalPages - 1}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
