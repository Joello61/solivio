"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useMutation, useMutationState, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, CloudOff, Mail, RotateCcw, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { DialogAjoutBenevole } from "@/components/pointage/DialogAjoutBenevole";
import {
  rechercherPointage,
  pointer,
  listerVisiteursAdHoc,
  envoyerInvitationVisiteur,
} from "@/lib/api/distributions";
import {
  correspond,
  delaiNouvelEssai,
  doitReessayer,
  lignesAffichees,
  trierParNom,
  type EnvoiPointage,
  type LignePointage,
  type PresencePointee,
} from "@/lib/pointage";
import { cn } from "@/lib/utils";
import type { InscriptionResponse, PointageAdHocResponse, PointageInfoResponse } from "@/types/distribution";

// Les pointages des autres benevoles apparaissent sans recharger la page.
const RAFRAICHISSEMENT_MS = 15_000;

type Onglet = "a-pointer" | "pointes";

interface Props {
  distributionId: string;
  peutAjouter?: boolean;
}

function abonnerReseau(rappel: () => void) {
  window.addEventListener("online", rappel);
  window.addEventListener("offline", rappel);
  return () => {
    window.removeEventListener("online", rappel);
    window.removeEventListener("offline", rappel);
  };
}

function useEnLigne(): boolean {
  return useSyncExternalStore(abonnerReseau, () => navigator.onLine, () => true);
}

function messageErreur(e: unknown, defaut: string): string {
  const err = e as { detail?: string; message?: string };
  return err.detail ?? err.message ?? defaut;
}

