"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { creerDistribution } from "@/lib/api/distributions";
import { AdresseAutocomplete } from "@/components/distributions/AdresseAutocomplete";
import type { LieuRequest } from "@/types/distribution";

const creneauSchema = z.object({
  heureDebut: z.string().min(1, "Heure de debut requise"),
  heureFin: z.string().min(1, "Heure de fin requise"),
  capacite: z.number().int().positive("La capacite doit etre positive"),
});

const schema = z.object({
  titre: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().optional(),
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
  const [lieu, setLieu] = useState<LieuRequest | undefined>(undefined);
  const [mapsApiKey, setMapsApiKey] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch("/api/public/config")
      .then((r) => r.json())
      .then((d) => setMapsApiKey(d.googleMapsApiKey ?? ""))
      .catch(() => setMapsApiKey(""));
  }, []);

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
        lieu: lieu || undefined,
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
    <APIProvider apiKey={mapsApiKey ?? ""} libraries={["places"]}>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {erreur && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {erreur}
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-5 space-y-4">
        <h2 className="text-base font-semibold text-foreground font-display">Informations generales</h2>

        <div className="space-y-1.5">
          <Label htmlFor="titre">Titre <span className="text-destructive">*</span></Label>
          <Input id="titre" {...register("titre")} placeholder="Distribution du 15 janvier" />
          {errors.titre && <p className="text-xs text-destructive">{errors.titre.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="date">Date <span className="text-destructive">*</span></Label>
            <Input id="date" type="date" {...register("date")} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Lieu</Label>
            <AdresseAutocomplete
              value={lieu?.adresseFormatee}
              onSelect={setLieu}
              onClear={() => setLieu(undefined)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            {...register("description")}
            placeholder="Informations complementaires..."
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-5 space-y-4">
        <h2 className="text-base font-semibold text-foreground font-display">Capacites</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="capaciteBeneficiaires">
              Beneficiaires <span className="text-destructive">*</span>
            </Label>
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
            <Label htmlFor="capaciteBenevoles">Benevoles</Label>
            <Input
              id="capaciteBenevoles"
              type="number"
              min={1}
              placeholder="Illimite"
              {...register("capaciteBenevoles", { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground font-display">Creneaux horaires</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ heureDebut: "", heureFin: "", capacite: 50 })}
          >
            <Plus className="mr-1 size-3.5" />
            Ajouter un creneau
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-2 rounded-xl border border-border/60 bg-neutral-50 dark:bg-neutral-800/50 p-3">
              <div className="flex-1 space-y-1">
                <Label htmlFor={`creneaux.${index}.heureDebut`} className="text-xs">Debut</Label>
                <Input type="time" {...register(`creneaux.${index}.heureDebut`)} className="h-8 text-sm" />
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor={`creneaux.${index}.heureFin`} className="text-xs">Fin</Label>
                <Input type="time" {...register(`creneaux.${index}.heureFin`)} className="h-8 text-sm" />
              </div>
              <div className="w-24 space-y-1">
                <Label htmlFor={`creneaux.${index}.capacite`} className="text-xs">Places</Label>
                <Input
                  type="number"
                  min={1}
                  {...register(`creneaux.${index}.capacite`, { valueAsNumber: true })}
                  className="h-8 text-sm"
                />
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {errors.creneaux?.root && (
          <p className="text-xs text-destructive">{errors.creneaux.root.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Spinner size="sm" /> Creation en cours...</>
          ) : (
            "Creer la distribution"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
    </APIProvider>
  );
}
