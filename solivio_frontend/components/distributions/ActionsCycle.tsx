"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardCheck, Copy, Flag, Pencil, RotateCcw, Send, Trash2, Undo2, XCircle } from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/action-menu";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { FeuilleAnnulation } from "@/components/shared/FeuilleAnnulation";
import {
  annulerDemarrageDistribution,
  annulerDistribution,
  demarrerDistribution,
  publierDistribution,
  reactiverDistribution,
  supprimerDistribution,
  terminerDistribution,
} from "@/lib/api/distributions";
import { actionsCycle, type ActionCycle } from "@/lib/cycle-distribution";
import { messageErreur } from "@/lib/erreurs";
import type { StatutDistribution } from "@/types/distribution";

interface Props {
  distributionId: string;
  statut: StatutDistribution;
  date: string;
  aujourdhui: string;
  /* Personnes inscrites ou en attente, prevenues en cas d'annulation (RG6). */
  nbInscrits: number;
}

type Confirmation = "terminer" | "supprimer" | "reactiver" | null;

function ActionVisible({ element, desactivee }: { element: ActionMenuItem; desactivee: boolean }) {
  const Icone = element.icon;
  const contenu = (
    <>
      {Icone && <Icone aria-hidden="true" />}
      {element.label}
    </>
  );
  if (element.href) {
    return (
      <Link href={element.href} className={buttonVariants({ variant: "outline", size: "lg" })}>
        {contenu}
      </Link>
    );
  }
  return (
    <Button size="lg" variant="outline" disabled={desactivee} onClick={element.onClick}>
      {contenu}
    </Button>
  );
}

