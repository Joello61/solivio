"use client";

import { ClipboardCheck, Megaphone, Truck } from "lucide-react";
import { lireCleGoogleMaps } from "@/lib/api/config";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { DeuxColonnes } from "@/components/ui/deux-colonnes";
import { EncartInfo } from "@/components/shared/Encarts";
import { Spinner } from "@/components/ui/spinner";
import { AdresseAutocomplete } from "@/components/distributions/AdresseAutocomplete";
import { SectionFormulaire } from "@/components/shared/SectionFormulaire";
import { messageErreur } from "@/lib/erreurs";
import { creerMission, modifierMission } from "@/lib/api/collecte";
import { versSaisieDateHeure } from "@/lib/utils";
import type { LieuMissionResponse, MissionCollecteResponse } from "@/types/collecte";
import type { LieuRequest } from "@/types/distribution";

const schema = z.object({
  titre: z.string().min(1, "Donnez un titre à la mission.").max(200),
  description: z.string().optional(),
  dateHeure: z.string().min(1, "Indiquez la date et l'heure."),
  capacitePersonnes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// Valeur par defaut de la specification (4.10.2).
const PERSONNES_PAR_DEFAUT = 6;

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
      : { capacitePersonnes: String(PERSONNES_PAR_DEFAUT) },
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
    } catch (e) {
      setErreur(messageErreur(e, "La mission n'a pas pu être enregistrée. Réessayez dans un instant."));
    }
  }

  const adresse = (valeur: LieuRequest | undefined, choisir: (l: LieuRequest | undefined) => void, aide: string) =>
    mapsApiKey === null ? (
      <Spinner size="sm" />
    ) : (
      <APIProvider apiKey={mapsApiKey}>
        <AdresseAutocomplete value={valeur?.adresseFormatee} onSelect={choisir} onClear={() => choisir(undefined)} placeholder={aide} />
      </APIProvider>
    );

  const ensuite = (
    <EncartInfo
      titre="Ce qui se passe ensuite"
      ton="marque"
      points={[
        { icone: Megaphone, texte: "Les bénévoles sont prévenus par email dès la création." },
        { icone: Truck, texte: "Un bénévole prend la mission et l'assure ; il peut la libérer s'il a un empêchement." },
        { icone: ClipboardCheck, texte: "Vous validez la collecte, puis le bénévole valide le dépôt." },
      ]}
    />
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <DeuxColonnes collante aside={ensuite}>
        <SectionFormulaire titre="La mission">
          <FormField label="Titre" htmlFor="titre" required error={errors.titre?.message}>
            <Input id="titre" {...register("titre")} />
          </FormField>
          <FormField label="Date et heure" htmlFor="dateHeure" required error={errors.dateHeure?.message}>
            <Input id="dateHeure" type="datetime-local" {...register("dateHeure")} />
          </FormField>
          <FormField
            label="Nombre de personnes prévues"
            htmlFor="capacitePersonnes"
            hint="Le bénévole qui prend la mission sait combien de bras il faut."
          >
            <Input id="capacitePersonnes" type="number" inputMode="numeric" min={1} {...register("capacitePersonnes")} className="w-32" />
          </FormField>
        </SectionFormulaire>

        <SectionFormulaire titre="Le trajet">
          <FormField label="Lieu de collecte" hint="Le partenaire chez qui récupérer les denrées.">
            {adresse(lieuCollecte, setLieuCollecte, "Rechercher l'adresse de collecte")}
          </FormField>
          <FormField label="Lieu de dépôt" hint="Là où les denrées sont déposées, en général le local.">
            {adresse(lieuDepot, setLieuDepot, "Rechercher l'adresse de dépôt")}
          </FormField>
        </SectionFormulaire>

        <SectionFormulaire titre="Description">
          <FormField label="Précisions" htmlFor="description" hint="Contact sur place, accès, véhicule nécessaire.">
            <Textarea id="description" rows={3} {...register("description")} />
          </FormField>
        </SectionFormulaire>

        {erreur && <Alert variant="destructive">{erreur}</Alert>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Spinner size="sm" />}
            {mission ? "Enregistrer les modifications" : "Créer la mission"}
          </Button>
        </div>
      </DeuxColonnes>
    </form>
  );
}
