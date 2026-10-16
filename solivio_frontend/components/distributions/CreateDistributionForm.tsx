"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { DeuxColonnes } from "@/components/ui/deux-colonnes";
import { AdresseAutocomplete } from "@/components/distributions/AdresseAutocomplete";
import { GenerateurCreneaux } from "@/components/distributions/GenerateurCreneaux";
import { SectionFormulaire } from "@/components/shared/SectionFormulaire";
import { creerDistribution, modifierDistribution } from "@/lib/api/distributions";
import { lireCleGoogleMaps } from "@/lib/api/config";
import { dateLongue, horaire, libellePlaces } from "@/lib/agenda";
import { dateDupliquee, titrePropose } from "@/lib/cycle-distribution";
import { messageErreur } from "@/lib/erreurs";
import type { DistributionResponse, LieuRequest, LieuResponse } from "@/types/distribution";

const creneauSchema = z.object({
  // Identifiant d'un creneau existant (modification) ; absent pour un nouveau creneau.
  id: z.string().optional(),
  heureDebut: z.string().min(1, "Indiquez l'heure de début."),
  heureFin: z.string().min(1, "Indiquez l'heure de fin."),
  capacite: z.number({ error: "Indiquez un nombre de places." }).int().positive("Au moins une place."),
});

const schema = z.object({
  titre: z.string().trim().min(1, "Donnez un titre.").max(200),
  description: z.string().optional(),
  date: z.string().min(1, "Choisissez une date."),
  capaciteBeneficiaires: z.number({ error: "Indiquez un nombre de places." }).int().positive("Au moins une place."),
  capaciteBenevoles: z.number().int().positive("Au moins une place, ou laissez vide.").optional(),
  creneaux: z.array(creneauSchema).min(1, "Ajoutez au moins un créneau."),
});

type FormValues = z.infer<typeof schema>;

function versLieuRequest(lieu: LieuResponse | null): LieuRequest | undefined {
  if (!lieu?.adresseFormatee) return undefined;
  return Object.fromEntries(Object.entries(lieu).filter(([, v]) => v !== null)) as LieuRequest;
}

// Le backend n'accepte qu'un creneau en mode unique : le mode suit le nombre de creneaux.
function modePour(creneaux: unknown[]): "CRENEAU_UNIQUE" | "CRENEAUX_DECOUPES" {
  return creneaux.length > 1 ? "CRENEAUX_DECOUPES" : "CRENEAU_UNIQUE";
}

function valeursDepuis(d: DistributionResponse, copie: { date: string } | null): FormValues {
  const date = copie?.date ?? d.date;
  return {
    titre: copie ? titrePropose(date) : d.titre,
    description: d.description ?? "",
    date,
    capaciteBeneficiaires: d.capaciteBeneficiaires,
    capaciteBenevoles: d.capaciteBenevoles ?? undefined,
    creneaux: d.creneaux.map((c) => ({
      // Une copie cree de nouveaux creneaux.
      id: copie ? undefined : c.id,
      heureDebut: c.heureDebut.slice(0, 5),
      heureFin: c.heureFin.slice(0, 5),
      capacite: c.capacite,
    })),
  };
}

interface Props {
  /** Distribution a modifier ; absente pour une creation. */
  distribution?: DistributionResponse;
  /** Distribution a dupliquer : tout est repris, la date avance d'une semaine. */
  modele?: DistributionResponse;
  aujourdhui: string;
}

