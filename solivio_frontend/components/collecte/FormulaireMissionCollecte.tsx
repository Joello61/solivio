"use client";

import { lireCleGoogleMaps } from "@/lib/api/config";
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
import { creerMission, modifierMission } from "@/lib/api/collecte";
import { versSaisieDateHeure } from "@/lib/utils";
import type { LieuMissionResponse, MissionCollecteResponse } from "@/types/collecte";
import type { LieuRequest } from "@/types/distribution";

const schema = z.object({
  titre: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().optional(),
  dateHeure: z.string().min(1, "La date et l'heure sont requises"),
  capacitePersonnes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function versLieu(lieu: LieuMissionResponse | null | undefined): LieuRequest | undefined {
  if (!lieu?.adresseFormatee) return undefined;
  return {
    placeId: lieu.placeId ?? undefined,
    adresseFormatee: lieu.adresseFormatee,
    latitude: lieu.latitude ?? undefined,
    longitude: lieu.longitude ?? undefined,
  };
}

function versPayload(lieu: LieuRequest | undefined) {
  return lieu
    ? { placeId: lieu.placeId, adresseFormatee: lieu.adresseFormatee,
        latitude: lieu.latitude, longitude: lieu.longitude }
    : undefined;
}

export function FormulaireMissionCollecte({ mission }: { mission?: MissionCollecteResponse } = {}) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [lieuCollecte, setLieuCollecte] = useState(() => versLieu(mission?.lieuCollecte));
  const [lieuDepot, setLieuDepot] = useState(() => versLieu(mission?.lieuDepot));
  const [mapsApiKey, setMapsApiKey] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    lireCleGoogleMaps().then(setMapsApiKey);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: mission
      ? {
          titre: mission.titre,
          description: mission.description ?? "",
          dateHeure: versSaisieDateHeure(mission.dateHeure),
          capacitePersonnes: String(mission.capacitePersonnes),
        }
      : undefined,
  });

  async function onSubmit(values: FormValues) {
    setErreur(null);
    try {
      const payload = {
        titre: values.titre,
        description: values.description || undefined,
        lieuCollecte: versPayload(lieuCollecte),
        lieuDepot: versPayload(lieuDepot),
        dateHeure: new Date(values.dateHeure).toISOString(),
        capacitePersonnes:
          values.capacitePersonnes && values.capacitePersonnes.trim() !== ""
            ? parseInt(values.capacitePersonnes, 10)
            : undefined,
      };
      const enregistree = mission
        ? await modifierMission(mission.id, payload)
        : await creerMission(payload);
      router.push(`/missions-collecte/${enregistree.id}`);
      router.refresh();
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
            <Label>Lieu de dépôt</Label>
            <APIProvider apiKey={mapsApiKey}>
              <AdresseAutocomplete
                value={lieuDepot?.adresseFormatee}
                onSelect={setLieuDepot}
                onClear={() => setLieuDepot(undefined)}
                placeholder="Adresse de dépôt..."
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
          placeholder="Informations complémentaires..."
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="capacitePersonnes">Nombre de bénévoles</Label>
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
        {mission ? "Enregistrer les modifications" : "Créer la mission"}
      </Button>
    </form>
  );
}
