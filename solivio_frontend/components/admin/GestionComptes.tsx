"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Initiales } from "@/components/ui/initiales";
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
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Statut } from "@/components/ui/statut";
import { DialogEffacementCompte } from "@/components/admin/DialogEffacementCompte";
import { changerStatutCompte, changerSuperAdmin, effacerDonneesCompteAdmin, supprimerCompteAdmin } from "@/lib/api/profil";
import { messageErreur } from "@/lib/erreurs";
import { libelleRole } from "@/lib/roles";
import type { CompteAdminResponse, PageResponse } from "@/types/profil";

interface Props {
  page: PageResponse<CompteAdminResponse>;
  currentUserId: string;
  recherche: string;
  currentPage: number;
}

type Filtre = "tous" | "desactives" | "admins";
type Confirmation = "actif" | "admin" | "supprimer" | "effacer" | null;

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const nomComplet = (c: CompteAdminResponse) => `${c.prenom} ${c.nom}`;

const CONFIRMATIONS: Record<Exclude<Confirmation, "effacer" | null>, (c: CompteAdminResponse) => { titre: string; texte: string; action: string; destructive?: boolean }> = {
  actif: (c) =>
    c.actif
      ? { titre: "Désactiver le compte", texte: `${nomComplet(c)} ne pourra plus se connecter.`, action: "Désactiver" }
      : { titre: "Réactiver le compte", texte: `${nomComplet(c)} pourra de nouveau se connecter.`, action: "Réactiver" },
  admin: (c) =>
    c.superAdmin
      ? { titre: "Retirer les droits super admin", texte: `${nomComplet(c)} perdra l'accès à l'administration de Solivio.`, action: "Retirer" }
      : { titre: "Accorder les droits super admin", texte: `${nomComplet(c)} aura accès à l'administration de Solivio.`, action: "Accorder" },
  supprimer: (c) => ({
    titre: "Supprimer le compte",
    texte: `Le compte de ${nomComplet(c)} (${c.email}) sera supprimé définitivement. Cette action est irréversible.`,
    action: "Supprimer définitivement",
    destructive: true,
  }),
};

