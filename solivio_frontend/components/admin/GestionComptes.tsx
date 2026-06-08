"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { changerStatutCompte, changerSuperAdmin, supprimerCompteAdmin } from "@/lib/api/profil";
import type { CompteAdminResponse, PageResponse } from "@/types/profil";

interface Props {
  page: PageResponse<CompteAdminResponse>;
  recherche: string;
  currentPage: number;
}

function variantStatut(actif: boolean): "default" | "destructive" {
  return actif ? "default" : "destructive";
}

function LigneCompte({ compte }: { compte: CompteAdminResponse }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function toggleActif() {
    const action = compte.actif ? "Desactiver" : "Reactiver";
    if (!confirm(`${action} le compte de ${compte.prenom} ${compte.nom} ?`)) return;
    setPending(true);
    setErreur(null);
    try {
      await changerStatutCompte(compte.id, !compte.actif);
      router.refresh();
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      setErreur(e.detail ?? e.message ?? "Erreur.");
    } finally {
      setPending(false);
    }
  }

  async function toggleSuperAdmin() {
    const action = compte.superAdmin ? "Retirer le droit super admin a" : "Donner le droit super admin a";
    if (!confirm(`${action} ${compte.prenom} ${compte.nom} ?`)) return;
    setPending(true);
    setErreur(null);
    try {
      await changerSuperAdmin(compte.id, !compte.superAdmin);
      router.refresh();
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      setErreur(e.detail ?? e.message ?? "Erreur.");
    } finally {
      setPending(false);
    }
  }

  async function supprimer() {
    if (
      !confirm(
        `Supprimer definitivement le compte de ${compte.prenom} ${compte.nom} ? Cette action est irreversible.`
      )
    )
      return;
    setPending(true);
    setErreur(null);
    try {
      await supprimerCompteAdmin(compte.id);
      router.refresh();
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      setErreur(e.detail ?? e.message ?? "Erreur.");
      setPending(false);
    }
  }

  return (
    <tr className={`border-b border-border last:border-0 ${!compte.actif ? "opacity-60" : ""}`}>
      <td className="py-3 pr-4">
        <div className="font-medium text-sm">
          {compte.prenom} {compte.nom}
        </div>
        <div className="text-xs text-muted-foreground">{compte.email}</div>
        {erreur && <div className="text-xs text-destructive mt-1">{erreur}</div>}
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-1">
          <Badge variant={variantStatut(compte.actif)}>
            {compte.actif ? "Actif" : "Inactif"}
          </Badge>
          {compte.superAdmin && (
            <Badge variant="secondary">Super admin</Badge>
          )}
          {!compte.emailVerifie && (
            <Badge variant="secondary">Email non verifie</Badge>
          )}
        </div>
      </td>
      <td className="py-3 pr-4 text-xs text-muted-foreground">
        {compte.affiliations.length > 0
          ? compte.affiliations.map((a) => a.associationNom).join(", ")
          : "-"}
      </td>
      <td className="py-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleActif}
            disabled={pending}
            className={
              compte.actif
                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                : "text-green-600 hover:text-green-700 hover:bg-green-50"
            }
          >
            {compte.actif ? "Desactiver" : "Reactiver"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSuperAdmin}
            disabled={pending}
            className="text-muted-foreground hover:text-foreground"
          >
            {compte.superAdmin ? "Retirer admin" : "Super admin"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={supprimer}
            disabled={pending}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Supprimer
          </Button>
        </div>
      </td>
    </tr>
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
      {/* Recherche */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
        <p className="text-muted-foreground text-sm py-4">Aucun compte trouve.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left pb-2 pr-4 font-medium">Utilisateur</th>
                <th className="text-left pb-2 pr-4 font-medium">Statut</th>
                <th className="text-left pb-2 pr-4 font-medium">Associations</th>
                <th className="text-left pb-2 font-medium">Actions</th>
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
        <div className="flex items-center gap-2">
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
