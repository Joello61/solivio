"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { MutationObserver, useMutationState, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Check, CloudOff, RotateCcw, Undo2, UserX, X } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { Alert } from "@/components/ui/alert";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Spinner } from "@/components/ui/spinner";
import { AjoutEquipe } from "@/components/pointage/AjoutEquipe";
import { ClotureJourJ } from "@/components/pointage/ClotureJourJ";
import { Visiteurs } from "@/components/pointage/Visiteurs";
import { horaire } from "@/lib/agenda";
import { listerVisiteursAdHoc, pointer, rechercherPointage } from "@/lib/api/distributions";
import { messageErreur } from "@/lib/erreurs";
import {
  correspond,
  delaiNouvelEssai,
  doitReessayer,
  grouperParCreneau,
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
const HORLOGE_MS = 30_000;

type Vue = "a-pointer" | "pointes" | "equipe";

interface Props {
  distributionId: string;
  /* Jour de la distribution, deja mis en forme ("Jeudi 15 octobre"). */
  jour: string;
  fuseau?: string;
  /* Gestionnaire : ajout de benevoles et de visiteurs, cloture. */
  peutGerer?: boolean;
  /* Close, la distribution accepte encore les corrections de pointage. */
  close?: boolean;
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

function abonnerHorloge(rappel: () => void) {
  const minuteur = setInterval(rappel, HORLOGE_MS);
  return () => clearInterval(minuteur);
}

/* Heure locale "HH:MM" de l'association, inconnue au rendu serveur. */
function useHeure(fuseau: string): string | null {
  return useSyncExternalStore(
    abonnerHorloge,
    () => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: fuseau }).format(new Date()),
    () => null,
  );
}

/*
 * Un pointage part hors du cycle de vie de la ligne : pointee, elle quitte
 * l'onglet "A pointer" sans interrompre son envoi ni sa file hors ligne. Les
 * pointages d'une meme personne partent dans l'ordre des gestes.
 */
function envoyerPointage(client: QueryClient, distributionId: string, inscriptionId: string, presence: PresencePointee) {
  const observateur = new MutationObserver(client, {
    mutationKey: ["pointer", distributionId],
    scope: { id: `pointage-${inscriptionId}` },
    mutationFn: (v: { inscriptionId: string; presence: PresencePointee }) => pointer(distributionId, v.inscriptionId, v.presence),
    retry: doitReessayer,
    retryDelay: delaiNouvelEssai,
    onSuccess: (reponse: InscriptionResponse) => {
      client.setQueryData<PointageInfoResponse[]>(["pointage", distributionId], (prev) =>
        prev?.map((r) => (r.inscriptionId === reponse.id ? { ...r, presence: reponse.presence } : r)),
      );
    },
  });
  // L'echec reste visible sur la ligne, avec "Reessayer".
  observateur.mutate({ inscriptionId, presence }).catch(() => undefined);
}

