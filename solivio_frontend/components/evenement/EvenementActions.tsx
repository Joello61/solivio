"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  publierEvenement,
  annulerEvenement,
  sInscrire,
  seDesinscrire,
} from "@/lib/api/evenement";
import type { StatutEvenement, RoleParticipation, ModeInscription } from "@/types/evenement";

interface Props {
  evenementId: string;
  statut: StatutEvenement;
  aBesoiNStaff: boolean;
  ouvertParticipants: boolean;
  modeInscription: ModeInscription;
  estGestionnaire: boolean;
  estBenevole: boolean;
  estBeneficiaire: boolean;
  dejaInscrit: boolean;
}

export function EvenementActions({
  evenementId,
  statut,
  aBesoiNStaff,
  ouvertParticipants,
  modeInscription,
  estGestionnaire,
  estBenevole,
  estBeneficiaire,
  dejaInscrit,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [raisonAnnulation, setRaisonAnnulation] = useState("");
  const [showAnnuler, setShowAnnuler] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function executer(action: string, fn: () => Promise<unknown>) {
    setPending(action);
    setErreur(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPending(null);
    }
  }

  const peutPublier = estGestionnaire && statut === "BROUILLON";
  const peutAnnuler =
    estGestionnaire && (statut === "BROUILLON" || statut === "PUBLIE" || statut === "EN_COURS");
  const peutInscrireStaff =
    !dejaInscrit && estBenevole && aBesoiNStaff && (statut === "PUBLIE" || statut === "EN_COURS");
  const peutInscrireParticipant =
    !dejaInscrit &&
    (estBenevole || estBeneficiaire) &&
    ouvertParticipants &&
    (statut === "PUBLIE" || statut === "EN_COURS");
  const peutSeDesinscrire = dejaInscrit && (statut === "PUBLIE" || statut === "EN_COURS");
  const peutPointer =
    estGestionnaire && modeInscription === "OBLIGATOIRE" && statut !== "BROUILLON";

  if (!peutPublier && !peutAnnuler && !peutInscrireStaff && !peutInscrireParticipant && !peutSeDesinscrire && !peutPointer) {
    return null;
  }

  async function confirmerAnnulation() {
    if (!raisonAnnulation.trim()) return;
    await executer("annuler", () => annulerEvenement(evenementId, raisonAnnulation));
    setShowAnnuler(false);
  }

  function inscrire(role: RoleParticipation) {
    executer("inscrire-" + role, () => sInscrire(evenementId, role));
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-6 space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Actions</h2>

      {erreur && (
        <p className="rounded-xl bg-destructive/8 border border-destructive/20 px-3 py-2 text-sm text-destructive">
          {erreur}
        </p>
      )}

      {peutPublier && (
        <button
          onClick={() => executer("publier", () => publierEvenement(evenementId))}
          disabled={pending !== null}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {pending === "publier" ? "Publication..." : "Publier"}
        </button>
      )}

      {peutPointer && (
        <button
          onClick={() => router.push(`/evenements/${evenementId}/pointage`)}
          className="w-full rounded-xl bg-info px-4 py-2.5 text-sm font-medium text-info-foreground hover:bg-info/90 transition-colors"
        >
          Pointage
        </button>
      )}

      {peutInscrireStaff && (
        <button
          onClick={() => inscrire("STAFF")}
          disabled={pending !== null}
          className="w-full rounded-xl bg-warning px-4 py-2.5 text-sm font-medium text-warning-foreground hover:bg-warning/90 transition-colors disabled:opacity-60"
        >
          {pending === "inscrire-STAFF" ? "Inscription..." : "S'inscrire comme staff"}
        </button>
      )}

      {peutInscrireParticipant && (
        <button
          onClick={() => inscrire("PARTICIPANT")}
          disabled={pending !== null}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {pending === "inscrire-PARTICIPANT" ? "Inscription..." : "S'inscrire comme participant"}
        </button>
      )}

      {peutSeDesinscrire && (
        <button
          onClick={() => executer("desinscrire", () => seDesinscrire(evenementId))}
          disabled={pending !== null}
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-60"
        >
          {pending === "desinscrire" ? "Desinscription..." : "Se désinscrire"}
        </button>
      )}

      {peutAnnuler && !showAnnuler && (
        <button
          onClick={() => setShowAnnuler(true)}
          className="w-full rounded-xl border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
        >
          Annuler l&apos;événement
        </button>
      )}

      {showAnnuler && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Raison de l'annulation"
            value={raisonAnnulation}
            onChange={(e) => setRaisonAnnulation(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/40"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowAnnuler(false)}
              className="flex-1 rounded-xl border border-border px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              Retour
            </button>
            <button
              onClick={confirmerAnnulation}
              disabled={!raisonAnnulation.trim() || pending !== null}
              className="flex-1 rounded-xl bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-60"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
