"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserX, UserCheck, UserMinus, AlertTriangle, Search } from "lucide-react";
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
import { mettreAJourRoleMembre, supprimerMembre, changerStatutMembre } from "@/lib/api/association";
import type { MembreResponse } from "@/types/association";

const ROLES = ["benevole", "coordinateur", "responsable", "super_admin"] as const;
type RoleValue = (typeof ROLES)[number];

function labelRole(role: string): string {
  switch (role) {
    case "super_admin": return "Super admin";
    case "responsable": return "Responsable";
    case "coordinateur": return "Coordinateur";
    default: return "Bénévole";
  }
}

function labelStatut(statut: string): string {
  if (statut === "actif") return "Actif";
  if (statut === "suspendu") return "Suspendu";
  if (statut === "invite_en_attente") return "En attente";
  return statut;
}

function variantStatut(statut: string): "default" | "secondary" | "destructive" {
  if (statut === "actif") return "default";
  if (statut === "suspendu") return "destructive";
  return "secondary";
}

function getInitiales(prenom: string, nom: string): string {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
}

type DialogType = "statut" | "retirer" | null;

// --- Carte mobile ---

function CarteMembre({
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
  const initiales = getInitiales(membre.prenom, membre.nom);

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
      setErreur(e.detail ?? e.message ?? "Erreur lors du changement de rôle.");
      setRole(membre.role);
    } finally {
      setPending(false);
    }
  }

  async function confirmerToggleStatut() {
    const nouveauStatut = estSuspendu ? "actif" : "suspendu";
    setDialogOuvert(null);
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
    setDialogOuvert(null);
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
    <>
      <div
        className={[
          "rounded-2xl border border-border/60 bg-card shadow-sm p-4 space-y-3 transition-opacity",
          estSuspendu ? "opacity-50" : "",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold">
            {initiales}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {membre.prenom} {membre.nom}
              {estSoi && (
                <span className="ml-1.5 text-xs text-muted-foreground font-normal">(vous)</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{membre.email}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Badge variant={variantStatut(statut)} className="text-[11px]">
                {labelStatut(statut)}
              </Badge>
              <Badge variant="secondary" className="text-[11px]">
                {labelRole(role)}
              </Badge>
            </div>
          </div>
        </div>

        {erreur && <p className="text-xs text-destructive">{erreur}</p>}

        {!estSoi && (
          <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
            <Select
              value={role as RoleValue}
              onValueChange={(v) => { if (v) changerRole(v); }}
              disabled={pending || estSuspendu}
            >
              <SelectTrigger size="sm" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{labelRole(r)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-1">
              {pending ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDialogOuvert("statut")}
                    className={estSuspendu
                      ? "text-primary hover:text-primary hover:bg-primary/10"
                      : "text-warning hover:text-warning hover:bg-warning/10"
                    }
                  >
                    {estSuspendu ? (
                      <><UserCheck className="h-3.5 w-3.5 mr-1" />Réactiver</>
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
          </div>
        )}
      </div>

      <AlertDialog
        open={dialogOuvert === "statut"}
        onOpenChange={(open) => { if (!open) setDialogOuvert(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className={estSuspendu ? "bg-primary/10" : "bg-warning/15"}>
              {estSuspendu ? <UserCheck className="text-primary" /> : <UserX className="text-warning" />}
            </AlertDialogMedia>
            <AlertDialogTitle>
              {estSuspendu ? "Réactiver le membre" : "Suspendre le membre"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {estSuspendu
                ? `${membre.prenom} ${membre.nom} pourra à nouveau participer aux activités de l'association.`
                : `${membre.prenom} ${membre.nom} ne pourra plus participer aux activités de l'association.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialogOuvert(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmerToggleStatut}>
              {estSuspendu ? "Réactiver" : "Suspendre"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={dialogOuvert === "retirer"}
        onOpenChange={(open) => { if (!open) setDialogOuvert(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <AlertTriangle className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Retirer le membre</AlertDialogTitle>
            <AlertDialogDescription>
              {membre.prenom} {membre.nom} sera retire définitivement de l&apos;association.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialogOuvert(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmerRetirer}>
              Retirer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// --- Ligne desktop ---

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
  const initiales = getInitiales(membre.prenom, membre.nom);

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
      setErreur(e.detail ?? e.message ?? "Erreur lors du changement de rôle.");
      setRole(membre.role);
    } finally {
      setPending(false);
    }
  }

  async function confirmerToggleStatut() {
    const nouveauStatut = estSuspendu ? "actif" : "suspendu";
    setDialogOuvert(null);
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
    setDialogOuvert(null);
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
    <>
      <tr className={`border-b border-border/60 last:border-0 transition-opacity ${estSuspendu ? "opacity-50" : ""}`}>
        <td className="py-3.5 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold">
              {initiales}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {membre.prenom} {membre.nom}
                {estSoi && <span className="ml-1.5 text-xs text-muted-foreground font-normal">(vous)</span>}
              </p>
              <p className="text-xs text-muted-foreground truncate">{membre.email}</p>
            </div>
          </div>
          {erreur && <p className="text-xs text-destructive mt-1.5 ml-11">{erreur}</p>}
        </td>

        <td className="py-3.5 px-4">
          <Badge variant={variantStatut(statut)}>{labelStatut(statut)}</Badge>
        </td>

        <td className="py-3.5 px-4">
          {estSoi ? (
            <span className="text-sm text-muted-foreground">{labelRole(role)}</span>
          ) : (
            <Select
              value={role as RoleValue}
              onValueChange={(v) => { if (v) changerRole(v); }}
              disabled={pending || estSuspendu}
            >
              <SelectTrigger size="sm" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{labelRole(r)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </td>

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
                      ? "text-primary hover:text-primary hover:bg-primary/10"
                      : "text-warning hover:text-warning hover:bg-warning/10"
                    }
                  >
                    {estSuspendu ? (
                      <><UserCheck className="h-3.5 w-3.5 mr-1" />Réactiver</>
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

      <AlertDialog
        open={dialogOuvert === "statut"}
        onOpenChange={(open) => { if (!open) setDialogOuvert(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className={estSuspendu ? "bg-primary/10" : "bg-warning/15"}>
              {estSuspendu ? <UserCheck className="text-primary" /> : <UserX className="text-warning" />}
            </AlertDialogMedia>
            <AlertDialogTitle>
              {estSuspendu ? "Réactiver le membre" : "Suspendre le membre"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {estSuspendu
                ? `${membre.prenom} ${membre.nom} pourra à nouveau participer aux activités de l'association.`
                : `${membre.prenom} ${membre.nom} ne pourra plus participer aux activités de l'association.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialogOuvert(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmerToggleStatut}>
              {estSuspendu ? "Réactiver" : "Suspendre"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={dialogOuvert === "retirer"}
        onOpenChange={(open) => { if (!open) setDialogOuvert(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <AlertTriangle className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Retirer le membre</AlertDialogTitle>
            <AlertDialogDescription>
              {membre.prenom} {membre.nom} sera retire définitivement de l&apos;association.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialogOuvert(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmerRetirer}>
              Retirer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// --- Composant principal ---

interface Props {
  membres: MembreResponse[];
  currentUserId: string;
}

export function GestionMembres({ membres, currentUserId }: Props) {
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [filtreRole, setFiltreRole] = useState("tous");

  const filtres = useMemo(() => {
    const q = recherche.toLowerCase().trim();
    return membres.filter((m) => {
      if (q && !`${m.prenom} ${m.nom} ${m.email}`.toLowerCase().includes(q)) return false;
      if (filtreStatut !== "tous" && m.statut !== filtreStatut) return false;
      if (filtreRole !== "tous" && m.role !== filtreRole) return false;
      return true;
    });
  }, [membres, recherche, filtreStatut, filtreRole]);

  return (
    <div className="space-y-4">
      {/* Carte toolbar */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="pl-8"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-medium text-muted-foreground shrink-0">Statut</span>
              <Select value={filtreStatut} onValueChange={(v) => { if (v) setFiltreStatut(v); }}>
                <SelectTrigger className="flex-1 sm:w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                  <SelectItem value="invite_en_attente">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-medium text-muted-foreground shrink-0">Rôle</span>
              <Select value={filtreRole} onValueChange={(v) => { if (v) setFiltreRole(v); }}>
                <SelectTrigger className="flex-1 sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="benevole">Bénévole</SelectItem>
                  <SelectItem value="coordinateur">Coordinateur</SelectItem>
                  <SelectItem value="responsable">Responsable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {filtres.length} membre{filtres.length !== 1 ? "s" : ""}
          {filtres.length !== membres.length && ` sur ${membres.length}`}
        </p>
      </div>

      {filtres.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/80 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {membres.length === 0 ? "Aucun membre dans cette association." : "Aucun membre ne correspond aux filtres."}
          </p>
        </div>
      ) : (
        <>
          {/* Vue mobile : cartes */}
          <div className="space-y-3 lg:hidden">
            {filtres.map((m) => (
              <CarteMembre key={m.compteId} membre={m} currentUserId={currentUserId} />
            ))}
          </div>

          {/* Vue desktop : tableau */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/80">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Membre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rôle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtres.map((m) => (
                  <LigneMembreRow key={m.compteId} membre={m} currentUserId={currentUserId} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
