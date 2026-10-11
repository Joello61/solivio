"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { envoyerEmailLibre, type CibleEmail } from "@/lib/api/notification";

const CIBLES: { value: CibleEmail; label: string }[] = [
  { value: "BENEVOLES", label: "Bénévoles" },
  { value: "BENEFICIAIRES", label: "Bénéficiaires" },
  { value: "COORDINATEURS", label: "Coordinateurs" },
  { value: "RESPONSABLES", label: "Responsables" },
  { value: "TOUS", label: "Tous les membres" },
];

const schema = z.object({
  cible: z.enum(["BENEVOLES", "BENEFICIAIRES", "COORDINATEURS", "RESPONSABLES", "TOUS"]),
  sujet: z.string().min(1, "Le sujet est requis").max(255),
  corps: z.string().min(1, "Le message est requis"),
});

type FormValues = z.infer<typeof schema>;

export function EmailLibreForm() {
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const [payload, setPayload] = useState<FormValues | null>(null);
  const [selectedCible, setSelectedCible] = useState<CibleEmail | undefined>();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const cibleLabel =
    CIBLES.find((c) => c.value === selectedCible)?.label ?? "non sélectionnée";

  function demanderConfirmation(values: FormValues) {
    setPayload(values);
    setConfirmer(true);
  }

  async function confirmerEnvoi() {
    if (!payload) return;
    setErreur(null);
    try {
      await envoyerEmailLibre(payload);
      setSucces(true);
      setConfirmer(false);
      setSelectedCible(undefined);
      reset();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setErreur(msg);
      setConfirmer(false);
    }
  }

  if (succes) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-6 space-y-4">
        <p className="text-sm text-success">
          Message envoyé avec succès.
        </p>
        <Button variant="outline" onClick={() => setSucces(false)}>
          Envoyer un autre message
        </Button>
      </div>
    );
  }

  if (confirmer && payload) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-6 space-y-4">
        <p className="text-sm font-semibold text-foreground font-display">
          Confirmer l&apos;envoi
        </p>
        <p className="text-sm text-foreground">
          Vous êtes sur le point d&apos;envoyer un email à :{" "}
          <strong>{cibleLabel}</strong>
        </p>
        <p className="text-sm text-foreground">
          Sujet : <strong>{payload.sujet}</strong>
        </p>
        <div className="flex gap-3 pt-2">
          <Button onClick={confirmerEnvoi} disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
            Confirmer l&apos;envoi
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirmer(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-6">
      <form onSubmit={handleSubmit(demanderConfirmation)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="cible">Destinataires</Label>
          <Select
            onValueChange={(v) => {
              const c = v as CibleEmail;
              setValue("cible", c);
              setSelectedCible(c);
            }}
            value={selectedCible}
          >
            <SelectTrigger id="cible">
              <SelectValue placeholder="Choisir les destinataires" />
            </SelectTrigger>
            <SelectContent>
              {CIBLES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.cible && (
            <p className="text-xs text-destructive">{errors.cible.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sujet">Sujet</Label>
          <Input
            id="sujet"
            placeholder="Objet du message"
            {...register("sujet")}
          />
          {errors.sujet && (
            <p className="text-xs text-destructive">{errors.sujet.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="corps">Message</Label>
          <textarea
            id="corps"
            rows={8}
            placeholder="Contenu du message..."
            className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
            {...register("corps")}
          />
          {errors.corps && (
            <p className="text-xs text-destructive">{errors.corps.message}</p>
          )}
        </div>

        {erreur && <p className="text-xs text-destructive">{erreur}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
          Vérifier avant envoi
        </Button>
      </form>
    </div>
  );
}
