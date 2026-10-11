"use client";

import { lireCleGoogleMaps } from "@/lib/api/config";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdresseAutocomplete } from "@/components/distributions/AdresseAutocomplete";
import { creerEvenement, modifierEvenement } from "@/lib/api/evenement";
import { versSaisieDateHeure } from "@/lib/utils";
import type {
  EvenementResponse,
  TypeEvenement,
  PublicCible,
  ModeInscription,
} from "@/types/evenement";
import type { LieuRequest } from "@/types/distribution";

// État du formulaire
interface FormState {
  titre: string;
  description: string;
  type: TypeEvenement;
  dateHeureDebut: string;
  dateHeureFin: string;
  aBesoiNStaff: boolean;
  capaciteStaff: string;
  ouvertParticipants: boolean;
  publicParticipants: PublicCible | "";
  capaciteParticipants: string;
  modeInscription: ModeInscription;
}

const INIT: FormState = {
  titre: "",
  description: "",
  type: "AUTRE",
  dateHeureDebut: "",
  dateHeureFin: "",
  aBesoiNStaff: true,
  capaciteStaff: "",
  ouvertParticipants: false,
  publicParticipants: "",
  capaciteParticipants: "",
  modeInscription: "OBLIGATOIRE",
};

function etatInitial(evenement?: EvenementResponse): FormState {
  if (!evenement) return INIT;
  return {
    titre: evenement.titre,
    description: evenement.description ?? "",
    type: evenement.type,
    dateHeureDebut: versSaisieDateHeure(evenement.dateHeureDebut),
    dateHeureFin: versSaisieDateHeure(evenement.dateHeureFin),
    aBesoiNStaff: evenement.aBesoiNStaff,
    capaciteStaff: evenement.capaciteStaff?.toString() ?? "",
    ouvertParticipants: evenement.ouvertParticipants,
    publicParticipants: evenement.publicParticipants ?? "",
    capaciteParticipants: evenement.capaciteParticipants?.toString() ?? "",
    modeInscription: evenement.modeInscription,
  };
}

function lieuInitial(evenement?: EvenementResponse): LieuRequest | undefined {
  if (!evenement?.lieuAdresseFormatee) return undefined;
  return {
    placeId: evenement.lieuPlaceId ?? undefined,
    adresseFormatee: evenement.lieuAdresseFormatee,
    latitude: evenement.lieuLatitude ?? undefined,
    longitude: evenement.lieuLongitude ?? undefined,
  };
}

// Base UI n'affiche le libelle de la valeur choisie que si on lui passe les items.
const TYPES = [
  { value: "STAND", label: "Stand" },
  { value: "FETE", label: "Fête" },
  { value: "AUTRE", label: "Autre" },
];

const PUBLICS = [
  { value: "BENEVOLES", label: "Bénévoles uniquement" },
  { value: "BENEFICIAIRES", label: "Bénéficiaires uniquement" },
  { value: "TOUS", label: "Tous" },
];

