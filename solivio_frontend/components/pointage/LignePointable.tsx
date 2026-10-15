"use client";

import { memo } from "react";
import { AlertTriangle, Check, CloudOff, RotateCcw, Undo2, UserX } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { Spinner } from "@/components/ui/spinner";
import type { EtatEnvoi, PresencePointee } from "@/lib/pointage";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  /* Nom affiche, dans l'ordre de la liste ("Dupont Marie"). */
  titre: string;
  /* Nom dit aux lecteurs d'ecran ("Marie Dupont"). */
  nom: string;
  presence: PresencePointee;
  etat?: EtatEnvoi;
  /* Presence du dernier envoi, renvoyee par "Reessayer". */
  derniereDemande?: PresencePointee | null;
  /* Stable d'un rendu a l'autre : seule la ligne qui change se redessine. */
  onPointer: (id: string, presence: PresencePointee) => void;
}

function Envoi({ etat, onReessayer }: { etat: EtatEnvoi; onReessayer?: () => void }) {
  if (etat === "envoi") {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <Spinner size="sm" className="size-3" /> Envoi
      </span>
    );
  }
  if (etat === "attente") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-warning">
        <CloudOff aria-hidden="true" className="size-4" /> En attente d&apos;envoi
      </span>
    );
  }
  if (etat === "echec") {
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
 * Toucher la ligne marque present : c'est le geste du pointage. "Absent" et le
 * retour a "a pointer" passent par le menu, puisque les non-pointes deviennent
 * absents a la cloture (RG4).
 */
export const LignePointable = memo(function LignePointable({ id, titre, nom, presence, etat = null, derniereDemande = null, onPointer }: Props) {
  const present = presence === "PRESENT";
  const absent = presence === "ABSENT";
  const actions = [
    ...(absent ? [] : [{ label: "Marquer absent", icon: UserX, onClick: () => onPointer(id, "ABSENT") }]),
    ...(presence === "NON_POINTE" ? [] : [{ label: "Remettre à pointer", icon: Undo2, onClick: () => onPointer(id, "NON_POINTE") }]),
  ];

  return (
    <li className={cn("flex items-center", present && "bg-secondary")}>
      <button
        type="button"
        aria-pressed={present}
        aria-label={`Marquer ${nom} présent`}
        onClick={() => !present && onPointer(id, "PRESENT")}
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
          <span className="truncate text-lg font-semibold text-foreground">{titre}</span>
          {absent && !etat && <span className="text-sm text-muted-foreground">Absent</span>}
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-1 pr-2">
        <Envoi etat={etat} onReessayer={() => derniereDemande && onPointer(id, derniereDemande)} />
        <ActionMenu items={actions} label={`Plus d'actions pour ${nom}`} className="border-transparent bg-transparent text-muted-foreground" />
      </div>
    </li>
  );
});
