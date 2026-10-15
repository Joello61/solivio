"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreatableCombobox } from "./CreatableCombobox";
import { quantite } from "@/lib/repartition";
import type { DenreeResponse } from "@/types/distribution";

// valueAsNumber dans register() fournit des nombres : z.number() sans coerce
// garde un type numerique coherent entre zodResolver et useForm.
const schema = z.object({
  libelle: z.string().trim().min(1, "Indiquez la denrée.").max(200),
  unite: z.enum(["UNITE", "KILOGRAMME", "LITRE", "PIECE"]),
  nombreContenants: z.number({ error: "Indiquez un nombre." }).int("Un nombre entier.").positive("Au moins 1."),
  quantiteParContenant: z.number({ error: "Indiquez une quantité." }).positive("Une quantité positive."),
});

type FormValues = z.infer<typeof schema>;

const UNITES: { value: FormValues["unite"]; label: string }[] = [
  { value: "KILOGRAMME", label: "kg" },
  { value: "LITRE", label: "litres" },
  { value: "PIECE", label: "pièces" },
  { value: "UNITE", label: "unités" },
];

interface Props {
  initiales?: DenreeResponse;
  onSubmit: (values: FormValues) => Promise<void>;
  onAnnuler: () => void;
}

/* Saisie d'un arrivage tel qu'il se compte : "12 sacs de 5 kg". */
export function FormulaireDenree({ initiales, onSubmit, onAnnuler }: Props) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: initiales
      ? {
          libelle: initiales.libelle,
          unite: initiales.unite,
          nombreContenants: initiales.nombreContenants,
          quantiteParContenant: initiales.quantiteParContenant,
        }
      : { libelle: "", unite: "KILOGRAMME" },
  });
  const [nombre, contenu, unite] = useWatch({ control, name: ["nombreContenants", "quantiteParContenant", "unite"] });
  const total = Number.isFinite(nombre) && Number.isFinite(contenu) && nombre > 0 && contenu > 0 ? nombre * contenu : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <FormField label="Nom de la denrée" htmlFor="libelle" error={errors.libelle?.message} hint="Choisissez dans le catalogue ou tapez un nouveau nom.">
        <Controller
          name="libelle"
          control={control}
          render={({ field }) => (
            <CreatableCombobox id="libelle" value={field.value} onChange={field.onChange} placeholder="Pâtes, yaourts, huile" />
          )}
        />
      </FormField>

      <FormField label="Nombre de contenants" htmlFor="nombreContenants" error={errors.nombreContenants?.message} hint="Sacs, cartons, packs : ce que vous comptez.">
        <Input id="nombreContenants" type="number" inputMode="numeric" min="1" step="1" {...register("nombreContenants", { valueAsNumber: true })} />
      </FormField>

      <div className="grid grid-cols-[1fr_auto] items-start gap-3">
        <FormField label="Quantité dans chacun" htmlFor="quantiteParContenant" error={errors.quantiteParContenant?.message}>
          <Input
            id="quantiteParContenant"
            type="number"
            inputMode="decimal"
            min="0.001"
            step="any"
            {...register("quantiteParContenant", { valueAsNumber: true })}
          />
        </FormField>
        <FormField label="Unité" htmlFor="unite">
          <Controller
            name="unite"
            control={control}
            render={({ field }) => (
              <Select items={UNITES} value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="unite" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITES.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </div>

      <p className="text-base text-muted-foreground" aria-live="polite">
        {total !== null ? `En tout : ${quantite(total, unite)}.` : "Le total s'affiche ici."}
      </p>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onAnnuler} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner size="sm" />}
          {initiales ? "Enregistrer" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
