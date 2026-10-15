"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdresseAutocomplete } from "@/components/distributions/AdresseAutocomplete";
import { SectionFormulaire } from "@/components/shared/SectionFormulaire";
import { MODE_INSCRIPTION, PUBLIC_CIBLE } from "@/lib/activites";
import { lireCleGoogleMaps } from "@/lib/api/config";
import { creerEvenement, modifierEvenement } from "@/lib/api/evenement";
import { messageErreur } from "@/lib/erreurs";
import { versSaisieDateHeure } from "@/lib/utils";
import type {
  EvenementResponse,
  TypeEvenement,
  PublicCible,
  ModeInscription,
} from "@/types/evenement";
import type { LieuRequest } from "@/types/distribution";

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

const MODES: ModeInscription[] = ["OBLIGATOIRE", "LIBRE", "SANS_INSCRIPTION"];

/* Validation avant envoi : le backend revalide tout. */
function verifier(form: FormState): string | null {
  if (!form.titre.trim()) return "Donnez un titre à l'événement.";
  if (!form.dateHeureDebut || !form.dateHeureFin) return "Indiquez le début et la fin.";
  if (form.dateHeureFin <= form.dateHeureDebut) return "La fin doit venir après le début.";
  if (!form.aBesoiNStaff && !form.ouvertParticipants) return "Cherchez une équipe, des participants, ou les deux.";
  if (form.ouvertParticipants && !form.publicParticipants) return "Choisissez à qui l'événement est ouvert.";
  return null;
}

function Choix({ id, checked, onChange, titre, detail }: { id: string; checked: boolean; onChange: (v: boolean) => void; titre: string; detail: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4">
      <span className="flex flex-col gap-0.5">
        <span className="text-base font-semibold text-foreground">{titre}</span>
        <span className="text-sm text-muted-foreground">{detail}</span>
      </span>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-1" />
    </label>
  );
}

