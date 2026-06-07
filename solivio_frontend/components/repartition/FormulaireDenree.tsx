"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DenreeResponse } from "@/types/distribution";

const schema = z.object({
  libelle: z.string().min(1, "Le libelle est requis").max(200),
  unite: z.enum(["UNITE", "KILOGRAMME", "LITRE", "PIECE"]),
  nombreContenants: z.coerce.number().int().positive("Doit etre positif"),
  quantiteParContenant: z.coerce.number().positive("Doit etre positif"),
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
      <div className="grid gap-2">
        <Label htmlFor="libelle">Libelle</Label>
        <Input id="libelle" placeholder="Ex : Pommes de terre" {...register("libelle")} />
        {errors.libelle && (
          <p className="text-xs text-destructive">{errors.libelle.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="unite">Unite</Label>
        <select
          id="unite"
          {...register("unite")}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          {UNITES.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
        {errors.unite && <p className="text-xs text-destructive">{errors.unite.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="nombreContenants">Nombre de contenants</Label>
          <Input
            id="nombreContenants"
            type="number"
            min="1"
            step="1"
            {...register("nombreContenants")}
          />
          {errors.nombreContenants && (
            <p className="text-xs text-destructive">{errors.nombreContenants.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="quantiteParContenant">Quantite par contenant</Label>
          <Input
            id="quantiteParContenant"
            type="number"
            min="0.001"
            step="0.001"
            {...register("quantiteParContenant")}
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
          {isSubmitting ? "Enregistrement..." : initiales ? "Modifier" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
