"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/layout/identite";
import { SectionFormulaire } from "@/components/shared/SectionFormulaire";
import { envoyerEmailLibre, type CibleEmail } from "@/lib/api/notification";
import { messageErreur } from "@/lib/erreurs";

export const CIBLES: { value: CibleEmail; label: string }[] = [
  { value: "BENEVOLES", label: "Bénévoles" },
  { value: "BENEFICIAIRES", label: "Bénéficiaires" },
  { value: "COORDINATEURS", label: "Coordinateurs" },
  { value: "RESPONSABLES", label: "Responsables" },
  { value: "TOUS", label: "Tous les membres" },
];

const schema = z.object({
  cible: z.enum(["BENEVOLES", "BENEFICIAIRES", "COORDINATEURS", "RESPONSABLES", "TOUS"], { error: "Choisissez les destinataires." }),
  sujet: z.string().trim().min(1, "Donnez un sujet au message.").max(255),
  corps: z.string().trim().min(1, "Écrivez le message."),
});

type Valeurs = z.infer<typeof schema>;

interface Props {
  /* Membres actifs par cible : ceux qui recevront l'email. */
  destinataires: Record<CibleEmail, number>;
}

const pluriel = (n: number) => `${n} destinataire${n > 1 ? "s" : ""}`;

/* Un email a un groupe de membres : le public, le message, un apercu, puis une confirmation chiffree. */
export function MessageMembres({ destinataires }: Props) {
  const [aConfirmer, setAConfirmer] = useState<Valeurs | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<Valeurs>({ resolver: zodResolver(schema), mode: "onBlur" });
  const [cible, sujet, corps] = useWatch({ control, name: ["cible", "sujet", "corps"] });
  const libelle = CIBLES.find((c) => c.value === aConfirmer?.cible)?.label.toLowerCase();

  async function envoyer() {
    if (!aConfirmer) return;
    setEnCours(true);
    setErreur(null);
    try {
      await envoyerEmailLibre(aConfirmer);
      toast.success(`Message envoyé à ${pluriel(destinataires[aConfirmer.cible])}.`);
      setAConfirmer(null);
      reset();
    } catch (e) {
      setErreur(messageErreur(e, "Le message n'est pas parti. Réessayez dans un instant."));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(setAConfirmer)}
      noValidate
      className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] xl:grid-cols-[minmax(0,1fr)_24rem]"
    >
      <div className="flex min-w-0 flex-col gap-6">
        <SectionFormulaire titre="À qui">
          <RadioGroup
            aria-label="Destinataires"
            value={cible ?? null}
            onValueChange={(v) => setValue("cible", v as CibleEmail, { shouldValidate: true })}
            className="gap-2"
          >
            {CIBLES.map((c) => (
              <label
                key={c.value}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 has-data-checked:border-primary has-data-checked:bg-secondary"
              >
                <RadioGroupItem value={c.value} />
                <span className="flex-1 text-base font-semibold text-foreground">{c.label}</span>
                <span className="text-sm text-muted-foreground tabular-nums">{pluriel(destinataires[c.value])}</span>
              </label>
            ))}
          </RadioGroup>
          {errors.cible && <p className="text-sm font-semibold text-destructive">{errors.cible.message}</p>}
        </SectionFormulaire>

        <SectionFormulaire titre="Le message">
          <FormField label="Sujet" htmlFor="sujet" required error={errors.sujet?.message}>
            <Input id="sujet" {...register("sujet")} />
          </FormField>
          <FormField label="Message" htmlFor="corps" required error={errors.corps?.message} hint="Les réponses arrivent sur l'adresse de l'association.">
            <Textarea id="corps" rows={8} {...register("corps")} />
          </FormField>
        </SectionFormulaire>

        <Button type="submit" size="lg" className="self-end">
          <Send aria-hidden="true" />
          Envoyer
        </Button>
      </div>

      {/* L'email tel que les membres le liront, a cote du formulaire. */}
      <section aria-labelledby="titre-apercu" className="flex flex-col gap-2 lg:sticky lg:top-6">
        <h2 id="titre-apercu" className="font-display text-xl font-bold text-foreground">
          Aperçu
        </h2>
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="flex items-center justify-center bg-brand py-4">
            <Logo plaque className="h-10" />
          </div>
          <div className="flex flex-col gap-3 p-5">
            <p className={sujet ? "text-lg font-bold text-foreground" : "text-lg font-bold text-muted-foreground"}>{sujet || "Le sujet du message"}</p>
            <p className={corps ? "text-base whitespace-pre-line text-foreground" : "text-base text-muted-foreground"}>
              {corps || "Le texte apparaîtra ici, tel que les membres le liront."}
            </p>
            <p className="border-t border-border pt-3 text-sm text-muted-foreground">
              {cible ? `Envoyé à ${pluriel(destinataires[cible])}.` : "Choisissez à qui l'envoyer."} Les réponses arrivent sur l&apos;adresse de
              l&apos;association.
            </p>
          </div>
        </div>
      </section>

      <Dialog open={aConfirmer !== null} onOpenChange={(o) => !o && setAConfirmer(null)}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Envoyer à {aConfirmer ? pluriel(destinataires[aConfirmer.cible]) : ""} ?</DialogTitle>
            <DialogDescription>
              {aConfirmer?.cible === "TOUS" ? "Tous les membres actifs" : `Les ${libelle} actifs`} reçoivent &quot;{aConfirmer?.sujet}&quot;. Un
              email envoyé ne se rattrape pas.
            </DialogDescription>
          </DialogHeader>
          {erreur && <Alert variant="destructive">{erreur}</Alert>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAConfirmer(null)}>
              Relire
            </Button>
            <Button disabled={enCours} onClick={envoyer}>
              {enCours && <Spinner size="sm" />}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
