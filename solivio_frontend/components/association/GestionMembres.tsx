"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, FileText } from "lucide-react";
import { Alert } from "@/components/ui/alert";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Statut } from "@/components/ui/statut";
import { changerStatutMembre, mettreAJourRoleMembre, supprimerMembre } from "@/lib/api/association";
import { messageErreur } from "@/lib/erreurs";
import type { LibelleStatut } from "@/lib/libelles";
import { ROLE_LABELS } from "@/lib/roles";
import type { MembreResponse } from "@/types/association";

const ROLES_ATTRIBUABLES = ["benevole", "coordinateur", "responsable", "super_admin"];

type FiltreRole = "tous" | "beneficiaire" | "benevole" | "encadrement";
type FiltreStatut = "actifs" | "en_attente" | "suspendus";

const STATUT_MEMBRE: Record<string, LibelleStatut> = {
  actif: { texte: "Actif", ton: "ouvert" },
  suspendu: { texte: "Suspendu", ton: "passe" },
  invite_en_attente: { texte: "Invitation envoyée", ton: "brouillon" },
};

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const normaliser = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr");

function correspondRole(m: MembreResponse, filtre: FiltreRole): boolean {
  if (filtre === "tous") return true;
  if (filtre === "encadrement") return m.role === "coordinateur" || m.role === "responsable" || m.role === "super_admin";
  return m.role === filtre;
}

function correspondStatut(m: MembreResponse, filtre: FiltreStatut): boolean {
  if (filtre === "actifs") return m.statut === "actif";
  if (filtre === "suspendus") return m.statut === "suspendu";
  return m.statut === "invite_en_attente";
}

const arrivee = (m: MembreResponse) => (m.dateDebut ? DATE.format(new Date(m.dateDebut)) : "-");

interface FicheProps {
  membre: MembreResponse | null;
  estSoi: boolean;
  peutVoirDossier: boolean;
  onFermer: () => void;
}

/* Les actions sur un membre, a l'ecart de la liste : role, suspension, retrait. */
function FicheMembre({ membre, estSoi, peutVoirDossier, onFermer }: FicheProps) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [retrait, setRetrait] = useState(false);

  async function executer(appel: () => Promise<unknown>, succes: string, fermer = false) {
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

  if (!membre) return null;
  const nom = `${membre.prenom} ${membre.nom}`;
  const suspendu = membre.statut === "suspendu";
  const roles = ROLES_ATTRIBUABLES.includes(membre.role) ? ROLES_ATTRIBUABLES : [membre.role, ...ROLES_ATTRIBUABLES];

  return (
    <>
      <SheetHeader>
        <SheetTitle>{nom}</SheetTitle>
        <SheetDescription>
          {membre.email}. Membre depuis le {arrivee(membre)}.
        </SheetDescription>
      </SheetHeader>
      <Statut libelle={STATUT_MEMBRE[membre.statut] ?? { texte: membre.statut, ton: "passe" }} className="w-fit" />

      {peutVoirDossier && membre.role === "beneficiaire" && (
        <Link href={`/association/membres/${membre.compteId}/dossier`} className={buttonVariants({ variant: "outline", className: "self-start" })}>
          <FileText aria-hidden="true" />
          Voir le dossier social
        </Link>
      )}

      {estSoi ? (
        <p className="text-base text-muted-foreground">C&apos;est votre compte : un autre responsable peut changer votre rôle.</p>
      ) : (
        <>
          <FormField label="Rôle" htmlFor="role-membre" hint={suspendu ? "Réactivez le membre pour changer son rôle." : undefined}>
            <Select
              items={ROLE_LABELS}
              value={membre.role}
              disabled={enCours || suspendu}
              onValueChange={(v) => v && v !== membre.role && executer(() => mettreAJourRoleMembre(membre.compteId, { role: v }), `${nom} est maintenant ${ROLE_LABELS[v]?.toLowerCase() ?? v}.`)}
            >
              <SelectTrigger id="role-membre" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r] ?? r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {membre.statut !== "invite_en_attente" && (
            <div className="flex flex-col gap-2">
              <p className="text-base text-muted-foreground">
                {suspendu
                  ? "Réactivé, le membre pourra de nouveau participer aux activités de l'association."
                  : "Suspendu, le membre ne pourra plus participer aux activités de l'association."}
              </p>
              <Button
                variant="outline"
                className="self-start"
                disabled={enCours}
                onClick={() =>
                  executer(
                    () => changerStatutMembre(membre.compteId, suspendu ? "actif" : "suspendu"),
                    suspendu ? `${nom} est de nouveau actif.` : `${nom} est suspendu.`,
                  )
                }
              >
                {enCours && <Spinner size="sm" />}
                {suspendu ? "Réactiver" : "Suspendre"}
              </Button>
            </div>
          )}

          <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
            <Button variant="destructive" className="self-start" disabled={enCours} onClick={() => setRetrait(true)}>
              Retirer de l&apos;association
            </Button>
          </div>
        </>
      )}
      {erreur && <Alert variant="destructive">{erreur}</Alert>}

      <AlertDialog open={retrait} onOpenChange={setRetrait}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer {nom}</AlertDialogTitle>
            <AlertDialogDescription>
              Le membre est retiré définitivement de l&apos;association. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Garder</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive-solid"
              onClick={() => executer(() => supprimerMembre(membre.compteId), `${nom} a été retiré de l'association.`, true)}
            >
              Retirer
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
  // RG5 : le dossier social n'est lisible que par le responsable.
  peutVoirDossiers?: boolean;
}