export function PointageListe({ distributionId, peutAjouter = false }: Props) {
  const queryClient = useQueryClient();
  const enLigne = useEnLigne();
  const [recherche, setRecherche] = useState("");
  const [onglet, setOnglet] = useState<Onglet>("a-pointer");
  const cleListe = useMemo(() => ["pointage", distributionId], [distributionId]);
  const cleEnvois = useMemo(() => ["pointer", distributionId], [distributionId]);

  const liste = useQuery({
    queryKey: cleListe,
    queryFn: () => rechercherPointage(distributionId, ""),
    refetchInterval: RAFRAICHISSEMENT_MS,
  });

  const etatsEnvois = useMutationState({
    filters: { mutationKey: cleEnvois },
    // Une mutation entre dans le cache avant d'avoir recu ses variables.
    select: (m): EnvoiPointage | null => {
      const variables = m.state.variables as { inscriptionId: string; presence: PresencePointee } | undefined;
      if (!variables) return null;
      return {
        inscriptionId: variables.inscriptionId,
        presence: variables.presence,
        statut: m.state.status,
        enPause: m.state.isPaused,
        soumisA: m.state.submittedAt,
      };
    },
  });

  const lignes = useMemo(
    () => trierParNom(lignesAffichees(liste.data ?? [], etatsEnvois.filter((e) => e !== null))),
    [liste.data, etatsEnvois],
  );
  const presents = lignes.filter((l) => l.presence === "PRESENT").length;
  const aPointer = lignes.filter((l) => l.presence === "NON_POINTE");
  const pointes = lignes.filter((l) => l.presence !== "NON_POINTE");
  const visibles = (onglet === "a-pointer" ? aPointer : pointes).filter((l) => correspond(l, recherche));
  const enAttente = lignes.filter((l) => l.etat === "attente" || l.etat === "envoi").length;

  const visiteurs = useQuery({
    queryKey: ["pointage-visiteurs", distributionId],
    queryFn: () => listerVisiteursAdHoc(distributionId),
    enabled: peutAjouter,
  });

  return (
    <div className="space-y-4">
      {!enLigne && (
        <div role="status" className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <CloudOff className="size-4 shrink-0 mt-0.5 text-warning" />
          <span>
            Connexion perdue. Continuez à pointer : les pointages partiront dès le retour du réseau,
            tant que cette page reste ouverte.
          </span>
        </div>
      )}

      {peutAjouter && (
        <div className="flex justify-end">
          <DialogAjoutBenevole
            distributionId={distributionId}
            onBenevoleAjoute={() => queryClient.invalidateQueries({ queryKey: cleListe })}
            onVisiteurAjoute={(visiteur) =>
              queryClient.setQueryData<PointageAdHocResponse[]>(["pointage-visiteurs", distributionId], (prev) => [
                ...(prev ?? []),
                visiteur,
              ])
            }
          />
        </div>
      )}

      {/* Recherche et onglets restent visibles pendant le defilement de la liste. */}
      <div className="sticky top-0 z-10 -mx-4 space-y-3 bg-background/95 px-4 pb-3 pt-1 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            className="h-11 pl-9"
            placeholder="Filtrer par nom ou prénom"
            aria-label="Rechercher un inscrit"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div role="tablist" aria-label="Inscrits" className="flex flex-1 gap-1 rounded-xl bg-muted p-1">
            {(
              [
                { cle: "a-pointer", libelle: "À pointer", nombre: aPointer.length },
                { cle: "pointes", libelle: "Pointés", nombre: pointes.length },
              ] as const
            ).map((o) => (
              <button
                key={o.cle}
                type="button"
                role="tab"
                aria-selected={onglet === o.cle}
                onClick={() => setOnglet(o.cle)}
                className={cn(
                  "flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors",
                  onglet === o.cle ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                {o.libelle}
                <span className="tabular-nums text-xs text-muted-foreground">{o.nombre}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-semibold text-foreground tabular-nums">{presents}</span> présent
          {presents > 1 ? "s" : ""} sur <span className="tabular-nums">{lignes.length}</span> inscrit
          {lignes.length > 1 ? "s" : ""}
          {enAttente > 0 && ` - ${enAttente} en attente d'envoi`}
        </p>
      </div>

      {liste.isPending ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : liste.isError && !liste.data ? (
        <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {messageErreur(liste.error, "La liste n'a pas pu être chargée.")}
        </div>
      ) : visibles.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-muted px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {recherche.trim()
              ? `Aucun inscrit ne correspond à "${recherche.trim()}" dans cet onglet.`
              : onglet === "a-pointer"
                ? "Tout le monde est pointé."
                : "Personne n'est encore pointé."}
          </p>
        </div>
      ) : (
        <ul className="rounded-2xl border border-border/60 bg-card shadow-sm divide-y divide-border/60 overflow-hidden">
          {visibles.map((l) => (
            <LigneInscrit key={l.inscriptionId} ligne={l} distributionId={distributionId} cleListe={cleListe} cleEnvois={cleEnvois} />
          ))}
        </ul>
      )}

      {peutAjouter && (visiteurs.data?.length ?? 0) > 0 && (
        <Visiteurs distributionId={distributionId} visiteurs={visiteurs.data ?? []} />
      )}
    </div>
  );
}

function LigneInscrit({
  ligne,
  distributionId,
  cleListe,
  cleEnvois,
}: {
  ligne: LignePointage;
  distributionId: string;
  cleListe: readonly unknown[];
  cleEnvois: readonly unknown[];
}) {
  const queryClient = useQueryClient();
  const envoi = useMutation({
    mutationKey: cleEnvois,
    // Les pointages d'une meme ligne partent dans l'ordre des clics.
    scope: { id: `pointage-${ligne.inscriptionId}` },
    mutationFn: (v: { inscriptionId: string; presence: PresencePointee }) =>
      pointer(distributionId, v.inscriptionId, v.presence),
    retry: doitReessayer,
    retryDelay: delaiNouvelEssai,
    onSuccess: (reponse: InscriptionResponse) => {
      queryClient.setQueryData<PointageInfoResponse[]>(cleListe, (prev) =>
        prev?.map((r) => (r.inscriptionId === reponse.id ? { ...r, presence: reponse.presence } : r)),
      );
    },
  });

  function pointerLigne(presence: PresencePointee) {
    envoi.mutate({ inscriptionId: ligne.inscriptionId, presence });
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-base font-semibold">
          {ligne.nom} {ligne.prenom}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-xs">
            {ligne.type === "BENEFICIAIRE" ? "Bénéficiaire" : "Bénévole"}
          </Badge>
          {ligne.etat === "envoi" && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Spinner size="sm" className="size-3" /> Envoi
            </span>
          )}
          {ligne.etat === "attente" && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
              <CloudOff className="size-3.5" /> En attente d&apos;envoi
            </span>
          )}
          {ligne.etat === "echec" && (
            <button
              type="button"
              onClick={() => ligne.derniereDemande && pointerLigne(ligne.derniereDemande)}
              className="inline-flex min-h-8 items-center gap-1 rounded-full border border-destructive/30 px-2.5 text-xs font-medium text-destructive"
            >
              <AlertTriangle className="size-3.5" /> Échec, réessayer
              <RotateCcw className="size-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        <Button
          size="icon-lg"
          className="size-12"
          variant={ligne.presence === "PRESENT" ? "default" : "outline"}
          aria-pressed={ligne.presence === "PRESENT"}
          onClick={() => pointerLigne("PRESENT")}
          aria-label={`Marquer ${ligne.prenom} ${ligne.nom} présent`}
        >
          <Check className="size-5" />
        </Button>
        <Button
          size="icon-lg"
          className="size-12"
          variant={ligne.presence === "ABSENT" ? "destructive" : "outline"}
          aria-pressed={ligne.presence === "ABSENT"}
          onClick={() => pointerLigne("ABSENT")}
          aria-label={`Marquer ${ligne.prenom} ${ligne.nom} absent`}
        >
          <X className="size-5" />
        </Button>
      </div>
    </li>
  );
}

function Visiteurs({ distributionId, visiteurs }: { distributionId: string; visiteurs: PointageAdHocResponse[] }) {
  const queryClient = useQueryClient();
  const invitation = useMutation({
    mutationFn: (visiteurId: string) => envoyerInvitationVisiteur(distributionId, visiteurId),
    onSuccess: (_reponse, visiteurId) =>
      queryClient.setQueryData<PointageAdHocResponse[]>(["pointage-visiteurs", distributionId], (prev) =>
        prev?.map((v) => (v.id === visiteurId ? { ...v, invitationEnvoyee: true } : v)),
      ),
  });

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Visiteurs ponctuels ({visiteurs.length})
      </p>
      {invitation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {messageErreur(invitation.error, "Erreur lors de l'envoi.")}
        </p>
      )}
      <ul className="rounded-2xl border border-border/60 bg-card shadow-sm divide-y divide-border/60 overflow-hidden">
        {visiteurs.map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-sm font-semibold">
                {v.nom} {v.prenom}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">Visiteur</Badge>
                {v.role && <Badge variant="outline" className="text-xs">{v.role}</Badge>}
                <Badge variant="default" className="text-xs">Présent</Badge>
              </div>
            </div>
            {v.email && !v.invitationEnvoyee && (
              <Button
                size="sm"
                variant="outline"
                disabled={invitation.isPending && invitation.variables === v.id}
                onClick={() => invitation.mutate(v.id)}
                className="shrink-0"
              >
                {invitation.isPending && invitation.variables === v.id ? (
                  <>
                    <Spinner size="sm" /> Envoi...
                  </>
                ) : (
                  <>
                    <Mail className="size-4" /> Inviter
                  </>
                )}
              </Button>
            )}
            {v.invitationEnvoyee && (
              <Badge variant="secondary" className="text-xs shrink-0">Invité</Badge>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
