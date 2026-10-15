"use client";

import { useState } from "react";
import { Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { Alert } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { List, ListRow } from "@/components/ui/list-row";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FormulaireDenree } from "./FormulaireDenree";
import {
  calculerDotation,
  changerBaseRepartition,
  listerDenrees,
  modifierDenree,
  saisirDenree,
  supprimerDenree,
} from "@/lib/api/distributions";
import { messageErreur } from "@/lib/erreurs";
import { arrivage, phrasePenurie, quantite } from "@/lib/repartition";
import type { DenreeResponse, DotationResponse, SaisirDenreePayload } from "@/types/distribution";

type Base = DotationResponse["base"];

interface Props {
  distributionId: string;
  denreesInitiales: DenreeResponse[];
  dotationInitiale: DotationResponse;
  modifiable: boolean;
  /* Intitule imprime en tete de la fiche stand ("Jeudi 15 octobre"). */
  intitule?: string;
}

function explicationBase(base: Base, nb: number): string {
  const personnes = `${nb} bénéficiaire${nb > 1 ? "s" : ""}`;
  return base === "INSCRITS"
    ? `Calculé pour les ${personnes} inscrits. Le jour J, passez sur les présents pour partager entre ceux qui sont venus.`
    : `Calculé pour les ${personnes} pointés présents.`;
}

/*
 * La repartition lue comme le contenu d'un sac : ce que chacun emporte, puis
 * ce qui ne suffit pas pour tous et ce qui restera. La carte du sac sert aussi
 * de fiche stand a l'impression.
 */
