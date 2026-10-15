"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { inscrire } from "@/lib/api/distributions";
import { messageErreur } from "@/lib/erreurs";
import { cn } from "@/lib/utils";
import type { CreneauResponse, ModeCreneauDistribution, TypeInscription } from "@/types/distribution";

interface Props {
  distributionId: string;
  creneaux: CreneauResponse[];
  modeCreneau: ModeCreneauDistribution;
  type: TypeInscription;
  /* Places restantes pour ce type sur la distribution, null sans limite. */
  placesRestantes: number | null;
}

const heure = (h: string) => h.slice(0, 5);

function placesCreneau(c: CreneauResponse): string {
  if (c.placesRestantes <= 0) return "complet";
  return c.placesRestantes === 1 ? "1 place" : `${c.placesRestantes} places`;
}

/*
 * Reservation d'une place : choix de l'horaire si la distribution est decoupee,
 * puis un seul bouton. Complet n'est pas une impasse : on rejoint la liste d'attente.
 */
export function ReservationDistribution({ distributionId, creneaux, modeCreneau, type, placesRestantes }: Props) {
  const router = useRouter();
  const choixHoraire = modeCreneau === "CRENEAUX_DECOUPES" && creneaux.length > 1;
  // Places par creneau : elles ne concernent que les beneficiaires.
  const avecPlacesCreneau = type === "BENEFICIAIRE";
  const [creneauId, setCreneauId] = useState<string | null>(
    choixHoraire ? null : (creneaux[0]?.id ?? null),
  );
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [limiteSemaine, setLimiteSemaine] = useState(false);

  const creneau = creneaux.find((c) => c.id === creneauId);
  const complet =
    placesRestantes !== null &&
    (placesRestantes <= 0 || (avecPlacesCreneau && choixHoraire && creneau !== undefined && creneau.placesRestantes <= 0));

  let libelle = type === "BENEVOLE" ? "Je viens aider" : "Réserver ma place";
  if (complet) libelle = "Rejoindre la liste d'attente";
  else if (choixHoraire && creneau) libelle = `${type === "BENEVOLE" ? "Venir" : "Réserver"} à ${heure(creneau.heureDebut)}`;

  async function reserver() {
    if (choixHoraire && !creneauId) {
      setErreur("Choisissez d'abord votre horaire.");
      return;
    }
    setEnCours(true);
    setErreur(null);
    setLimiteSemaine(false);
    try {
      const inscription = await inscrire(distributionId, type, creneauId ?? undefined);
      toast.success(
        inscription.statut === "LISTE_ATTENTE"
          ? `Vous êtes sur la liste d'attente, rang ${inscription.rangListeAttente ?? "?"}. Un email vous prévient si une place se libère.`
          : "C'est réservé. Un email de confirmation vous a été envoyé.",
      );
      router.refresh();
    } catch (e) {
      if ((e as { code?: string }).code === "FREQUENCY_LIMIT") setLimiteSemaine(true);
      else setErreur(messageErreur(e, "L'inscription n'a pas pu aboutir. Réessayez dans un instant."));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {choixHoraire && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-display text-xl font-bold text-foreground">Choisissez votre horaire</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {creneaux.map((c) => {
              const plein = avecPlacesCreneau && c.placesRestantes <= 0;
              return (
                <label
                  key={c.id}
                  className={cn(
                    "flex min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border bg-card px-2 py-2",
                    "has-checked:border-2 has-checked:border-primary has-checked:bg-secondary",
                    "has-focus-visible:ring-3 has-focus-visible:ring-ring/40",
                    "border-input hover:bg-muted",
                  )}
                >
                  <input
                    type="radio"
                    name="creneau"
                    value={c.id}
                    checked={creneauId === c.id}
                    onChange={() => {
                      setCreneauId(c.id);
                      setErreur(null);
                    }}
                    className="sr-only"
                  />
                  <span className="text-base font-bold tabular-nums text-foreground">{heure(c.heureDebut)}</span>
                  {avecPlacesCreneau && (
                    <span className={cn("text-sm", plein ? "text-warning" : "text-muted-foreground")}>
                      {placesCreneau(c)}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {complet && (
        <p className="text-base text-muted-foreground">
          {choixHoraire && creneau && placesRestantes !== null && placesRestantes > 0
            ? "Cet horaire est complet. Inscrivez-vous en liste d'attente, ou choisissez un autre horaire."
            : "Il n'y a plus de place pour le moment. En liste d'attente, un email vous prévient dès qu'une place se libère."}
        </p>
      )}

      {limiteSemaine && (
        <Alert variant="info">
          <CalendarCheck aria-hidden="true" />
          <AlertTitle>Vous avez déjà une distribution cette semaine</AlertTitle>
          <AlertDescription>
            Pour que chacun ait sa place, l&apos;association limite les inscriptions par semaine. Vous
            pourrez réserver pour la semaine suivante.
          </AlertDescription>
        </Alert>
      )}
      {erreur && <Alert variant="destructive">{erreur}</Alert>}

      <div className="flex flex-col gap-2">
        <Button size="lg" className="w-full sm:w-auto sm:self-start" onClick={reserver} disabled={enCours}>
          {enCours && <Spinner size="sm" />}
          {libelle}
        </Button>
        <p className="text-sm text-muted-foreground">Confirmation par email. Annulable à tout moment.</p>
      </div>
    </div>
  );
}
