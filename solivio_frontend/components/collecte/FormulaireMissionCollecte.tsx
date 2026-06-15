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
import { creerMission } from "@/lib/api/collecte";
import type { LieuRequest } from "@/types/distribution";

const schema = z.object({
  titre: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().optional(),
  dateHeure: z.string().min(1, "La date et l'heure sont requises"),
  capacitePersonnes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function FormulaireMissionCollecte() {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [lieuCollecte, setLieuCollecte] = useState<LieuRequest | undefined>(undefined);
  const [lieuDepot, setLieuDepot] = useState<LieuRequest | undefined>(undefined);
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
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setErreur(null);
    try {
      const mission = await creerMission({
        titre: values.titre,
        description: values.description || undefined,
        lieuCollecte: lieuCollecte
          ? { placeId: lieuCollecte.placeId, adresseFormatee: lieuCollecte.adresseFormatee,
              latitude: lieuCollecte.latitude, longitude: lieuCollecte.longitude }
          : undefined,
        lieuDepot: lieuDepot
          ? { placeId: lieuDepot.placeId, adresseFormatee: lieuDepot.adresseFormatee,
              latitude: lieuDepot.latitude, longitude: lieuDepot.longitude }
          : undefined,
        dateHeure: new Date(values.dateHeure).toISOString(),
        capacitePersonnes:
          values.capacitePersonnes && values.capacitePersonnes.trim() !== ""
            ? parseInt(values.capacitePersonnes, 10)
            : undefined,
      });
      router.push(`/missions-collecte/${mission.id}`);
    } catch (e: unknown) {
      const err = e as { detail?: string; message?: string };
      setErreur(err.detail ?? err.message ?? "Une erreur est survenue.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {erreur && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {erreur}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="titre">Titre *</Label>
        <Input id="titre" {...register("titre")} placeholder="Collecte alimentaire quartier Nord" />
        {errors.titre && <p className="text-xs text-destructive">{errors.titre.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dateHeure">Date et heure *</Label>
        <Input id="dateHeure" type="datetime-local" {...register("dateHeure")} />
        {errors.dateHeure && <p className="text-xs text-destructive">{errors.dateHeure.message}</p>}
      </div>

      {mapsApiKey !== null && (
        <>
          <div className="space-y-1.5">
            <Label>Lieu de collecte</Label>
            <APIProvider apiKey={mapsApiKey}>
              <AdresseAutocomplete
                value={lieuCollecte?.adresseFormatee}
                onSelect={setLieuCollecte}
                onClear={() => setLieuCollecte(undefined)}
                placeholder="Adresse de collecte..."
              />
            </APIProvider>
          </div>

          <div className="space-y-1.5">
            <Label>Lieu de depot</Label>
            <APIProvider apiKey={mapsApiKey}>
              <AdresseAutocomplete
                value={lieuDepot?.adresseFormatee}
                onSelect={setLieuDepot}
                onClear={() => setLieuDepot(undefined)}
                placeholder="Adresse de depot..."
              />
            </APIProvider>
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          {...register("description")}
          rows={3}
          placeholder="Informations complementaires..."
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="capacitePersonnes">Nombre de benevoles</Label>
        <Input
          id="capacitePersonnes"
          type="number"
          min={1}
          {...register("capacitePersonnes")}
          placeholder="6"
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <Spinner className="mr-2 size-4" /> : null}
        Creer la mission
      </Button>
    </form>
  );
}
