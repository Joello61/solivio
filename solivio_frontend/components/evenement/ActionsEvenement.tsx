"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardCheck, Pencil, Send, XCircle } from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/action-menu";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FeuilleAnnulation } from "@/components/shared/FeuilleAnnulation";
import { annulerEvenement, publierEvenement } from "@/lib/api/evenement";
import { messageErreur } from "@/lib/erreurs";
import type { ModeInscription, StatutEvenement } from "@/types/evenement";

interface Props {
  evenementId: string;
  statut: StatutEvenement;
  modeInscription: ModeInscription;
  /* Publier, modifier et annuler sont reserves aux responsables (backend). */
  estResponsable: boolean;
  nbInscrits: number;
}

/* Le cycle d'un evenement : l'etape suivante en avant, le reste dans "Plus". */
export function ActionsEvenement({ evenementId, statut, modeInscription, estResponsable, nbInscrits }: Props) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [annulation, setAnnulation] = useState(false);
  const pointage = `/evenements/${evenementId}/pointage`;
  // Le pointage n'existe qu'avec une inscription obligatoire.
  const avecPointage = modeInscription === "OBLIGATOIRE" && statut !== "BROUILLON" && statut !== "ANNULE";

  async function publier() {
    setEnCours(true);
    setErreur(null);
    try {
      await publierEvenement(evenementId);
      toast.success("Événement publié : les inscriptions sont ouvertes.");
      router.refresh();
    } catch (e) {
      setErreur(messageErreur(e, "La publication n'a pas abouti. Réessayez dans un instant."));
    } finally {
      setEnCours(false);
    }
  }

  const menu: ActionMenuItem[] = [];
  if (estResponsable && statut === "BROUILLON") menu.push({ label: "Modifier", icon: Pencil, href: `/evenements/${evenementId}/modifier` });
  if (avecPointage && statut !== "EN_COURS") menu.push({ label: "Ouvrir le pointage", icon: ClipboardCheck, href: pointage });
  if (estResponsable && (statut === "BROUILLON" || statut === "PUBLIE" || statut === "EN_COURS")) {
    menu.push({ label: "Annuler l'événement", icon: XCircle, destructive: true, onClick: () => setAnnulation(true) });
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        {estResponsable && statut === "BROUILLON" && (
          <Button size="lg" disabled={enCours} onClick={publier}>
            {enCours ? <Spinner size="sm" /> : <Send aria-hidden="true" />}
            Publier
          </Button>
        )}
        {avecPointage && statut === "EN_COURS" && (
          <Link href={pointage} className={buttonVariants({ variant: "accent", size: "lg" })}>
            <ClipboardCheck aria-hidden="true" />
            Ouvrir le pointage
          </Link>
        )}
        {menu.length > 0 && <ActionMenu items={menu} label="Plus d'actions sur l'événement" />}
      </div>
      {erreur && <Alert variant="destructive">{erreur}</Alert>}
      <FeuilleAnnulation
        ouvert={annulation}
        onOpenChange={setAnnulation}
        objet="l'événement"
        consequence={
          nbInscrits > 0
            ? `Les ${nbInscrits} personnes inscrites seront prévenues, avec le motif.`
            : "Personne n'est encore inscrit. Le motif reste visible sur l'événement."
        }
        exemple="salle indisponible ce jour-là."
        onConfirmer={async (motif) => {
          await annulerEvenement(evenementId, motif);
          router.refresh();
        }}
      />
    </div>
  );
}
