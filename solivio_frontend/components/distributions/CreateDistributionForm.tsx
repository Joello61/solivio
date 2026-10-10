"use client";

import { lireCleGoogleMaps } from "@/lib/api/config";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { creerDistribution } from "@/lib/api/distributions";
import { AdresseAutocomplete } from "@/components/distributions/AdresseAutocomplete";
import type { LieuRequest } from "@/types/distribution";

// Schéma
const creneauSchema = z.object({
  heureDebut: z.string().min(1, "Heure de début requise"),
  heureFin: z.string().min(1, "Heure de fin requise"),
  capacite: z.number().int().positive("La capacite doit être positive"),
});

const schema = z.object({
  titre: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().optional(),
  date: z.string().min(1, "La date est requise"),
  capaciteBeneficiaires: z.number().int().positive("La capacite doit être positive"),
  capaciteBenevoles: z.number().int().positive().optional(),
  modeCreneau: z.enum(["CRENEAU_UNIQUE", "CRENEAUX_DECOUPES"]),
  creneaux: z.array(creneauSchema).min(1, "Au moins un créneau est requis"),
});

type FormValues = z.infer<typeof schema>;

// Barre de progression
const STEPS = ["Informations & lieu", "Créneaux horaires"];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold font-display transition-colors",
                  done
                    ? "bg-primary text-primary-foreground"
                    : active
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={[
                  "text-xs font-medium whitespace-nowrap",
                  active ? "text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={[
                  "flex-1 h-0.5 mx-2 mb-4 rounded-full transition-colors",
                  done ? "bg-primary" : "bg-border",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Composant principal
export function CreateDistributionForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
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
    control,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      modeCreneau: "CRENEAU_UNIQUE",
      creneaux: [{ heureDebut: "10:00", heureFin: "12:00", capacite: 50 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "creneaux" });

  /* Validation de l'étape 1 avant de passer à l'étape 2 */
  async function allerEtape2() {
    const ok = await trigger(["titre", "date", "capaciteBeneficiaires"]);
    if (ok) setStep(1);
  }

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

  if (mapsApiKey === null) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <APIProvider apiKey={mapsApiKey} libraries={["places"]}>
      <div>
        <StepBar current={step} />

        <form onSubmit={handleSubmit(onSubmit)}>
          {erreur && (
            <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {erreur}
            </div>
          )}

          {/* ÉTAPE 1 : Informations et lieu */}
          {step === 0 && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm animate-fade-in">
              {/* Section : Informations générales */}
              <div className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground font-display">
                  Informations générales
                </h3>

                <div className="space-y-1.5">
                  <Label htmlFor="titre">
                    Titre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="titre"
                    {...register("titre")}
                    placeholder="Distribution du 15 janvier"
                  />
                  {errors.titre && (
                    <p className="text-xs text-destructive">{errors.titre.message}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="date">
                      Date <span className="text-destructive">*</span>
                    </Label>
                    <Input id="date" type="date" {...register("date")} />
                    {errors.date && (
                      <p className="text-xs text-destructive">{errors.date.message}</p>
                    )}
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

              <hr className="border-border/60" />

              {/* Section : Capacités */}
              <div className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground font-display">
                  Capacités
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="capaciteBeneficiaires">
                      Bénéficiaires <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="capaciteBeneficiaires"
                      type="number"
                      min={1}
                      {...register("capaciteBeneficiaires", { valueAsNumber: true })}
                    />
                    {errors.capaciteBeneficiaires && (
                      <p className="text-xs text-destructive">
                        {errors.capaciteBeneficiaires.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="capaciteBenevoles">Bénévoles</Label>
                    <Input
                      id="capaciteBenevoles"
                      type="number"
                      min={1}
                      placeholder="Illimité"
                      {...register("capaciteBenevoles", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>

              <hr className="border-border/60" />

              {/* Boutons */}
              <div className="px-5 py-4 flex justify-end">
                <Button type="button" onClick={allerEtape2} className="gap-1.5">
                  Suivant <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : Créneaux horaires */}
          {step === 1 && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm animate-fade-in">
              {/* Section : Créneaux horaires */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground font-display">
                    Créneaux horaires
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ heureDebut: "", heureFin: "", capacite: 50 })}
                  >
                    <Plus className="mr-1 size-3.5" />
                    Ajouter
                  </Button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-end gap-2 rounded-xl border border-border/60 bg-muted/40 p-3"
                    >
                      <div className="flex-1 space-y-1">
                        <Label htmlFor={`creneaux.${index}.heureDebut`} className="text-xs">
                          Début
                        </Label>
                        <Input
                          type="time"
                          {...register(`creneaux.${index}.heureDebut`)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label htmlFor={`creneaux.${index}.heureFin`} className="text-xs">
                          Fin
                        </Label>
                        <Input
                          type="time"
                          {...register(`creneaux.${index}.heureFin`)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label htmlFor={`creneaux.${index}.capacite`} className="text-xs">
                          Places
                        </Label>
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

              <hr className="border-border/60" />

              {/* Boutons */}
              <div className="px-5 py-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="gap-1.5"
                >
                  <ChevronLeft className="size-4" /> Retour
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" className="mr-2" /> Création en cours...
                    </>
                  ) : (
                    "Créer la distribution"
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </APIProvider>
  );
}