export function JourJ({ distributionId, jour, fuseau = "Europe/Paris", peutGerer = false, close = false }: Props) {
  const client = useQueryClient();
  const enLigne = useEnLigne();
  const heure = useHeure(fuseau);
  const [recherche, setRecherche] = useState("");
  const [vue, setVue] = useState<Vue>("a-pointer");
  const cleListe = useMemo(() => ["pointage", distributionId], [distributionId]);

  const liste = useQuery({
    queryKey: cleListe,
    queryFn: () => rechercherPointage(distributionId, ""),
    refetchInterval: RAFRAICHISSEMENT_MS,
  });
  const visiteurs = useQuery({
    queryKey: ["pointage-visiteurs", distributionId],
    queryFn: () => listerVisiteursAdHoc(distributionId),
    enabled: peutGerer,
  });

  const envois = useMutationState({
    filters: { mutationKey: ["pointer", distributionId] },
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
    () => trierParNom(lignesAffichees(liste.data ?? [], envois.filter((e) => e !== null))),
    [liste.data, envois],
  );
  const beneficiaires = lignes.filter((l) => l.type === "BENEFICIAIRE");
  const equipe = lignes.filter((l) => l.type === "BENEVOLE");
  const aPointer = beneficiaires.filter((l) => l.presence === "NON_POINTE");
  const pointes = beneficiaires.filter((l) => l.presence !== "NON_POINTE");
  const presents = beneficiaires.filter((l) => l.presence === "PRESENT").length;
  const equipePresente = equipe.filter((l) => l.presence === "PRESENT").length;
  const enAttente = lignes.filter((l) => l.etat === "attente" || l.etat === "envoi").length;
  const listeVisiteurs = visiteurs.data ?? [];

  const source = vue === "a-pointer" ? aPointer : vue === "pointes" ? pointes : equipe;
  const visibles = source.filter((l) => correspond(l, recherche));
  const groupes = grouperParCreneau(visibles, heure);

  function pointerLigne(ligne: LignePointage, presence: PresencePointee) {
    envoyerPointage(client, distributionId, ligne.inscriptionId, presence);
    if (presence !== "PRESENT") return;
    const precedente = ligne.presence as PresencePointee;
    toast(`Présence notée : ${ligne.prenom} ${ligne.nom}`, {
      action: { label: "Annuler", onClick: () => envoyerPointage(client, distributionId, ligne.inscriptionId, precedente) },
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 flex flex-col gap-3 bg-foreground px-4 pt-2.5 pb-4 text-background sm:px-6 dark:border-b dark:border-border dark:bg-card dark:text-foreground">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <Link
            href={`/distributions/${distributionId}`}
            className="-ml-2 inline-flex h-11 items-center gap-1.5 rounded-lg px-2 text-base font-semibold hover:bg-current/10"
          >
            <X aria-hidden="true" className="size-5" />
            Quitter
          </Link>
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-accent px-3 text-sm font-bold text-accent-foreground">
            <span aria-hidden="true" className="size-2 rounded-full bg-accent-foreground" />
            {close ? "Clos" : "Jour J"}
          </span>
        </div>
        <div className="mx-auto flex w-full max-w-3xl items-end justify-between gap-3">
          <div>
            <p className="text-sm opacity-75">{jour}</p>
            <p aria-live="polite" className="flex items-baseline gap-2">
              <span className="font-display text-5xl leading-none font-extrabold tabular-nums">{presents}</span>
              <span className="text-lg opacity-80">
                présent{presents > 1 ? "s" : ""} sur {beneficiaires.length}
              </span>
            </p>
          </div>
          <p className="font-mono text-sm opacity-80 tabular-nums">
            {equipePresente} bénévole{equipePresente > 1 ? "s" : ""}
          </p>
        </div>
        <div aria-hidden="true" className="mx-auto h-2 w-full max-w-3xl overflow-hidden rounded-full bg-current/20">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200 motion-reduce:transition-none"
            style={{ width: `${beneficiaires.length ? (presents / beneficiaires.length) * 100 : 0}%` }}
          />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-4 pt-3 pb-28 sm:px-6">
        {close && (
          <Alert variant="info" role="status">
            Distribution close : les non-pointés comptent absents. Vous pouvez encore corriger un pointage.
          </Alert>
        )}
        {!enLigne && (
          <Alert variant="warning" role="status">
            <CloudOff aria-hidden="true" />
            Connexion perdue. Continuez à pointer : tout partira au retour du réseau, tant que cette page reste ouverte.
          </Alert>
        )}

        <div className="flex flex-col gap-3 py-1">
          <SearchField label="Rechercher un inscrit" placeholder="Nom ou prénom" value={recherche} onValueChange={setRecherche} size="lg" />
          <SegmentedControl
            label="Personnes à afficher"
            className="w-full [&>button]:flex-1 [&>button]:justify-center"
            value={vue}
            onValueChange={setVue}
            options={[
              { value: "a-pointer", label: "À pointer", count: aPointer.length },
              { value: "pointes", label: "Pointés", count: pointes.length },
              { value: "equipe", label: "Équipe", count: equipe.length + listeVisiteurs.length },
            ]}
          />
          {enAttente > 0 && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CloudOff aria-hidden="true" className="size-4" />
              {enAttente} en attente d&apos;envoi
            </p>
          )}
        </div>

        {vue === "equipe" && peutGerer && (
          <AjoutEquipe
            distributionId={distributionId}
            onBenevoleAjoute={() => client.invalidateQueries({ queryKey: cleListe })}
            onVisiteurAjoute={(visiteur) =>
              client.setQueryData<PointageAdHocResponse[]>(["pointage-visiteurs", distributionId], (prev) => [...(prev ?? []), visiteur])
            }
          />
        )}

        {liste.isPending ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : liste.isError && !liste.data ? (
          <Alert variant="destructive">{messageErreur(liste.error, "La liste n'a pas pu être chargée. Réessayez dans un instant.")}</Alert>
        ) : visibles.length === 0 ? (
          <p className="rounded-xl bg-muted px-5 py-8 text-center text-base text-muted-foreground">
            {recherche.trim()
              ? `Personne ne correspond à "${recherche.trim()}" ici.`
              : vue === "a-pointer"
                ? "Tout le monde est pointé."
                : vue === "pointes"
                  ? "Personne n'est encore pointé."
                  : "Aucun bénévole inscrit."}
          </p>
        ) : (
          groupes.map((g) => (
            <section key={g.cle} aria-label={g.debut ? `Créneau ${horaire(g.debut, g.fin)}` : "Sans créneau"} className="flex flex-col gap-2">
              {(groupes.length > 1 || g.debut) && (
                <h2 className="flex items-center justify-between px-0.5 pt-1 font-mono text-sm font-semibold text-foreground">
                  <span className="flex items-center gap-2">
                    {g.courant && <span className="rounded-sm bg-accent px-1.5 text-accent-foreground">Maintenant</span>}
                    {g.debut ? horaire(g.debut, g.fin) : "Sans créneau"}
                  </span>
                  <span className="font-normal text-muted-foreground">
                    {g.lignes.length} {vue === "a-pointer" ? "attendu" : "personne"}
                    {g.lignes.length > 1 ? "s" : ""}
                  </span>
                </h2>
              )}
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {g.lignes.map((l) => (
                  <LigneJourJ key={l.inscriptionId} ligne={l} onPointer={(p) => pointerLigne(l, p)} />
                ))}
              </ul>
            </section>
          ))
        )}

        {vue === "equipe" && listeVisiteurs.length > 0 && <Visiteurs distributionId={distributionId} visiteurs={listeVisiteurs} />}

        {peutGerer && !close && <ClotureJourJ distributionId={distributionId} nonPointes={aPointer.length} />}
      </div>
    </div>
  );
}

function EtatEnvoi({ ligne, onReessayer }: { ligne: LignePointage; onReessayer: () => void }) {
  if (ligne.etat === "envoi") {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <Spinner size="sm" className="size-3" /> Envoi
      </span>
    );
  }
  if (ligne.etat === "attente") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-warning">
        <CloudOff aria-hidden="true" className="size-4" /> En attente d&apos;envoi
      </span>
    );
  }
  if (ligne.etat === "echec") {
    return (
      <button
        type="button"
        onClick={onReessayer}
        className="inline-flex min-h-9 w-fit items-center gap-1 rounded-full border border-destructive/40 px-3 text-sm font-semibold text-destructive"
      >
        <AlertTriangle aria-hidden="true" className="size-4" /> Échec, réessayer
        <RotateCcw aria-hidden="true" className="size-3.5" />
      </button>
    );
  }
  return null;
}