/* Les actions sur un compte, dans une fiche : rien de destructeur dans la liste. */
function FicheCompte({ compte, estSoi, onFermer }: { compte: CompteAdminResponse; estSoi: boolean; onFermer: () => void }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function executer(appel: () => Promise<unknown>, succes: string, fermer = false) {
    setConfirmation(null);
    setEnCours(true);
    setErreur(null);
    try {
      await appel();
      toast.success(succes);
      router.refresh();
      if (fermer) onFermer();
    } catch (e) {
      setErreur(messageErreur(e, "L'action n'a pas abouti. Réessayez dans un instant."));
    } finally {
      setEnCours(false);
    }
  }

  const appels: Record<Exclude<Confirmation, "effacer" | null>, () => void> = {
    actif: () => executer(() => changerStatutCompte(compte.id, !compte.actif), compte.actif ? "Compte désactivé." : "Compte réactivé."),
    admin: () => executer(() => changerSuperAdmin(compte.id, !compte.superAdmin), "Droits mis à jour."),
    supprimer: () => executer(() => supprimerCompteAdmin(compte.id), "Compte supprimé.", true),
  };
  const texte = confirmation && confirmation !== "effacer" ? CONFIRMATIONS[confirmation](compte) : null;

  return (
    <>
      <SheetHeader>
        <SheetTitle>{nomComplet(compte)}</SheetTitle>
        <SheetDescription>
          {compte.email}. Compte créé le {DATE.format(new Date(compte.dateCreation))}.
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-wrap gap-2">
        <Statut libelle={compte.actif ? { texte: "Actif", ton: "ouvert" } : { texte: "Désactivé", ton: "passe" }} />
        {compte.superAdmin && <Statut libelle={{ texte: "Super admin", ton: "info" }} />}
        {!compte.emailVerifie && <Statut libelle={{ texte: "Email non vérifié", ton: "attente" }} />}
      </div>
      <p className="text-base text-foreground">{compte.role ? libelleRole(compte.role, compte.statutMembre) : "Aucun rôle dans l'association."}</p>

      {estSoi ? (
        <p className="text-base text-muted-foreground">C&apos;est votre compte : aucune action possible ici.</p>
      ) : (
        <>
          <div className="flex flex-col items-start gap-2">
            <Button variant="outline" disabled={enCours} onClick={() => setConfirmation("actif")}>
              {enCours && <Spinner size="sm" />}
              {compte.actif ? "Désactiver le compte" : "Réactiver le compte"}
            </Button>
            <Button variant="outline" disabled={enCours} onClick={() => setConfirmation("admin")}>
              {compte.superAdmin ? "Retirer les droits super admin" : "Accorder les droits super admin"}
            </Button>
          </div>
          <div className="mt-2 flex flex-col items-start gap-2 border-t border-border pt-4">
            <p className="text-base text-muted-foreground">Pour une demande d&apos;effacement reçue hors de Solivio (RGPD), effacez les données plutôt que le seul compte.</p>
            <Button variant="destructive" disabled={enCours} onClick={() => setConfirmation("effacer")}>
              Effacer les données personnelles
            </Button>
            <Button variant="destructive" disabled={enCours} onClick={() => setConfirmation("supprimer")}>
              Supprimer le compte
            </Button>
          </div>
        </>
      )}
      {erreur && <Alert variant="destructive">{erreur}</Alert>}

      <AlertDialog open={texte !== null} onOpenChange={(o) => !o && setConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{texte?.titre}</AlertDialogTitle>
            <AlertDialogDescription>{texte?.texte}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
              variant={texte?.destructive ? "destructive-solid" : "default"}
              onClick={() => confirmation && confirmation !== "effacer" && appels[confirmation]()}
            >
              {texte?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DialogEffacementCompte
        compte={compte}
        open={confirmation === "effacer"}
        onFermer={() => setConfirmation(null)}
        onConfirmer={() => executer(() => effacerDonneesCompteAdmin(compte.id), "Données effacées.", true)}
      />
    </>
  );
}

/* Tous les comptes de la plateforme, sur le motif des membres : liste, filtre, fiche. */
export function GestionComptes({ page, currentUserId, recherche: rechercheInitiale, currentPage }: Props) {
  const router = useRouter();
  const chemin = usePathname();
  const [recherche, setRecherche] = useState(rechercheInitiale);
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [ouvertId, setOuvertId] = useState<string | null>(null);

  function aller(q: string, p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 0) params.set("page", String(p));
    router.push(params.size ? `${chemin}?${params}` : chemin);
  }

  const comptes = page.content.filter((c) => (filtre === "desactives" ? !c.actif : filtre === "admins" ? c.superAdmin : true));
  const ouvert = page.content.find((c) => c.id === ouvertId) ?? null;

  const colonnes: ColumnDef<CompteAdminResponse>[] = [
    {
      key: "nom",
      header: "Utilisateur",
      sortable: true,
      cell: (c) => (
        <button type="button" onClick={() => setOuvertId(c.id)} className="group flex items-center gap-3 text-left">
          <Initiales prenom={c.prenom} nom={c.nom} />
          <span className="flex flex-col">
            <span className="font-semibold text-foreground group-hover:underline">
              {c.nom} {c.prenom}
              {c.id === currentUserId && <span className="font-normal text-muted-foreground"> (vous)</span>}
            </span>
            <span className="text-sm text-muted-foreground">{c.email}</span>
          </span>
        </button>
      ),
    },
    { key: "role", header: "Rôle", cell: (c) => (c.role ? libelleRole(c.role, c.statutMembre) : "-") },
    {
      key: "etat",
      header: "État",
      cell: (c) => (
        <span className="flex flex-wrap gap-1.5">
          {!c.actif && <Statut libelle={{ texte: "Désactivé", ton: "passe" }} />}
          {c.superAdmin && <Statut libelle={{ texte: "Super admin", ton: "info" }} />}
          {!c.emailVerifie && <Statut libelle={{ texte: "Email non vérifié", ton: "attente" }} />}
        </span>
      ),
    },
    {
      key: "gerer",
      header: "",
      className: "text-right",
      cell: (c) => (
        <Button variant="ghost" size="sm" onClick={() => setOuvertId(c.id)} aria-label={`Gérer ${nomComplet(c)}`}>
          Gérer
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl
          label="Comptes à afficher"
          value={filtre}
          onValueChange={setFiltre}
          options={[
            { value: "tous", label: "Tous" },
            { value: "desactives", label: "Désactivés" },
            { value: "admins", label: "Super admins" },
          ]}
        />
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            aller(recherche.trim(), 0);
          }}
          className="flex gap-2 lg:w-96"
        >
          <SearchField label="Chercher un compte" placeholder="Nom, prénom ou email" value={recherche} onValueChange={setRecherche} className="flex-1" />
          <Button type="submit" variant="outline">
            Chercher
          </Button>
        </form>
      </div>

      {comptes.length === 0 ? (
        <EmptyState size="sm" title="Aucun compte trouvé" />
      ) : (
        <>
          <DataTable
            className="hidden md:block"
            data={comptes}
            columns={colonnes}
            pageSize={50}
            getRowKey={(c) => c.id}
            sortKey={(c) => `${c.nom} ${c.prenom}`}
          />
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card md:hidden">
            {comptes.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setOuvertId(c.id)} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold text-foreground">
                      {c.nom} {c.prenom}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">{c.email}</span>
                  </span>
                  {!c.actif && <Statut libelle={{ texte: "Désactivé", ton: "passe" }} />}
                  <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {page.totalPages > 1 && (
        <nav aria-label="Pages" className="flex items-center gap-3">
          <Button variant="outline" onClick={() => aller(rechercheInitiale, currentPage - 1)} disabled={currentPage === 0}>
            Précédente
          </Button>
          <span className="text-base text-muted-foreground tabular-nums">
            Page {currentPage + 1} sur {page.totalPages}
          </span>
          <Button variant="outline" onClick={() => aller(rechercheInitiale, currentPage + 1)} disabled={currentPage >= page.totalPages - 1}>
            Suivante
          </Button>
        </nav>
      )}

      <Sheet open={ouvert !== null} onOpenChange={(o) => !o && setOuvertId(null)}>
        <SheetContent>{ouvert && <FicheCompte key={ouvert.id} compte={ouvert} estSoi={ouvert.id === currentUserId} onFermer={() => setOuvertId(null)} />}</SheetContent>
      </Sheet>
    </div>
  );
}
