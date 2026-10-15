"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { MutationObserver, useMutationState, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CloudOff } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Spinner } from "@/components/ui/spinner";
import { AjoutEquipe } from "@/components/pointage/AjoutEquipe";
import { EnteteJourJ } from "@/components/pointage/EnteteJourJ";
import { LignePointable } from "@/components/pointage/LignePointable";
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

  // Lu au geste seulement : le rappel reste stable et les lignes non touchees ne se redessinent pas.
  const lignesParId = useRef(new Map<string, LignePointage>());
  useEffect(() => {
    lignesParId.current = new Map(lignes.map((l) => [l.inscriptionId, l]));
  }, [lignes]);

  const pointerLigne = useCallback(
    (inscriptionId: string, presence: PresencePointee) => {
      const ligne = lignesParId.current.get(inscriptionId);
      envoyerPointage(client, distributionId, inscriptionId, presence);
      if (presence !== "PRESENT" || !ligne) return;
      const precedente = ligne.presence as PresencePointee;
      toast(`Présence notée : ${ligne.prenom} ${ligne.nom}`, {
        action: { label: "Annuler", onClick: () => envoyerPointage(client, distributionId, inscriptionId, precedente) },
      });
    },
    [client, distributionId],
  );

  return (
    <div className="flex min-h-full flex-col">
      <EnteteJourJ
        quitter={`/distributions/${distributionId}`}
        pastille={close ? "Clos" : "Jour J"}
        intitule={jour}
        presents={presents}
        attendus={beneficiaires.length}
        complement={`${equipePresente} bénévole${equipePresente > 1 ? "s" : ""}`}
      />

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
                  <LignePointable
                    key={l.inscriptionId}
                    id={l.inscriptionId}
                    titre={`${l.nom} ${l.prenom}`}
                    nom={`${l.prenom} ${l.nom}`}
                    presence={l.presence as PresencePointee}
                    etat={l.etat}
                    derniereDemande={l.derniereDemande}
                    onPointer={pointerLigne}
                  />
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
