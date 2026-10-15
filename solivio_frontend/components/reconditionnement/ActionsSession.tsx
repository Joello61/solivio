"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardCheck, Flag, Play, Send, XCircle } from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/action-menu";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FeuilleAnnulation } from "@/components/shared/FeuilleAnnulation";
import { annulerSession, demarrerSession, publierSession, terminerSession } from "@/lib/api/reconditionnement";
import { messageErreur } from "@/lib/erreurs";
import type { StatutSession } from "@/types/reconditionnement";

interface Props {
  sessionId: string;
  statut: StatutSession;
  /* Publier, demarrer, terminer et annuler sont reserves aux responsables (backend). */
  estResponsable: boolean;
  nbInscrits: number;
}

type Etape = "publier" | "demarrer" | "terminer";

const ETAPES: Record<Etape, { libelle: string; icone: typeof Send; appel: (id: string) => Promise<unknown>; succes: string }> = {
  publier: { libelle: "Publier", icone: Send, appel: publierSession, succes: "Session publiée : les inscriptions sont ouvertes." },
  demarrer: { libelle: "Démarrer la session", icone: Play, appel: demarrerSession, succes: "Session démarrée : le pointage est ouvert." },
  terminer: { libelle: "Terminer la session", icone: Flag, appel: terminerSession, succes: "Session terminée." },
};

const SUIVANTE: Partial<Record<StatutSession, Etape>> = { BROUILLON: "publier", PUBLIEE: "demarrer", EN_COURS: "terminer" };

/* Le cycle d'une session : l'etape suivante en avant, le pointage et l'annulation a cote. */
export function ActionsSession({ sessionId, statut, estResponsable, nbInscrits }: Props) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [annulation, setAnnulation] = useState(false);
  const etape = estResponsable ? SUIVANTE[statut] : undefined;
  // Le pointage se fait pendant ou apres la session.
  const pointage = statut === "EN_COURS" || statut === "TERMINEE" ? `/reconditionnement/${sessionId}/pointage` : null;

  async function avancer(e: Etape) {
    setEnCours(true);
    setErreur(null);
    try {
      await ETAPES[e].appel(sessionId);
      toast.success(ETAPES[e].succes);
      router.refresh();
    } catch (err) {
      setErreur(messageErreur(err, "L'action n'a pas abouti. Réessayez dans un instant."));
    } finally {
      setEnCours(false);
    }
  }

  const menu: ActionMenuItem[] = [];
  if (pointage && statut === "TERMINEE") menu.push({ label: "Corriger le pointage", icon: ClipboardCheck, href: pointage });
  if (estResponsable && statut !== "TERMINEE" && statut !== "ANNULEE") {
    menu.push({ label: "Annuler la session", icon: XCircle, destructive: true, onClick: () => setAnnulation(true) });
  }
  const Icone = etape ? ETAPES[etape].icone : null;

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        {pointage && statut === "EN_COURS" && (
          <Link href={pointage} className={buttonVariants({ variant: "accent", size: "lg" })}>
            <ClipboardCheck aria-hidden="true" />
            Ouvrir le pointage
          </Link>
        )}
        {etape && Icone && (
          <Button size="lg" variant={etape === "terminer" ? "outline" : "default"} disabled={enCours} onClick={() => avancer(etape)}>
            {enCours ? <Spinner size="sm" /> : <Icone aria-hidden="true" />}
            {ETAPES[etape].libelle}
          </Button>
        )}
        {menu.length > 0 && <ActionMenu items={menu} label="Plus d'actions sur la session" />}
      </div>
      {erreur && <Alert variant="destructive">{erreur}</Alert>}
      <FeuilleAnnulation
        ouvert={annulation}
        onOpenChange={setAnnulation}
        objet="la session"
        consequence={
          nbInscrits > 0
            ? `Les ${nbInscrits} personnes inscrites seront prévenues par email, avec le motif.`
            : "Personne n'est encore inscrit. Le motif reste visible sur la session."
        }
        exemple="local indisponible ce jour-là."
        onConfirmer={async (motif) => {
          await annulerSession(sessionId, motif);
          router.refresh();
        }}
      />
    </div>
  );
}