export function CreateDistributionForm({ distribution, modele, aujourdhui }: Props) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const source = distribution ?? modele;
  const [lieu, setLieu] = useState<LieuRequest | undefined>(versLieuRequest(source?.lieu ?? null));
  const [mapsApiKey, setMapsApiKey] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    lireCleGoogleMaps().then(setMapsApiKey);
  }, []);

  const valeursInitiales: Partial<FormValues> = distribution
    ? valeursDepuis(distribution, null)
    : modele
      ? valeursDepuis(modele, { date: dateDupliquee(modele.date, aujourdhui) })
      : { titre: "", creneaux: [{ heureDebut: "17:30", heureFin: "19:30", capacite: 50 }] };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: valeursInitiales });
  const { fields, append, remove, replace } = useFieldArray({ control, name: "creneaux" });
  const [date, creneaux, capacite] = useWatch({ control, name: ["date", "creneaux", "capaciteBeneficiaires"] });

  // Le titre suit la date tant qu'on ne l'a pas reecrit a la main.
  const titreAuto = useRef(distribution ? null : (valeursInitiales.titre ?? ""));
  useEffect(() => {
    if (!date || titreAuto.current === null) return;
    if (getValues("titre") !== titreAuto.current) {
      titreAuto.current = null;
      return;
    }
    titreAuto.current = titrePropose(date);
    setValue("titre", titreAuto.current);
  }, [date, getValues, setValue]);

  const publiee = distribution?.statut === "PUBLIEE";
  const r = distribution?.remplissage;
  const comptes = new Map(distribution?.creneaux.map((c) => [c.id, (c.confirmes ?? 0) + (c.enAttente ?? 0)]) ?? []);
  const confirmesCreneau = new Map(distribution?.creneaux.map((c) => [c.id, c.confirmes ?? 0]) ?? []);
  // Le backend fige le mode (unique ou decoupe) une fois la distribution publiee.
  const modeFige = publiee ? distribution.modeCreneau : null;
  // Generer remplace la liste : jamais sur une distribution publiee, dont les creneaux ont pu recevoir des inscrits.
  const peutGenerer = !publiee;

  async function onSubmit(values: FormValues) {
    setErreur(null);
    const commun = {
      titre: values.titre.trim(),
      description: values.description?.trim() || undefined,
      lieu: lieu || undefined,
      date: values.date,
      capaciteBeneficiaires: values.capaciteBeneficiaires,
      capaciteBenevoles: values.capaciteBenevoles,
      modeCreneau: modePour(values.creneaux),
    };
    try {
      if (distribution) {
        await modifierDistribution(distribution.id, { ...commun, creneaux: values.creneaux });
        router.push(`/distributions/${distribution.id}`);
        router.refresh();
      } else {
        const creee = await creerDistribution({
          ...commun,
          creneaux: values.creneaux.map(({ heureDebut, heureFin, capacite: places }) => ({ heureDebut, heureFin, capacite: places })),
        });
        router.push(`/distributions/${creee.id}`);
      }
    } catch (e) {
      setErreur(messageErreur(e, "L'enregistrement n'a pas pu aboutir. Réessayez dans un instant."));
    }
  }

  if (mapsApiKey === null) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const debuts = (creneaux ?? []).map((c) => c.heureDebut).filter(Boolean).sort();
  const fins = (creneaux ?? []).map((c) => c.heureFin).filter(Boolean).sort();
  const plage = horaire(debuts[0] ?? null, fins.at(-1) ?? null);

  // A cote du formulaire sur ordinateur : la distribution telle que les beneficiaires la verront.
  const apercu = (
    <section aria-labelledby="apercu" className="flex flex-col gap-2">
      <h2 id="apercu" className="font-display text-lg font-bold text-foreground">
        Ce que verront les bénéficiaires
      </h2>
      <div className="flex flex-col gap-1 rounded-xl border border-dashed border-border bg-card p-4">
        <span className="font-mono text-sm font-semibold tracking-wider text-primary uppercase">
          {date ? dateLongue(date) : "Date à choisir"}
        </span>
        <span className="font-display text-2xl font-extrabold tabular-nums text-foreground">{plage ?? "Horaire à préciser"}</span>
        <span className="text-base text-muted-foreground">{lieu?.nom || lieu?.adresseFormatee || "Lieu à préciser"}</span>
        {capacite > 0 && <span className="text-base text-foreground">{libellePlaces(capacite)}</span>}
      </div>
    </section>
  );

  return (
    <APIProvider apiKey={mapsApiKey} libraries={["places"]}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DeuxColonnes collante aside={apercu}>
          <SectionFormulaire titre="Quand et où">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Date" htmlFor="date" required error={errors.date?.message}>
                <Input id="date" type="date" min={distribution ? undefined : aujourdhui} {...register("date")} />
              </FormField>
              <FormField label="Lieu" htmlFor="lieu" hint="Le nom du lieu et l'itinéraire s'affichent sur les billets.">
                <AdresseAutocomplete value={lieu?.adresseFormatee} onSelect={setLieu} onClear={() => setLieu(undefined)} />
              </FormField>
            </div>
            <FormField
              label="Titre"
              htmlFor="titre"
              required
              error={errors.titre?.message}
              hint="Proposé à partir de la date ; visible des gestionnaires et dans les emails."
            >
              <Input id="titre" {...register("titre")} />
            </FormField>
          </SectionFormulaire>

          <SectionFormulaire titre="Créneaux">
            <p className="text-base text-muted-foreground">
              {modeFige === "CRENEAU_UNIQUE"
                ? "Distribution publiée avec un seul créneau : on ne peut plus la découper."
                : "Un seul créneau, ou des horaires échelonnés que chacun choisit en s'inscrivant."}
            </p>
            {peutGenerer && <GenerateurCreneaux nbExistants={fields.length} onGenerer={(liste) => replace(liste)} />}

            <ul className="flex flex-col gap-3">
              {fields.map((field, index) => {
                const id = getValues(`creneaux.${index}.id`);
                const occupes = id ? (comptes.get(id) ?? 0) : 0;
                const confirmes = id ? (confirmesCreneau.get(id) ?? 0) : 0;
                const dernierDecoupe = modeFige === "CRENEAUX_DECOUPES" && fields.length <= 2;
                const erreurs = errors.creneaux?.[index];
                return (
                  <li key={field.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                    <div className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <FormField label="Début" htmlFor={`creneaux.${index}.heureDebut`} error={erreurs?.heureDebut?.message}>
                        <Input id={`creneaux.${index}.heureDebut`} type="time" {...register(`creneaux.${index}.heureDebut`)} />
                      </FormField>
                      <FormField label="Fin" htmlFor={`creneaux.${index}.heureFin`} error={erreurs?.heureFin?.message}>
                        <Input id={`creneaux.${index}.heureFin`} type="time" {...register(`creneaux.${index}.heureFin`)} />
                      </FormField>
                      <div className="col-span-2 flex items-end gap-2 sm:col-span-1">
                        <FormField className="w-24" label="Places" htmlFor={`creneaux.${index}.capacite`} error={erreurs?.capacite?.message}>
                          <Input
                            id={`creneaux.${index}.capacite`}
                            type="number"
                            inputMode="numeric"
                            min={Math.max(1, confirmes)}
                            {...register(`creneaux.${index}.capacite`, { valueAsNumber: true })}
                          />
                        </FormField>
                        {fields.length > 1 && occupes === 0 && !dernierDecoupe ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            aria-label={`Supprimer le créneau ${index + 1}`}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        ) : (
                          <span className="size-11" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                    {occupes > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {occupes} inscription{occupes > 1 ? "s" : ""} sur ce créneau : il ne peut pas être supprimé
                        {confirmes > 0 ? `, ni passer sous ${confirmes} place${confirmes > 1 ? "s" : ""}` : ""}.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            {errors.creneaux?.root && <Alert variant="destructive">{errors.creneaux.root.message}</Alert>}
            {modeFige !== "CRENEAU_UNIQUE" && (
              <Button
                type="button"
                variant="outline"
                className="self-start"
                onClick={() => append({ heureDebut: "", heureFin: "", capacite: getValues("creneaux.0.capacite") || 10 })}
              >
                <Plus aria-hidden="true" />
                Ajouter un créneau
              </Button>
            )}
          </SectionFormulaire>

          <SectionFormulaire titre="Capacités">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Bénéficiaires"
                htmlFor="capaciteBeneficiaires"
                required
                error={errors.capaciteBeneficiaires?.message}
                hint={r?.beneficiairesConfirmes ? `Au moins ${r.beneficiairesConfirmes} : déjà inscrits.` : "Au-delà, liste d'attente."}
              >
                <Input
                  id="capaciteBeneficiaires"
                  type="number"
                  inputMode="numeric"
                  min={Math.max(1, r?.beneficiairesConfirmes ?? 0)}
                  {...register("capaciteBeneficiaires", { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                label="Bénévoles"
                htmlFor="capaciteBenevoles"
                error={errors.capaciteBenevoles?.message}
                hint={r?.benevolesConfirmes ? `Au moins ${r.benevolesConfirmes} : déjà inscrits. Vide : sans limite.` : "Vide : sans limite."}
              >
                <Input
                  id="capaciteBenevoles"
                  type="number"
                  inputMode="numeric"
                  min={Math.max(1, r?.benevolesConfirmes ?? 0)}
                  {...register("capaciteBenevoles", {
                    // Champ vide : illimite (valueAsNumber donnerait NaN, refuse par la validation).
                    setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
                  })}
                />
              </FormField>
            </div>
          </SectionFormulaire>

          <SectionFormulaire titre="Description">
            <FormField label="À savoir" htmlFor="description" hint="Ce qu'il faut apporter, comment trouver l'entrée. Facultatif.">
              <Textarea id="description" rows={3} {...register("description")} />
            </FormField>
          </SectionFormulaire>

          {erreur && <Alert variant="destructive">{erreur}</Alert>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Spinner size="sm" />}
              {distribution ? "Enregistrer" : "Créer la distribution"}
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
          </div>
          {!distribution && (
            <p className="text-base text-muted-foreground">
              Elle est créée en brouillon : vous la publierez depuis sa feuille.
            </p>
          )}
        </DeuxColonnes>
      </form>
    </APIProvider>
  );
}
