"use client";

import { EyeOff, Send, Users } from "lucide-react";
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
import { creerSession } from "@/lib/api/reconditionnement";
import type { LieuRequest } from "@/types/distribution";

const schema = z
  .object({
    titre: z.string().min(1, "Donnez un titre à la session.").max(200),
    description: z.string().optional(),
    dateHeureDebut: z.string().min(1, "Indiquez le début."),
    dateHeureFin: z.string().min(1, "Indiquez la fin."),
    capacite: z.string().optional(),
  })
  .refine(
    (d) =>
      !d.dateHeureDebut || !d.dateHeureFin || d.dateHeureFin > d.dateHeureDebut,
    { message: "La fin doit venir après le début.", path: ["dateHeureFin"] },
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
    lireCleGoogleMaps().then(setMapsApiKey);
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
    } catch (e) {
      setErreur(messageErreur(e, "La session n'a pas pu être créée. Réessayez dans un instant."));
    }
  }

  const ensuite = (
    <EncartInfo
      titre="Ce qui se passe ensuite"
      ton="marque"
      points={[
        { icone: EyeOff, texte: "En brouillon, seuls les coordinateurs et les responsables la voient." },
        { icone: Send, texte: "Publiée depuis sa fiche, elle ouvre les inscriptions des bénévoles." },
        { icone: Users, texte: "Sans liste d'attente : une fois les places prises, les inscriptions sont refusées." },
      ]}
    />
  );

  const form = (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <DeuxColonnes collante aside={ensuite}>
        <SectionFormulaire titre="La session">
          <FormField label="Titre" htmlFor="titre" required error={errors.titre?.message}>
            <Input id="titre" {...register("titre")} />
          </FormField>
          <FormField label="Description" htmlFor="description" hint="Ce qui sera fait, ce qu'il faut apporter.">
            <Textarea id="description" rows={3} {...register("description")} />
          </FormField>
        </SectionFormulaire>

        <SectionFormulaire titre="Quand et où">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Début" htmlFor="dateHeureDebut" required error={errors.dateHeureDebut?.message}>
              <Input id="dateHeureDebut" type="datetime-local" {...register("dateHeureDebut")} />
            </FormField>
            <FormField label="Fin" htmlFor="dateHeureFin" required error={errors.dateHeureFin?.message}>
              <Input id="dateHeureFin" type="datetime-local" {...register("dateHeureFin")} />
            </FormField>
          </div>
          <FormField label="Lieu">
            <AdresseAutocomplete value={lieu?.adresseFormatee} onSelect={setLieu} onClear={() => setLieu(undefined)} placeholder="Rechercher une adresse" />
          </FormField>
        </SectionFormulaire>

        <SectionFormulaire titre="Places">
          <FormField
            label="Nombre de places"
            htmlFor="capacite"
            error={errors.capacite?.message}
            hint="Facultatif. Une fois atteint, les inscriptions sont refusées : pas de liste d'attente."
          >
            <Input id="capacite" type="number" inputMode="numeric" min="1" {...register("capacite")} className="w-32" />
          </FormField>
        </SectionFormulaire>

        {erreur && <Alert variant="destructive">{erreur}</Alert>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Spinner size="sm" />}
            Créer le brouillon
          </Button>
        </div>
      </DeuxColonnes>
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
