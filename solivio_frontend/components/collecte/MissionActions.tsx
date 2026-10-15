"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Undo2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/action-menu";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { annulerMission, libererMission, prendreEnCharge, validerCollecte, validerDepot } from "@/lib/api/collecte";
import { messageErreur } from "@/lib/erreurs";
import { actionsMission, type Action, type ActionPrincipale, type DroitsMission } from "@/lib/missions";

const LIBELLE_PRINCIPALE: Record<ActionPrincipale, string> = {
  prendre: "Prendre la mission",
  "valider-collecte": "Valider la collecte",
  "valider-depot": "J'ai déposé les denrées",
};

const CONFIRMATION: Partial<Record<Action, string>> = {
  prendre: "Mission prise. Elle apparaît dans vos engagements.",
  "valider-collecte": "Collecte validée.",
  "valider-depot": "Dépôt noté. Merci !",
  liberer: "Mission rendue : elle est de nouveau disponible.",
  annuler: "Mission annulée.",
};

interface Props extends DroitsMission {
  missionId: string;
}

export function MissionActions({ missionId, ...droits }: Props) {
  const router = useRouter();
  const { principale, autres } = actionsMission(droits);
  const [enCours, setEnCours] = useState<Action | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [annulation, setAnnulation] = useState(false);
  const [raison, setRaison] = useState("");

  if (!principale && autres.length === 0) return null;

  async function executer(action: Action, appel: () => Promise<unknown>) {
    setEnCours(action);
    setErreur(null);
    try {
      await appel();
      setAnnulation(false);
      const message = CONFIRMATION[action];
      if (message) toast.success(message);
      router.refresh();
    } catch (e) {
      setErreur(messageErreur(e, "L'action n'a pas pu aboutir. Réessayez dans un instant."));
    } finally {
      setEnCours(null);
    }
  }

  const APPELS: Record<ActionPrincipale, () => Promise<unknown>> = {
    prendre: () => prendreEnCharge(missionId),
    "valider-collecte": () => validerCollecte(missionId),
    "valider-depot": () => validerDepot(missionId),
  };

  const menu: ActionMenuItem[] = autres.map((action) => {
    if (action === "modifier") return { label: "Modifier", icon: Pencil, href: `/missions-collecte/${missionId}/modifier` };
    if (action === "liberer") {
      return { label: "Rendre la mission", icon: Undo2, onClick: () => executer("liberer", () => libererMission(missionId)) };
    }
    return { label: "Annuler la mission", icon: XCircle, destructive: true, onClick: () => setAnnulation(true) };
  });

  // Sans etape a franchir, les actions courantes restent visibles ; seule l'annulation passe au menu.
  const visibles = principale ? [] : menu.filter((item) => !item.destructive);
  const dansMenu = principale ? menu : menu.filter((item) => item.destructive);

  return (
    <div className="flex flex-col gap-3">
      {erreur && !annulation && <Alert variant="destructive">{erreur}</Alert>}
      <div className="flex items-center gap-2">
        {principale && (
          <Button
            size="lg"
            className="flex-1 sm:flex-none"
            disabled={enCours !== null}
            onClick={() => executer(principale, APPELS[principale])}
          >
            {enCours === principale && <Spinner size="sm" />}
            {LIBELLE_PRINCIPALE[principale]}
          </Button>
        )}
        {visibles.map((item) =>
          item.href ? (
            <Link key={item.label} href={item.href} className={buttonVariants({ variant: "outline" })}>
              {item.icon && <item.icon aria-hidden="true" />}
              {item.label}
            </Link>
          ) : (
            <Button key={item.label} variant="outline" disabled={enCours !== null} onClick={item.onClick}>
              {item.icon && <item.icon aria-hidden="true" />}
              {item.label}
            </Button>
          ),
        )}
        {dansMenu.length > 0 && <ActionMenu items={dansMenu} label="Plus d'actions sur la mission" />}
      </div>

      <Dialog open={annulation} onOpenChange={setAnnulation}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Annuler la mission</DialogTitle>
            <DialogDescription>
              La mission ne pourra plus être prise. Dites en quelques mots pourquoi : le motif reste visible sur la
              mission.
            </DialogDescription>
          </DialogHeader>
          <FormField label="Motif" htmlFor="raison-annulation" required>
            <Textarea id="raison-annulation" value={raison} onChange={(e) => setRaison(e.target.value)} rows={3} />
          </FormField>
          {erreur && <Alert variant="destructive">{erreur}</Alert>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnulation(false)}>
              Garder la mission
            </Button>
            <Button
              variant="destructive-solid"
              disabled={!raison.trim() || enCours !== null}
              onClick={() => executer("annuler", () => annulerMission(missionId, raison.trim()))}
            >
              {enCours === "annuler" && <Spinner size="sm" />}
              Annuler la mission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
