"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { creerDistribution } from "@/lib/api/distributions";

const creneauSchema = z.object({
  heureDebut: z.string().min(1, "Heure de debut requise"),
  heureFin: z.string().min(1, "Heure de fin requise"),
  capacite: z.number().int().positive("La capacite doit etre positive"),
});

const schema = z.object({
  titre: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().optional(),
  lieu: z.string().optional(),
  date: z.string().min(1, "La date est requise"),
  capaciteBeneficiaires: z.number().int().positive("La capacite doit etre positive"),
  capaciteBenevoles: z.number().int().positive().optional(),
  modeCreneau: z.enum(["CRENEAU_UNIQUE", "CRENEAUX_DECOUPES"]),
  creneaux: z.array(creneauSchema).min(1, "Au moins un creneau est requis"),
});

type FormValues = z.infer<typeof schema>;

export function CreateDistributionForm() {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      modeCreneau: "CRENEAU_UNIQUE",
      creneaux: [{ heureDebut: "10:00", heureFin: "12:00", capacite: 50 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "creneaux" });

  async function onSubmit(values: FormValues) {
    setErreur(null);
    try {
      const distribution = await creerDistribution({
        titre: values.titre,
        description: values.description || undefined,
        lieu: values.lieu || undefined,
        date: values.date,
        capaciteBeneficiaires: values.capaciteBeneficiaires,
        capaciteBenevoles: values.capaciteBenevoles,
        modeCreneau: values.modeCreneau,
        creneaux: values.creneaux,
      });
      router.push(`/distributions/${distribution.id}`);
    } catch (e: unknown) {
      const err = e as { detail?: string; message?: string };
      setErreur(err.detail ?? err.message ?? "Une erreur est survenue.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {erreur && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="titre">Titre *</Label>
          <Input id="titre" {...register("titre")} placeholder="Distribution du 15 janvier" />
          {errors.titre && <p className="text-xs text-destructive">{errors.titre.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="date">Date *</Label>
            <Input id="date" type="date" {...register("date")} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lieu">Lieu</Label>
            <Input id="lieu" {...register("lieu")} placeholder="Salle polyvalente" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Input id="description" {...register("description")} placeholder="Informations complementaires..." />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="capaciteBeneficiaires">Capacite beneficiaires *</Label>
            <Input
              id="capaciteBeneficiaires"
              type="number"
              min={1}
              {...register("capaciteBeneficiaires", { valueAsNumber: true })}
            />
            {errors.capaciteBeneficiaires && (
              <p className="text-xs text-destructive">{errors.capaciteBeneficiaires.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="capaciteBenevoles">Capacite benevoles</Label>
            <Input
              id="capaciteBenevoles"
              type="number"
              min={1}
              {...register("capaciteBenevoles", { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-sm">Creneaux horaires</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ heureDebut: "", heureFin: "", capacite: 50 })}
          >
            <Plus className="mr-1 size-3" />
            Ajouter un creneau
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor={`creneaux.${index}.heureDebut`}>Debut</Label>
              <Input type="time" {...register(`creneaux.${index}.heureDebut`)} />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor={`creneaux.${index}.heureFin`}>Fin</Label>
              <Input type="time" {...register(`creneaux.${index}.heureFin`)} />
            </div>
            <div className="w-24 space-y-1.5">
              <Label htmlFor={`creneaux.${index}.capacite`}>Places</Label>
              <Input type="number" min={1} {...register(`creneaux.${index}.capacite`, { valueAsNumber: true })} />
            </div>
            {fields.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}

        {errors.creneaux?.root && (
          <p className="text-xs text-destructive">{errors.creneaux.root.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creation en cours..." : "Creer la distribution"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