/* Creation et modification d'un evenement, en une colonne. */
export function FormulaireEvenement({ evenement }: { evenement?: EvenementResponse } = {}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => etatInitial(evenement));
  const [lieu, setLieu] = useState<LieuRequest | undefined>(() => lieuInitial(evenement));
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
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

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    const probleme = verifier(form);
    if (probleme) {
      setErreur(probleme);
      return;
    }
    setPending(true);
    setErreur(null);
    try {
      const payload = {
        titre: form.titre.trim(),
        description: form.description || undefined,
        type: form.type,
        lieuPlaceId: lieu?.placeId,
        lieuAdresseFormatee: lieu?.adresseFormatee,
        lieuLatitude: lieu?.latitude,
        lieuLongitude: lieu?.longitude,
        dateHeureDebut: new Date(form.dateHeureDebut).toISOString(),
        dateHeureFin: new Date(form.dateHeureFin).toISOString(),
        aBesoiNStaff: form.aBesoiNStaff,
        capaciteStaff: form.aBesoiNStaff && form.capaciteStaff ? Number(form.capaciteStaff) : undefined,
        ouvertParticipants: form.ouvertParticipants,
        publicParticipants: form.ouvertParticipants ? form.publicParticipants || undefined : undefined,
        capaciteParticipants: form.ouvertParticipants && form.capaciteParticipants ? Number(form.capaciteParticipants) : undefined,
        modeInscription: form.modeInscription,
      };
      const enregistre = evenement ? await modifierEvenement(evenement.id, payload) : await creerEvenement(payload);
      router.push(`/evenements/${enregistre.id}`);
      router.refresh();
    } catch (err) {
      setErreur(messageErreur(err, "L'événement n'a pas pu être enregistré. Réessayez dans un instant."));
    } finally {
      setPending(false);
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
      <form onSubmit={soumettre} noValidate className="flex max-w-2xl flex-col gap-6">
        <SectionFormulaire titre="L'événement">
          <FormField label="Titre" htmlFor="titre" required>
            <Input id="titre" value={form.titre} onChange={(e) => set("titre", e.target.value)} />
          </FormField>
          <FormField label="Type" htmlFor="type">
            <Select items={TYPES} value={form.type} onValueChange={(v) => set("type", v as TypeEvenement)}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Description" htmlFor="description" hint="Ce que les inscrits doivent savoir : programme, tenue, ce qu'il faut apporter.">
            <Textarea id="description" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </FormField>
        </SectionFormulaire>

        <SectionFormulaire titre="Quand et où">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Début" htmlFor="debut" required>
              <Input id="debut" type="datetime-local" value={form.dateHeureDebut} onChange={(e) => set("dateHeureDebut", e.target.value)} />
            </FormField>
            <FormField label="Fin" htmlFor="fin" required>
              <Input id="fin" type="datetime-local" value={form.dateHeureFin} onChange={(e) => set("dateHeureFin", e.target.value)} />
            </FormField>
          </div>
          <FormField label="Adresse">
            <AdresseAutocomplete value={lieu?.adresseFormatee} onSelect={setLieu} onClear={() => setLieu(undefined)} placeholder="Rechercher une adresse" />
          </FormField>
        </SectionFormulaire>

        <SectionFormulaire titre="Qui vient">
          <Choix
            id="staff"
            checked={form.aBesoiNStaff}
            onChange={(v) => set("aBesoiNStaff", v)}
            titre="Une équipe de bénévoles"
            detail="Les bénévoles sont prévenus à la publication et peuvent rejoindre l'équipe."
          />
          {form.aBesoiNStaff && (
            <FormField label="Taille de l'équipe" htmlFor="capStaff" hint="Facultatif. Une fois atteinte, les inscriptions sont refusées : pas de liste d'attente.">
              <Input id="capStaff" type="number" inputMode="numeric" min={1} value={form.capaciteStaff} onChange={(e) => set("capaciteStaff", e.target.value)} className="w-32" />
            </FormField>
          )}
          <Choix
            id="participants"
            checked={form.ouvertParticipants}
            onChange={(v) => {
              set("ouvertParticipants", v);
              if (v && !form.publicParticipants) set("publicParticipants", "TOUS");
            }}
            titre="Des participants"
            detail="Le public choisi est prévenu à la publication et peut s'inscrire."
          />
          {form.ouvertParticipants && (
            <>
              <FormField label="Ouvert à">
                <SegmentedControl
                  label="Ouvert à"
                  value={form.publicParticipants || "TOUS"}
                  onValueChange={(v) => set("publicParticipants", v)}
                  options={(Object.keys(PUBLIC_CIBLE) as PublicCible[]).map((p) => ({ value: p, label: PUBLIC_CIBLE[p] }))}
                />
              </FormField>
              <FormField label="Nombre de participants" htmlFor="capParticipants" hint="Facultatif. Une fois atteint, les inscriptions sont refusées : pas de liste d'attente.">
                <Input
                  id="capParticipants"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={form.capaciteParticipants}
                  onChange={(e) => set("capaciteParticipants", e.target.value)}
                  className="w-32"
                />
              </FormField>
            </>
          )}
        </SectionFormulaire>

        <SectionFormulaire titre="Inscription">
          <RadioGroup value={form.modeInscription} onValueChange={(v) => set("modeInscription", v as ModeInscription)} aria-label="Mode d'inscription" className="gap-3">
            {MODES.map((m) => (
              <label key={m} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-data-checked:border-primary has-data-checked:bg-secondary">
                <RadioGroupItem value={m} className="mt-0.5" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-base font-semibold text-foreground">{MODE_INSCRIPTION[m].libelle}</span>
                  <span className="text-sm text-muted-foreground">{MODE_INSCRIPTION[m].consequence}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </SectionFormulaire>

        {erreur && <Alert variant="destructive">{erreur}</Alert>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" size="lg" disabled={pending}>
            {pending && <Spinner size="sm" />}
            {evenement ? "Enregistrer les modifications" : "Créer le brouillon"}
          </Button>
        </div>
      </form>
    </APIProvider>
  );
}