/* Actions du cycle de vie d'une distribution : l'etape suivante en avant, le reste dans "Plus". */
export function ActionsCycle({ distributionId, statut, date, aujourdhui, nbInscrits }: Props) {
  const router = useRouter();
  const cycle = actionsCycle({ statut, date }, aujourdhui);
  const { principale } = cycle;
  // Sans etape a franchir, la premiere action courante reste visible plutot qu'un menu seul.
  const secondaire =
    cycle.secondaire ?? (principale ? null : (cycle.menu.find((a) => a === "modifier" || a === "reactiver") ?? null));
  const menu = cycle.menu.filter((a) => a !== secondaire);
  const [enCours, setEnCours] = useState<ActionCycle | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [annulation, setAnnulation] = useState(false);
  const pointage = `/distributions/${distributionId}/pointage`;

  async function executer(action: ActionCycle, appel: () => Promise<unknown>, apres?: () => void) {
    setEnCours(action);
    setErreur(null);
    try {
      await appel();
      setConfirmation(null);
      setAnnulation(false);
      if (apres) apres();
      else router.refresh();
    } catch (e) {
      setErreur(messageErreur(e, "L'action n'a pas pu aboutir. Réessayez dans un instant."));
    } finally {
      setEnCours(null);
    }
  }

  const ELEMENTS: Record<ActionCycle, ActionMenuItem> = {
    publier: { label: "Publier", icon: Send },
    "ouvrir-jour-j": { label: "Ouvrir le jour J", icon: ClipboardCheck, href: pointage },
    demarrer: { label: "Ouvrir le jour J", icon: ClipboardCheck },
    terminer: { label: "Clore et voir le bilan", icon: Flag, onClick: () => setConfirmation("terminer") },
    modifier: { label: "Modifier", icon: Pencil, href: `/distributions/${distributionId}/modifier` },
    dupliquer: { label: "Dupliquer", icon: Copy, href: `/distributions/nouvelle?depuis=${distributionId}` },
    "annuler-demarrage": {
      label: "Annuler le démarrage",
      icon: Undo2,
      onClick: () => executer("annuler-demarrage", () => annulerDemarrageDistribution(distributionId)),
    },
    reactiver: { label: "Réactiver", icon: RotateCcw, onClick: () => setConfirmation("reactiver") },
    supprimer: { label: "Supprimer le brouillon", icon: Trash2, destructive: true, onClick: () => setConfirmation("supprimer") },
    annuler: { label: "Annuler la distribution", icon: XCircle, destructive: true, onClick: () => setAnnulation(true) },
  };

  function actionPrincipale() {
    if (principale === "publier") {
      executer("publier", () => publierDistribution(distributionId), () => {
        toast.success("Distribution publiée : les inscriptions sont ouvertes.");
        router.refresh();
      });
    } else if (principale === "demarrer") {
      // Demarrer ouvre le pointage : c'est le geste du jour J.
      executer("demarrer", () => demarrerDistribution(distributionId), () => router.push(pointage));
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        {principale &&
          (principale === "ouvrir-jour-j" ? (
            <Link href={pointage} className={buttonVariants({ variant: "accent", size: "lg" })}>
              <ClipboardCheck aria-hidden="true" />
              Ouvrir le jour J
            </Link>
          ) : (
            <Button
              size="lg"
              variant={principale === "demarrer" ? "accent" : "default"}
              disabled={enCours !== null}
              onClick={actionPrincipale}
            >
              {enCours === principale ? <Spinner size="sm" /> : principale === "publier" ? <Send aria-hidden="true" /> : <ClipboardCheck aria-hidden="true" />}
              {ELEMENTS[principale].label}
            </Button>
          ))}
        {secondaire && <ActionVisible element={ELEMENTS[secondaire]} desactivee={enCours !== null} />}
        {menu.length > 0 && (
          <ActionMenu items={menu.map((a) => ELEMENTS[a])} label="Plus d'actions sur la distribution" size="default" />
        )}
      </div>
      {erreur && !annulation && confirmation === null && <Alert variant="destructive">{erreur}</Alert>}

      <Dialog open={confirmation !== null} onOpenChange={(ouvert) => !ouvert && setConfirmation(null)}>
        <DialogContent showCloseButton>
          {confirmation === "terminer" && (
            <DialogHeader>
              <DialogTitle>Clore la distribution</DialogTitle>
              <DialogDescription>
                Les personnes inscrites qui n&apos;ont pas été pointées seront comptées absentes. Le bilan devient
                disponible.
              </DialogDescription>
            </DialogHeader>
          )}
          {confirmation === "supprimer" && (
            <DialogHeader>
              <DialogTitle>Supprimer le brouillon</DialogTitle>
              <DialogDescription>
                Ce brouillon et ses créneaux seront supprimés définitivement. Personne n&apos;y est inscrit.
              </DialogDescription>
            </DialogHeader>
          )}
          {confirmation === "reactiver" && (
            <DialogHeader>
              <DialogTitle>Réactiver la distribution</DialogTitle>
              <DialogDescription>
                Elle retrouve son état d&apos;avant l&apos;annulation. Les inscriptions sont rétablies, sauf pour les
                personnes inscrites entre-temps à une autre distribution de la semaine. Chacun est prévenu par email.
              </DialogDescription>
            </DialogHeader>
          )}
          {erreur && <Alert variant="destructive">{erreur}</Alert>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmation(null)}>
              Retour
            </Button>
            {confirmation === "terminer" && (
              <Button disabled={enCours !== null} onClick={() =>
                  executer("terminer", () => terminerDistribution(distributionId), () => {
                    router.push(`/distributions/${distributionId}?onglet=bilan`);
                    router.refresh();
                  })
                }
              >
                {enCours === "terminer" && <Spinner size="sm" />}
                Clore la distribution
              </Button>
            )}
            {confirmation === "supprimer" && (
              <Button
                variant="destructive-solid"
                disabled={enCours !== null}
                onClick={() =>
                  executer("supprimer", () => supprimerDistribution(distributionId), () => {
                    router.push("/distributions");
                    router.refresh();
                  })
                }
              >
                {enCours === "supprimer" && <Spinner size="sm" />}
                Supprimer
              </Button>
            )}
            {confirmation === "reactiver" && (
              <Button disabled={enCours !== null} onClick={() => executer("reactiver", () => reactiverDistribution(distributionId))}>
                {enCours === "reactiver" && <Spinner size="sm" />}
                Réactiver
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FeuilleAnnulation
        ouvert={annulation}
        onOpenChange={setAnnulation}
        objet="la distribution"
        consequence={
          nbInscrits > 0
            ? `Les ${nbInscrits} personnes inscrites ou en attente seront prévenues par email, avec le motif.`
            : "Personne n'est encore inscrit. Le motif reste visible sur la distribution."
        }
        exemple="livraison de denrées reportée."
        aide={
          <>
            Une annulation par erreur se rattrape tant que la date n&apos;est pas passée : &quot;Réactiver&quot; rétablit les
            inscriptions.
          </>
        }
        onConfirmer={async (motif) => {
          await annulerDistribution(distributionId, motif);
          router.refresh();
        }}
      />
    </div>
  );
}