/*
 * Toucher la ligne marque present : c'est le geste du jour J. "Absent" et le
 * retour a "a pointer" passent par le menu, puisque les non-pointes deviennent
 * absents a la cloture (RG4).
 */
function LigneJourJ({ ligne, onPointer }: { ligne: LignePointage; onPointer: (presence: PresencePointee) => void }) {
  const present = ligne.presence === "PRESENT";
  const absent = ligne.presence === "ABSENT";
  const nom = `${ligne.prenom} ${ligne.nom}`;
  const actions = [
    ...(absent ? [] : [{ label: "Marquer absent", icon: UserX, onClick: () => onPointer("ABSENT") }]),
    ...(ligne.presence === "NON_POINTE" ? [] : [{ label: "Remettre à pointer", icon: Undo2, onClick: () => onPointer("NON_POINTE") }]),
  ];

  return (
    <li className={cn("flex items-center", present && "bg-secondary")}>
      <button
        type="button"
        aria-pressed={present}
        aria-label={`Marquer ${nom} présent`}
        onClick={() => !present && onPointer("PRESENT")}
        className="flex min-h-15 min-w-0 flex-1 items-center gap-3 py-2 pr-2 pl-4 text-left focus-visible:-outline-offset-2"
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full border-2",
            present ? "border-primary bg-primary text-primary-foreground" : "border-input",
          )}
        >
          {present && <Check className="size-5" strokeWidth={3} />}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-lg font-semibold text-foreground">
            {ligne.nom} {ligne.prenom}
          </span>
          {absent && !ligne.etat && <span className="text-sm text-muted-foreground">Absent</span>}
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-1 pr-2">
        <EtatEnvoi ligne={ligne} onReessayer={() => ligne.derniereDemande && onPointer(ligne.derniereDemande)} />
        <ActionMenu items={actions} label={`Plus d'actions pour ${nom}`} className="border-transparent bg-transparent text-muted-foreground" />
      </div>
    </li>
  );
}