/* Les membres comme dans un tableur : filtres, recherche, tri ; les actions dans une fiche. */
export function GestionMembres({ membres, currentUserId, peutVoirDossiers = false }: Props) {
  const [recherche, setRecherche] = useState("");
  const [role, setRole] = useState<FiltreRole>("tous");
  const [statut, setStatut] = useState<FiltreStatut>("actifs");
  const [ouvertId, setOuvertId] = useState<string | null>(null);

  const terme = normaliser(recherche.trim());
  const parRole = useMemo(() => membres.filter((m) => correspondRole(m, role)), [membres, role]);
  const lignes = parRole
    .filter((m) => correspondStatut(m, statut))
    .filter((m) => !terme || normaliser(`${m.prenom} ${m.nom} ${m.email}`).includes(terme));
  const compte = (f: FiltreRole) => membres.filter((m) => correspondRole(m, f) && correspondStatut(m, statut)).length;
  const ouvert = membres.find((m) => m.compteId === ouvertId) ?? null;

  const nomCellule = (m: MembreResponse) => (
    <button type="button" onClick={() => setOuvertId(m.compteId)} className="flex flex-col text-left hover:underline focus-visible:underline">
      <span className="font-semibold text-foreground">
        {m.nom} {m.prenom}
        {m.compteId === currentUserId && <span className="font-normal text-muted-foreground"> (vous)</span>}
      </span>
      <span className="text-sm text-muted-foreground">{m.email}</span>
    </button>
  );

  const colonnes: ColumnDef<MembreResponse>[] = [
    { key: "nom", header: "Membre", sortable: true, cell: nomCellule },
    { key: "role", header: "Rôle", sortable: true, cell: (m) => ROLE_LABELS[m.role] ?? m.role },
    { key: "arrivee", header: "Arrivée", sortable: true, className: "tabular-nums text-muted-foreground", cell: arrivee },
    {
      key: "gerer",
      header: "",
      className: "text-right",
      cell: (m) => (
        <Button variant="ghost" size="sm" onClick={() => setOuvertId(m.compteId)} aria-label={`Gérer ${m.prenom} ${m.nom}`}>
          Gérer
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl
          label="Rôle"
          value={role}
          onValueChange={setRole}
          options={[
            { value: "tous", label: "Tous", count: compte("tous") },
            { value: "beneficiaire", label: "Bénéficiaires", count: compte("beneficiaire") },
            { value: "benevole", label: "Bénévoles", count: compte("benevole") },
            { value: "encadrement", label: "Encadrement", count: compte("encadrement") },
          ]}
        />
        <SearchField label="Chercher un membre" placeholder="Nom, prénom ou email" value={recherche} onValueChange={setRecherche} className="lg:w-80" />
      </div>
      <SegmentedControl
        label="Statut"
        size="sm"
        value={statut}
        onValueChange={setStatut}
        options={[
          { value: "actifs", label: "Actifs", count: parRole.filter((m) => m.statut === "actif").length },
          { value: "en_attente", label: "Invitations", count: parRole.filter((m) => m.statut === "invite_en_attente").length },
          { value: "suspendus", label: "Suspendus", count: parRole.filter((m) => m.statut === "suspendu").length },
        ]}
      />

      {lignes.length === 0 ? (
        <EmptyState size="sm" title={terme ? "Personne ne correspond" : "Personne dans cette sélection"} />
      ) : (
        <>
          <DataTable
            className="hidden md:block"
            data={lignes}
            columns={colonnes}
            pageSize={50}
            getRowKey={(m) => m.compteId}
            sortKey={(m, cle) => (cle === "role" ? (ROLE_LABELS[m.role] ?? m.role) : cle === "arrivee" ? m.dateDebut : `${m.nom} ${m.prenom}`)}
          />
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card md:hidden">
            {lignes.map((m) => (
              <li key={m.compteId}>
                <button type="button" onClick={() => setOuvertId(m.compteId)} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold text-foreground">
                      {m.nom} {m.prenom}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">{ROLE_LABELS[m.role] ?? m.role}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <Sheet open={ouvert !== null} onOpenChange={(o) => !o && setOuvertId(null)}>
        <SheetContent>
          <FicheMembre
            key={ouvert?.compteId}
            membre={ouvert}
            estSoi={ouvert?.compteId === currentUserId}
            peutVoirDossier={peutVoirDossiers}
            onFermer={() => setOuvertId(null)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