export function RepartitionPanel({ distributionId, denreesInitiales, dotationInitiale, modifiable, intitule }: Props) {
  const [denrees, setDenrees] = useState<DenreeResponse[]>(denreesInitiales);
  const [dotation, setDotation] = useState<DotationResponse>(dotationInitiale);
  const [base, setBase] = useState<Base>(dotationInitiale.base);
  const [saisie, setSaisie] = useState<{ denree: DenreeResponse | null } | null>(null);
  const [suppression, setSuppression] = useState<DenreeResponse | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function recharger() {
    const [nouvelles, nouvelleDotation] = await Promise.all([listerDenrees(distributionId), calculerDotation(distributionId, base)]);
    setDenrees(nouvelles);
    setDotation(nouvelleDotation);
  }

  async function enregistrer(values: SaisirDenreePayload) {
    setErreur(null);
    try {
      if (saisie?.denree) await modifierDenree(distributionId, saisie.denree.id, values);
      else await saisirDenree(distributionId, values);
      await recharger();
      setSaisie(null);
    } catch (e) {
      setErreur(messageErreur(e, "La denrée n'a pas pu être enregistrée. Réessayez dans un instant."));
    }
  }

  async function supprimer() {
    if (!suppression) return;
    setErreur(null);
    try {
      await supprimerDenree(distributionId, suppression.id);
      await recharger();
    } catch (e) {
      setErreur(messageErreur(e, "La denrée n'a pas pu être retirée."));
    } finally {
      setSuppression(null);
    }
  }

  async function changerBase(nouvelle: Base) {
    const precedente = base;
    setBase(nouvelle);
    setErreur(null);
    try {
      // Le choix est enregistre sur la distribution : il est repris au prochain affichage.
      await changerBaseRepartition(distributionId, nouvelle);
    } catch {
      setBase(precedente);
      setErreur("Le choix de la base n'a pas pu être enregistré.");
      return;
    }
    try {
      setDotation(await calculerDotation(distributionId, nouvelle));
    } catch {
      setErreur("Le calcul n'a pas pu être refait. Rechargez la page.");
    }
  }

  const nb = dotation.nbBeneficiaires;
  const parId = new Map(dotation.denrees.map((d) => [d.id, d]));
  const calculees = denrees.map((d) => parId.get(d.id)).filter((d) => d !== undefined);
  const dansLeSac = calculees.filter((d) => !d.penurie && d.dotation > 0);
  const penuries = calculees.filter((d) => d.penurie);
  const restes = calculees.filter((d) => d.reste > 0);

  return (
    <div className="flex flex-col gap-8">
      {!modifiable && (
        <Alert variant="info" className="print:hidden">
          Distribution clôturée : la répartition se consulte, elle ne se modifie plus.
        </Alert>
      )}
      {erreur && saisie === null && <Alert variant="destructive" className="print:hidden">{erreur}</Alert>}

      <section aria-labelledby="titre-base" className="flex flex-col gap-3 print:hidden">
        <h2 id="titre-base" className="font-display text-xl font-bold text-foreground">
          Pour qui
        </h2>
        <SegmentedControl
          label="Base de calcul"
          value={base}
          onValueChange={changerBase}
          options={[
            { value: "INSCRITS", label: "Inscrits" },
            { value: "PRESENTS", label: "Présents" },
          ]}
        />
        <p className="text-base text-muted-foreground">{explicationBase(base, nb)}</p>
      </section>

      {denrees.length > 0 && (
        <section
          aria-labelledby="titre-sac"
          className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6 print:border-0 print:p-0"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {intitule && <p className="hidden text-lg print:block">Fiche stand, {intitule}</p>}
              <h2 id="titre-sac" className="font-display text-2xl font-bold text-foreground print:text-4xl">
                Dans chaque sac
              </h2>
              <p className="text-base text-muted-foreground print:text-lg">
                Pour {nb} bénéficiaire{nb > 1 ? "s" : ""} {base === "INSCRITS" ? "inscrits" : "présents"}.
              </p>
            </div>
            {nb > 0 && (
              <Button variant="outline" onClick={() => window.print()} className="print:hidden">
                <Printer aria-hidden="true" />
                Imprimer la fiche stand
              </Button>
            )}
          </div>

          {nb === 0 ? (
            <p className="text-base text-muted-foreground">
              {base === "PRESENTS"
                ? "Aucun présent pointé : le sac se calcule dès les premiers pointages."
                : "Aucun bénéficiaire inscrit : le sac se calcule dès les premières inscriptions."}
            </p>
          ) : (
            <>
              {dansLeSac.length > 0 && (
                <ul className="flex flex-col divide-y divide-border">
                  {dansLeSac.map((d) => (
                    <li key={d.id} className="flex items-baseline justify-between gap-4 py-2.5 print:py-4">
                      <span className="text-lg text-foreground print:text-3xl">{d.libelle}</span>
                      <span className="font-display text-2xl font-bold whitespace-nowrap text-foreground tabular-nums print:text-4xl">
                        {quantite(d.dotation, d.unite)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {penuries.length > 0 && (
                <div className="flex flex-col gap-2 rounded-xl bg-accent/15 p-4 print:border print:border-foreground">
                  <h3 className="text-base font-bold text-foreground print:text-2xl">Pas assez pour tout le monde</h3>
                  <ul className="flex flex-col gap-1.5">
                    {penuries.map((d) => (
                      <li key={d.id} className="text-base text-foreground print:text-xl">
                        <span className="font-semibold">{d.libelle}</span> : {phrasePenurie(d, nb)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {restes.length > 0 && (
                <p className="text-base text-muted-foreground print:text-lg">
                  Il restera : {restes.map((d) => `${quantite(d.reste, d.unite)} de ${d.libelle.toLowerCase()}`).join(", ")}.
                </p>
              )}
            </>
          )}
        </section>
      )}

      <section aria-labelledby="titre-recu" className="flex flex-col gap-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titre-recu" className="font-display text-xl font-bold text-foreground">
            Ce qui a été reçu
          </h2>
          {modifiable && (
            <Button variant={denrees.length === 0 ? "default" : "outline"} onClick={() => setSaisie({ denree: null })}>
              <Plus aria-hidden="true" />
              Ajouter une denrée
            </Button>
          )}
        </div>
        {denrees.length === 0 ? (
          <p className="rounded-xl bg-muted px-5 py-8 text-center text-base text-muted-foreground">
            Aucune denrée saisie. Notez ce qui est arrivé : Solivio calcule ce que chacun emporte.
          </p>
        ) : (
          <List>
            {denrees.map((d) => (
              <ListRow
                key={d.id}
                titre={d.libelle}
                sousTitre={arrivage(d)}
                fin={
                  modifiable && (
                    <ActionMenu
                      label={`Plus d'actions sur ${d.libelle}`}
                      items={[
                        { label: "Modifier", icon: Pencil, onClick: () => setSaisie({ denree: d }) },
                        { label: "Retirer", icon: Trash2, destructive: true, onClick: () => setSuppression(d) },
                      ]}
                    />
                  )
                }
              />
            ))}
          </List>
        )}
      </section>

      <Sheet open={saisie !== null} onOpenChange={(ouvert) => !ouvert && setSaisie(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{saisie?.denree ? "Modifier la denrée" : "Ajouter une denrée"}</SheetTitle>
            <SheetDescription>Comptez les contenants tels qu&apos;ils sont arrivés.</SheetDescription>
          </SheetHeader>
          {erreur && <Alert variant="destructive">{erreur}</Alert>}
          <FormulaireDenree
            key={saisie?.denree?.id ?? "nouvelle"}
            initiales={saisie?.denree ?? undefined}
            onSubmit={enregistrer}
            onAnnuler={() => setSaisie(null)}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={suppression !== null} onOpenChange={(ouvert) => !ouvert && setSuppression(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer {suppression?.libelle}</AlertDialogTitle>
            <AlertDialogDescription>La denrée sort de cette distribution et le sac est recalculé.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Garder</AlertDialogCancel>
            <AlertDialogAction variant="destructive-solid" onClick={supprimer}>
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
