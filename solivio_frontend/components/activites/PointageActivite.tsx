"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { EnteteJourJ } from "@/components/pointage/EnteteJourJ";
import { LignePointable } from "@/components/pointage/LignePointable";
import type { EtatEnvoi, PresencePointee } from "@/lib/pointage";

export interface PersonnePointable {
  id: string;
  /* Nom complet tel que le renvoie l'API ("Dupont Marie"). */
  nomComplet: string;
  presence: PresencePointee;
  /* Groupe affiche : "Équipe", "Participants". */
  groupe?: string;
}

interface Props {
  quitter: string;
  intitule: string;
  personnes: PersonnePointable[];
  pointer: (id: string, presence: PresencePointee) => Promise<unknown>;
}

type Vue = "a-pointer" | "pointes";

const normaliser = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr");

/*
 * Pointage d'un evenement ou d'une session, sur le modele du jour J sans
 * creneaux : la ligne change tout de suite, et revient en arriere si le
 * serveur refuse.
 */
export function PointageActivite({ quitter, intitule, personnes: initiales, pointer }: Props) {
  const [personnes, setPersonnes] = useState(initiales);
  const [etats, setEtats] = useState<Record<string, { etat: EtatEnvoi; demande: PresencePointee }>>({});
  const [recherche, setRecherche] = useState("");
  const [vue, setVue] = useState<Vue>("a-pointer");

  async function pointerPersonne(p: PersonnePointable, presence: PresencePointee, annulation = false) {
    const precedente = p.presence;
    setPersonnes((liste) => liste.map((x) => (x.id === p.id ? { ...x, presence } : x)));
    setEtats((e) => ({ ...e, [p.id]: { etat: "envoi", demande: presence } }));
    if (presence === "PRESENT" && !annulation) {
      toast(`Présence notée : ${p.nomComplet}`, {
        action: { label: "Annuler", onClick: () => pointerPersonne({ ...p, presence }, precedente, true) },
      });
    }
    try {
      await pointer(p.id, presence);
      setEtats((e) => ({ ...e, [p.id]: { etat: null, demande: presence } }));
    } catch {
      setPersonnes((liste) => liste.map((x) => (x.id === p.id ? { ...x, presence: precedente } : x)));
      setEtats((e) => ({ ...e, [p.id]: { etat: "echec", demande: presence } }));
    }
  }

  const presents = personnes.filter((p) => p.presence === "PRESENT").length;
  const aPointer = personnes.filter((p) => p.presence === "NON_POINTE");
  const pointes = personnes.filter((p) => p.presence !== "NON_POINTE");
  const terme = normaliser(recherche.trim());
  const visibles = (vue === "a-pointer" ? aPointer : pointes)
    .filter((p) => !terme || normaliser(p.nomComplet).includes(terme))
    .sort((a, b) => a.nomComplet.localeCompare(b.nomComplet, "fr", { sensitivity: "base" }));
  const groupes = [...new Set(visibles.map((p) => p.groupe ?? ""))];

  return (
    <div className="flex min-h-full flex-col">
      <EnteteJourJ quitter={quitter} pastille="Pointage" intitule={intitule} presents={presents} attendus={personnes.length} />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-4 pt-3 pb-28 sm:px-6">
        <SearchField label="Rechercher une personne" placeholder="Nom ou prénom" value={recherche} onValueChange={setRecherche} size="lg" />
        <SegmentedControl
          label="Personnes à afficher"
          className="w-full [&>button]:flex-1 [&>button]:justify-center"
          value={vue}
          onValueChange={setVue}
          options={[
            { value: "a-pointer", label: "À pointer", count: aPointer.length },
            { value: "pointes", label: "Pointés", count: pointes.length },
          ]}
        />
        {visibles.length === 0 ? (
          <p className="rounded-xl bg-muted px-5 py-8 text-center text-base text-muted-foreground">
            {terme ? `Personne ne correspond à "${recherche.trim()}" ici.` : vue === "a-pointer" ? "Tout le monde est pointé." : "Personne n'est encore pointé."}
          </p>
        ) : (
          groupes.map((g) => (
            <section key={g} aria-label={g || undefined} className="flex flex-col gap-2">
              {g && groupes.length > 1 && <h2 className="px-0.5 pt-1 font-mono text-sm font-semibold text-foreground">{g}</h2>}
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {visibles
                  .filter((p) => (p.groupe ?? "") === g)
                  .map((p) => (
                    <LignePointable
                      key={p.id}
                      titre={p.nomComplet}
                      nom={p.nomComplet}
                      presence={p.presence}
                      etat={etats[p.id]?.etat ?? null}
                      onPointer={(presence) => pointerPersonne(p, presence)}
                      onReessayer={() => etats[p.id] && pointerPersonne(p, etats[p.id].demande)}
                    />
                  ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
