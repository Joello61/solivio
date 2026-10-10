"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { AdresseAutocomplete } from "@/components/distributions/AdresseAutocomplete";
import { creerSession } from "@/lib/api/reconditionnement";
import type { LieuRequest } from "@/types/distribution";

const schema = z
  .object({
    titre: z.string().min(1, "Le titre est requis").max(200),
    description: z.string().optional(),
    dateHeureDebut: z.string().min(1, "La date/heure de début est requise"),
    dateHeureFin: z.string().min(1, "La date/heure de fin est requise"),
    capacite: z.string().optional(),
  })
  .refine(
    (d) =>
      !d.dateHeureDebut || !d.dateHeureFin || d.dateHeureFin > d.dateHeureDebut,
    { message: "La fin doit être après le début", path: ["dateHeureFin"] },
  );

type FormValues = z.infer<typeof schema>;

export function FormulaireSession() {
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
      .then((d: { googleMapsApiKey?: string }) => setMapsApiKey(d.googleMapsApiKey ?? ""))
      .catch(() => setMapsApiKey(""));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setErreur(null);
    try {
      const session = await creerSession({
        titre: values.titre,
        description: values.description || undefined,
        lieu,
        dateHeureDebut: new Date(values.dateHeureDebut).toISOString(),
        dateHeureFin: new Date(values.dateHeureFin).toISOString(),
        capacite:
          values.capacite && values.capacite.trim() !== ""
            ? parseInt(values.capacite, 10)
            : undefined,
      });
      router.push(`/reconditionnement/${session.id}`);
    } catch (e: unknown) {
      const err = e as { detail?: string; message?: string };
      setErreur(err.detail ?? err.message ?? "Une erreur est survenue.");
    }
  }

  const form = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {erreur && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {erreur}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="titre">Titre *</Label>
        <Input id="titre" {...register("titre")} placeholder="Tri et reconditionnement printemps" />
        {errors.titre && (
          <p className="text-xs text-destructive">{errors.titre.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          {...register("description")}
          rows={3}
          placeholder="Informations complementaires..."
          className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="dateHeureDebut">Date et heure de début *</Label>
          <Input
            id="dateHeureDebut"
            type="datetime-local"
            {...register("dateHeureDebut")}
          />
          {errors.dateHeureDebut && (
            <p className="text-xs text-destructive">{errors.dateHeureDebut.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dateHeureFin">Date et heure de fin *</Label>
          <Input
            id="dateHeureFin"
            type="datetime-local"
            {...register("dateHeureFin")}
          />
          {errors.dateHeureFin && (
            <p className="text-xs text-destructive">{errors.dateHeureFin.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Lieu</Label>
        <AdresseAutocomplete
          value={lieu?.adresseFormatee}
          onSelect={setLieu}
          onClear={() => setLieu(undefined)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="capacite">Nombre de places (optionnel)</Label>
        <Input
          id="capacite"
          type="number"
          min="1"
          {...register("capacite")}
          placeholder="20"
          className="max-w-[180px]"
        />
        {errors.capacite && (
          <p className="text-xs text-destructive">{errors.capacite.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
        Créer la session
      </Button>
    </form>
  );

  if (mapsApiKey === null) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <APIProvider apiKey={mapsApiKey} libraries={["places"]}>
      {form}
    </APIProvider>
  );
}
