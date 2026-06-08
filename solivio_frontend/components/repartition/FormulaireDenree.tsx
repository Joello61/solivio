"use client";

import { Controller, useForm } from "react-hook-form";
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
import type { DenreeResponse } from "@/types/distribution";

// valueAsNumber: true dans register() fournit des nombres directement au store interne.
// z.number() (sans coerce) permet a z.infer<schema> d'avoir le bon type numerique,
// ce qui evite le conflit de types entre zodResolver et useForm<FormValues>.
const schema = z.object({
  libelle: z.string().min(1, "Le libelle est requis").max(200),
  unite: z.enum(["UNITE", "KILOGRAMME", "LITRE", "PIECE"]),
  nombreContenants: z.number().int().positive("Doit etre positif"),
  quantiteParContenant: z.number().positive("Doit etre positif"),
});

type FormValues = z.infer<typeof schema>;

const UNITES: { value: FormValues["unite"]; label: string }[] = [
  { value: "KILOGRAMME", label: "Kilogramme (kg)" },
  { value: "LITRE", label: "Litre (L)" },
  { value: "PIECE", label: "Piece" },
  { value: "UNITE", label: "Unite generique" },
];

interface Props {
  initiales?: DenreeResponse;
  onSubmit: (values: FormValues) => Promise<void>;
  onAnnuler: () => void;
}

export function FormulaireDenree({ initiales, onSubmit, onAnnuler }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initiales
      ? {
          libelle: initiales.libelle,
          unite: initiales.unite,
          nombreContenants: initiales.nombreContenants,
          quantiteParContenant: initiales.quantiteParContenant,
        }
      : { unite: "KILOGRAMME" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="libelle">Libelle</Label>
        <Input id="libelle" placeholder="Ex : Pommes de terre" {...register("libelle")} />
        {errors.libelle && (
          <p className="text-xs text-destructive">{errors.libelle.message}</p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="unite">Unite</Label>
        <Controller
          name="unite"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="unite" className="w-full">
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
        {errors.unite && <p className="text-xs text-destructive">{errors.unite.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="nombreContenants">Nombre de contenants</Label>
          <Input
            id="nombreContenants"
            type="number"
            min="1"
            step="1"
            {...register("nombreContenants", { valueAsNumber: true })}
          />
          {errors.nombreContenants && (
            <p className="text-xs text-destructive">{errors.nombreContenants.message}</p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="quantiteParContenant">Quantite par contenant</Label>
          <Input
            id="quantiteParContenant"
            type="number"
            min="0.001"
            step="0.001"
            {...register("quantiteParContenant", { valueAsNumber: true })}
          />
          {errors.quantiteParContenant && (
            <p className="text-xs text-destructive">{errors.quantiteParContenant.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onAnnuler} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Spinner size="sm" /> Enregistrement...</>
          ) : initiales ? "Modifier" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
