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
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Initiales } from "@/components/ui/initiales";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Statut } from "@/components/ui/statut";
import { changerStatutMembre, mettreAJourRolesMembre, supprimerMembre } from "@/lib/api/association";
import { messageErreur } from "@/lib/erreurs";
import type { LibelleStatut } from "@/lib/libelles";
import { ROLE_LABELS, ROLES_CUMULABLES, SANS_TYPE_COORDINATION, TYPES_COORDINATION, libelleRoles } from "@/lib/roles";
import type { MembreResponse } from "@/types/association";

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
  if (filtre === "encadrement") return m.roles.includes("coordinateur") || m.roles.includes("responsable");
  return m.roles.includes(filtre);
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

/*
 * Roles d'un membre (ADR-012) : coordinateur, benevole et beneficiaire se cumulent ;
 * responsable remplace tous les autres et se donne a part, avec confirmation.
 */
function RolesDuMembre({ membre, enCours, executer }: { membre: MembreResponse; enCours: boolean; executer: Executer }) {
  const responsable = membre.roles.includes("responsable");
  const initiaux = membre.roles.filter((r) => r !== "responsable");
  const [choisis, setChoisis] = useState<string[]>(initiaux);
  const [coordoType, setCoordoType] = useState(membre.coordoType ?? SANS_TYPE_COORDINATION);
  const [nommer, setNommer] = useState(false);
  const nom = `${membre.prenom} ${membre.nom}`;
  const modifie =
    choisis.length > 0 &&
    (responsable ||
      choisis.length !== initiaux.length ||
      choisis.some((r) => !initiaux.includes(r)) ||
      (choisis.includes("coordinateur") && coordoType !== (membre.coordoType ?? SANS_TYPE_COORDINATION)));

  function enregistrer() {
    const roles = ROLES_CUMULABLES.filter((r) => choisis.includes(r));
    executer(
      () =>
        mettreAJourRolesMembre(membre.compteId, {
          roles,
          coordoType: roles.includes("coordinateur") && coordoType !== SANS_TYPE_COORDINATION ? coordoType : null,
        }),
      `Rôles de ${nom} : ${libelleRoles(roles).toLowerCase()}.`,
    );
  }

  return (
    <fieldset className="flex flex-col gap-3" disabled={enCours}>
      <legend className="mb-1 text-base font-semibold text-foreground">Rôles</legend>
      {responsable && (
        <p className="text-base text-muted-foreground">
          {nom} est responsable, rôle qui ne se cumule avec aucun autre. Pour le lui retirer, choisissez ce qu&apos;il
          devient.
        </p>
      )}
      {ROLES_CUMULABLES.map((r) => (
        <label key={r} className="flex cursor-pointer items-center gap-3 text-base text-foreground">
          <Checkbox
            checked={choisis.includes(r)}
            onCheckedChange={(v) => setChoisis((prev) => (v === true ? [...prev, r] : prev.filter((x) => x !== r)))}
          />
          {ROLE_LABELS[r]}
        </label>
      ))}
      {choisis.includes("coordinateur") && (
        <FormField label="Type de coordination" htmlFor="role-coordination">
          <Select items={TYPES_COORDINATION} value={coordoType} onValueChange={(v) => v && setCoordoType(v)}>
            <SelectTrigger id="role-coordination" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES_COORDINATION.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}
      <div className="flex flex-wrap gap-2">
        <Button className="self-start" disabled={!modifie} onClick={enregistrer}>
          {enCours && <Spinner size="sm" />}
          Enregistrer les rôles
        </Button>
        {!responsable && (
          <Button variant="outline" className="self-start" onClick={() => setNommer(true)}>
            Nommer responsable
          </Button>
        )}
      </div>

      <AlertDialog open={nommer} onOpenChange={setNommer}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nommer {nom} responsable</AlertDialogTitle>
            <AlertDialogDescription>
              Un responsable n&apos;a que ce rôle : {nom} ne pourra plus s&apos;inscrire comme bénévole ni comme
              bénéficiaire. Ce n&apos;est possible qu&apos;une fois ses inscriptions à venir passées ou annulées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                executer(() => mettreAJourRolesMembre(membre.compteId, { roles: ["responsable"] }), `${nom} est maintenant responsable.`)
              }
            >
              Nommer responsable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </fieldset>
  );
}

type Executer = (appel: () => Promise<unknown>, succes: string, fermer?: boolean) => void;

/* Les actions sur un membre, a l'ecart de la liste : roles, suspension, retrait. */
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

  return (
    <>
      <SheetHeader>
        <SheetTitle>{nom}</SheetTitle>
        <SheetDescription>
          {membre.email}. Membre depuis le {arrivee(membre)}.
        </SheetDescription>
      </SheetHeader>
      <Statut libelle={STATUT_MEMBRE[membre.statut] ?? { texte: membre.statut, ton: "passe" }} className="w-fit" />

      {peutVoirDossier && membre.roles.includes("beneficiaire") && (
        <Link href={`/association/membres/${membre.compteId}/dossier`} className={buttonVariants({ variant: "outline", className: "self-start" })}>
          <FileText aria-hidden="true" />
          Voir le dossier social
        </Link>
      )}

      {estSoi ? (
        <p className="text-base text-muted-foreground">C&apos;est votre compte : un autre responsable peut changer vos rôles.</p>
      ) : (
        <>
          {suspendu ? (
            <p className="text-base text-muted-foreground">
              {libelleRoles(membre.roles)}. Réactivez le membre pour changer ses rôles.
            </p>
          ) : (
            <RolesDuMembre membre={membre} enCours={enCours} executer={executer} />
          )}

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
    <button type="button" onClick={() => setOuvertId(m.compteId)} className="group flex items-center gap-3 text-left">
      <Initiales prenom={m.prenom} nom={m.nom} />
      <span className="flex flex-col">
        <span className="font-semibold text-foreground group-hover:underline group-focus-visible:underline">
          {m.nom} {m.prenom}
          {m.compteId === currentUserId && <span className="font-normal text-muted-foreground"> (vous)</span>}
        </span>
        <span className="text-sm text-muted-foreground">{m.email}</span>
      </span>
    </button>
  );

  const colonnes: ColumnDef<MembreResponse>[] = [
    { key: "nom", header: "Membre", sortable: true, cell: nomCellule },
    { key: "role", header: "Rôles", sortable: true, cell: (m) => libelleRoles(m.roles) },
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
            sortKey={(m, cle) => (cle === "role" ? libelleRoles(m.roles) : cle === "arrivee" ? m.dateDebut : `${m.nom} ${m.prenom}`)}
          />
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card md:hidden">
            {lignes.map((m) => (
              <li key={m.compteId}>
                <button type="button" onClick={() => setOuvertId(m.compteId)} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted">
                  <Initiales prenom={m.prenom} nom={m.nom} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold text-foreground">
                      {m.nom} {m.prenom}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">{libelleRoles(m.roles)}</span>
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