// Barre de progression
const STEPS = ["Informations & lieu", "Participants & inscription"];

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
export function FormulaireEvenement({ evenement }: { evenement?: EvenementResponse } = {}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => etatInitial(evenement));
  const [lieu, setLieu] = useState<LieuRequest | undefined>(() => lieuInitial(evenement));
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurStep1, setErreurStep1] = useState<string | null>(null);
  const [mapsApiKey, setMapsApiKey] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    lireCleGoogleMaps().then(setMapsApiKey);
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function allerEtape2() {
    if (!form.titre.trim()) {
      setErreurStep1("Le titre est requis.");
      return;
    }
    if (!form.dateHeureDebut || !form.dateHeureFin) {
      setErreurStep1("Les dates de début et de fin sont requises.");
      return;
    }
    if (form.dateHeureFin <= form.dateHeureDebut) {
      setErreurStep1("La date de fin doit être après la date de début.");
      return;
    }
    setErreurStep1(null);
    setStep(1);
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErreur(null);
    try {
      const payload = {
        titre: form.titre,
        description: form.description || undefined,
        type: form.type,
        lieuPlaceId: lieu?.placeId,
        lieuAdresseFormatee: lieu?.adresseFormatee,
        lieuLatitude: lieu?.latitude,
        lieuLongitude: lieu?.longitude,
        dateHeureDebut: new Date(form.dateHeureDebut).toISOString(),
        dateHeureFin: new Date(form.dateHeureFin).toISOString(),
        aBesoiNStaff: form.aBesoiNStaff,
        capaciteStaff: form.capaciteStaff ? Number(form.capaciteStaff) : undefined,
        ouvertParticipants: form.ouvertParticipants,
        publicParticipants: form.publicParticipants || undefined,
        capaciteParticipants: form.capaciteParticipants
          ? Number(form.capaciteParticipants)
          : undefined,
        modeInscription: form.modeInscription,
      };
      const enregistre = evenement
        ? await modifierEvenement(evenement.id, payload)
        : await creerEvenement(payload);
      router.push(`/evenements/${enregistre.id}`);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setPending(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors";

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

        {/* ETAPE 1 : Informations et lieu */}
        {step === 0 && (
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm animate-fade-in">
            {erreurStep1 && (
              <div className="px-6 pt-5">
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {erreurStep1}
                </div>
              </div>
            )}

            {/* Section : Informations générales */}
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground font-display">
                Informations générales
              </h3>

              <div className="space-y-1.5">
                <Label htmlFor="titre">
                  Titre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="titre"
                  required
                  value={form.titre}
                  onChange={(e) => set("titre", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <Select
                  items={TYPES}
                  value={form.type}
                  onValueChange={(v) => set("type", v as TypeEvenement)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Choisir un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <hr className="border-border/60" />

            {/* Section : Lieu et dates */}
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground font-display">
                Lieu et dates
              </h3>

              <div className="space-y-1.5">
                <Label>Adresse</Label>
                <AdresseAutocomplete
                  value={lieu?.adresseFormatee}
                  onSelect={setLieu}
                  onClear={() => setLieu(undefined)}
                  placeholder="Rechercher une adresse..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="debut">
                    Début <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="debut"
                    type="datetime-local"
                    required
                    value={form.dateHeureDebut}
                    onChange={(e) => set("dateHeureDebut", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fin">
                    Fin <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fin"
                    type="datetime-local"
                    required
                    value={form.dateHeureFin}
                    onChange={(e) => set("dateHeureFin", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <hr className="border-border/60" />

            {/* Boutons */}
            <div className="px-6 py-4 flex justify-end">
              <Button type="button" onClick={allerEtape2} className="gap-1.5">
                Suivant <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ETAPE 2 : Participants et inscription */}
        {step === 1 && (
          <form onSubmit={soumettre} className="animate-fade-in">
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
              {erreur && (
                <div className="px-6 pt-5">
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {erreur}
                  </div>
                </div>
              )}

              {/* Section : Besoin staff */}
              <div className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-foreground font-display">
                  Besoin de staff bénévole
                </h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.aBesoiNStaff}
                    onChange={(e) => set("aBesoiNStaff", e.target.checked)}
                    className="size-4 rounded accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    Cet événement recherche des bénévoles staff
                  </span>
                </label>
                {form.aBesoiNStaff && (
                  <div className="space-y-1.5">
                    <Label htmlFor="capStaff">Nombre de staff max (optionnel)</Label>
                    <Input
                      id="capStaff"
                      type="number"
                      min={1}
                      value={form.capaciteStaff}
                      onChange={(e) => set("capaciteStaff", e.target.value)}
                    />
                  </div>
                )}
              </div>

              <hr className="border-border/60" />

              {/* Section : Ouverture participants */}
              <div className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-foreground font-display">
                  Ouverture aux participants
                </h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.ouvertParticipants}
                    onChange={(e) => set("ouvertParticipants", e.target.checked)}
                    className="size-4 rounded accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    Cet événement est ouvert aux participants
                  </span>
                </label>
                {form.ouvertParticipants && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="publicCible">Public cible</Label>
                      <Select
                        items={PUBLICS}
                        value={form.publicParticipants}
                        onValueChange={(v) => set("publicParticipants", v as PublicCible)}
                      >
                        <SelectTrigger id="publicCible">
                          <SelectValue placeholder="-- Choisir --" />
                        </SelectTrigger>
                        <SelectContent>
                          {PUBLICS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="capParticipants">
                        Nombre de participants max (optionnel)
                      </Label>
                      <Input
                        id="capParticipants"
                        type="number"
                        min={1}
                        value={form.capaciteParticipants}
                        onChange={(e) => set("capaciteParticipants", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-border/60" />

              {/* Section : Mode inscription */}
              <div className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-foreground font-display">
                  Mode d&apos;inscription
                </h3>
                <div className="space-y-2">
                  {(
                    [
                      {
                        value: "OBLIGATOIRE",
                        label: "Obligatoire",
                        desc: "Inscription requise, pointage disponible",
                      },
                      {
                        value: "LIBRE",
                        label: "Libre",
                        desc: "Inscription sans pointage",
                      },
                      {
                        value: "SANS_INSCRIPTION",
                        label: "Sans inscription",
                        desc: "Participation libre, pas de liste",
                      },
                    ] as const
                  ).map((opt) => (
                    <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="modeInscription"
                        value={opt.value}
                        checked={form.modeInscription === opt.value}
                        onChange={() => set("modeInscription", opt.value)}
                        className="mt-0.5 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <hr className="border-border/60" />

              {/* Boutons */}
              <div className="px-6 py-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="gap-1.5"
                >
                  <ChevronLeft className="size-4" /> Retour
                </Button>
                <Button type="submit" disabled={pending} className="flex-1">
                  {pending ? (
                    <>
                      <Spinner size="sm" className="mr-2" /> Enregistrement...
                    </>
                  ) : evenement ? (
                    "Enregistrer les modifications"
                  ) : (
                    "Créer l'événement"
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </APIProvider>
  );
}
