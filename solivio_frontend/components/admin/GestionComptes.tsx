"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, AlertTriangle, UserCheck, UserX, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { changerStatutCompte, changerSuperAdmin, supprimerCompteAdmin } from "@/lib/api/profil";
import { libelleRole } from "@/lib/roles";
import type { CompteAdminResponse, PageResponse } from "@/types/profil";

interface Props {
  page: PageResponse<CompteAdminResponse>;
  currentUserId: string;
  recherche: string;
  currentPage: number;
}

type DialogType = "actif" | "admin" | "supprimer" | null;

function getInitiales(prenom: string, nom: string): string {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
}

// --- Carte mobile ---

function CarteCompte({ compte, estSoi }: { compte: CompteAdminResponse; estSoi: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [dialogOuvert, setDialogOuvert] = useState<DialogType>(null);

  const initiales = getInitiales(compte.prenom, compte.nom);

  async function executer(fn: () => Promise<void>) {
    setDialogOuvert(null);
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

  return (
    <>
      <div
        className={[
          "rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-4 space-y-3 transition-opacity",
          !compte.actif ? "opacity-50" : "",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 border border-teal-100 text-primary text-[11px] font-semibold dark:bg-teal-950/30 dark:border-teal-800/40">
            {initiales}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {compte.prenom} {compte.nom}
              {estSoi && <span className="ml-1.5 text-xs text-muted-foreground font-normal">(vous)</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{compte.email}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Badge variant={compte.actif ? "default" : "destructive"} className="text-[11px]">
                {compte.actif ? "Actif" : "Inactif"}
              </Badge>
              {compte.superAdmin && (
                <Badge variant="secondary" className="text-[11px]">Super admin</Badge>
              )}
              {!compte.emailVerifie && (
                <Badge variant="outline" className="text-[11px] text-amber-600 border-amber-300">
                  Email non verifie
                </Badge>
              )}
            </div>
            {compte.role && (
              <p className="text-xs text-muted-foreground mt-1.5">
                {libelleRole(compte.role, compte.statutMembre)}
              </p>
            )}
          </div>
        </div>

        {erreur && <p className="text-xs text-destructive">{erreur}</p>}

        <div className="pt-3 border-t border-border/60 flex flex-wrap gap-1">
          {estSoi ? (
            <p className="text-xs text-muted-foreground">Votre compte : aucune action possible ici.</p>
          ) : pending ? (
            <Spinner size="sm" />
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDialogOuvert("actif")}
                className={compte.actif
                  ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                  : "text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/20"
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
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Supprimer
              </Button>
            </>
          )}
        </div>
      </div>

      <AlertDialog
        open={dialogOuvert === "actif"}
        onOpenChange={(open) => { if (!open) setDialogOuvert(null); }}
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
            <AlertDialogCancel onClick={() => setDialogOuvert(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant={compte.actif ? "outline" : "default"}
              onClick={() => executer(async () => { await changerStatutCompte(compte.id, !compte.actif); })}
            >
              {compte.actif ? "Desactiver" : "Reactiver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={dialogOuvert === "admin"}
        onOpenChange={(open) => { if (!open) setDialogOuvert(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className={compte.superAdmin ? "bg-amber-100 dark:bg-amber-950/30" : "bg-teal-50 dark:bg-teal-950/30"}>
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
                : `${compte.prenom} ${compte.nom} aura acces a l'administration globale de Solivio.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialogOuvert(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executer(async () => { await changerSuperAdmin(compte.id, !compte.superAdmin); })}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={dialogOuvert === "supprimer"}
        onOpenChange={(open) => { if (!open) setDialogOuvert(null); }}
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
            <AlertDialogCancel onClick={() => setDialogOuvert(null)}>Annuler</AlertDialogCancel>
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

// --- Ligne desktop ---

function LigneCompte({ compte, estSoi }: { compte: CompteAdminResponse; estSoi: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [dialogOuvert, setDialogOuvert] = useState<DialogType>(null);

  const initiales = getInitiales(compte.prenom, compte.nom);

  async function executer(fn: () => Promise<void>) {
    setDialogOuvert(null);
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

  return (
    <>
      <tr className={`border-b border-border/60 last:border-0 transition-opacity ${!compte.actif ? "opacity-50" : ""}`}>
        <td className="py-3.5 pr-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 border border-teal-100 text-primary text-[11px] font-semibold dark:bg-teal-950/30 dark:border-teal-800/40">
              {initiales}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{compte.prenom} {compte.nom}</p>
              <p className="text-xs text-muted-foreground truncate">{compte.email}</p>
            </div>
          </div>
          {erreur && <p className="text-xs text-destructive mt-1.5 ml-11">{erreur}</p>}
        </td>

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

        <td className="py-3.5 pr-4 text-xs text-muted-foreground max-w-[160px]">
          {compte.role
            ? libelleRole(compte.role, compte.statutMembre)
            : <span className="text-border">-</span>}
        </td>

        <td className="py-3.5">
          <div className="flex items-center gap-1">
            {estSoi ? (
              <span className="text-xs text-muted-foreground px-2">Votre compte</span>
            ) : pending ? (
              <Spinner size="sm" className="mx-2" />
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDialogOuvert("actif")}
                  className={compte.actif
                    ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    : "text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/20"
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

      <AlertDialog
        open={dialogOuvert === "actif"}
        onOpenChange={(open) => { if (!open) setDialogOuvert(null); }}
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
            <AlertDialogCancel onClick={() => setDialogOuvert(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant={compte.actif ? "outline" : "default"}
              onClick={() => executer(async () => { await changerStatutCompte(compte.id, !compte.actif); })}
            >
              {compte.actif ? "Desactiver" : "Reactiver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={dialogOuvert === "admin"}
        onOpenChange={(open) => { if (!open) setDialogOuvert(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className={compte.superAdmin ? "bg-amber-100 dark:bg-amber-950/30" : "bg-teal-50 dark:bg-teal-950/30"}>
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
                : `${compte.prenom} ${compte.nom} aura acces a l'administration globale de Solivio.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialogOuvert(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executer(async () => { await changerSuperAdmin(compte.id, !compte.superAdmin); })}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={dialogOuvert === "supprimer"}
        onOpenChange={(open) => { if (!open) setDialogOuvert(null); }}
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
            <AlertDialogCancel onClick={() => setDialogOuvert(null)}>Annuler</AlertDialogCancel>
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

// --- Composant principal ---

export function GestionComptes({ page, currentUserId, recherche: rechercheInitiale, currentPage }: Props) {
  const router = useRouter();
  const [recherche, setRecherche] = useState(rechercheInitiale);
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [filtreAdmin, setFiltreAdmin] = useState("tous");

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

  const filtres = useMemo(() => {
    return page.content.filter((c) => {
      if (filtreStatut === "actif" && !c.actif) return false;
      if (filtreStatut === "inactif" && c.actif) return false;
      if (filtreAdmin === "admin" && !c.superAdmin) return false;
      if (filtreAdmin === "non-admin" && c.superAdmin) return false;
      return true;
    });
  }, [page.content, filtreStatut, filtreAdmin]);

  return (
    <div className="space-y-4">
      {/* Carte toolbar */}
      <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Nom, prenom ou email..."
                className="pl-8"
              />
            </div>
            <Button type="submit" variant="outline">Rechercher</Button>
          </form>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-medium text-muted-foreground shrink-0">Statut</span>
              <Select value={filtreStatut} onValueChange={(v) => { if (v) setFiltreStatut(v); }}>
                <SelectTrigger className="flex-1 sm:w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-medium text-muted-foreground shrink-0">Type</span>
              <Select value={filtreAdmin} onValueChange={(v) => { if (v) setFiltreAdmin(v); }}>
                <SelectTrigger className="flex-1 sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="admin">Super admin</SelectItem>
                  <SelectItem value="non-admin">Non admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {filtres.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {filtres.length} compte{filtres.length !== 1 ? "s" : ""}
            {filtres.length !== page.content.length && ` sur ${page.content.length} sur cette page`}
          </p>
        )}
      </div>

      {filtres.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-neutral-50 dark:bg-neutral-900/50 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">Aucun compte trouve.</p>
        </div>
      ) : (
        <>
          {/* Vue mobile : cartes */}
          <div className="space-y-3 lg:hidden">
            {filtres.map((c) => (
              <CarteCompte key={c.id} compte={c} estSoi={c.id === currentUserId} />
            ))}
          </div>

          {/* Vue desktop : tableau */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-neutral-50/80 dark:bg-neutral-800/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Associations</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtres.map((c) => (
                  <LigneCompte key={c.id} compte={c} estSoi={c.id === currentUserId} />
                ))}
              </tbody>
            </table>
          </div>
        </>
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
