"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { creerEvenement } from "@/lib/api/evenement";
import type { TypeEvenement, PublicCible, ModeInscription } from "@/types/evenement";

interface FormState {
  titre: string;
  description: string;
  type: TypeEvenement;
  lieuAdresseFormatee: string;
  lieuPlaceId: string;
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
  lieuAdresseFormatee: "",
  lieuPlaceId: "",
  dateHeureDebut: "",
  dateHeureFin: "",
  aBesoiNStaff: true,
  capaciteStaff: "",
  ouvertParticipants: false,
  publicParticipants: "",
  capaciteParticipants: "",
  modeInscription: "OBLIGATOIRE",
};

export function FormulaireEvenement() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INIT);
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErreur(null);
    try {
      const evenement = await creerEvenement({
        titre: form.titre,
        description: form.description || undefined,
        type: form.type,
        lieuAdresseFormatee: form.lieuAdresseFormatee || undefined,
        lieuPlaceId: form.lieuPlaceId || undefined,
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
      });
      router.push(`/evenements/${evenement.id}`);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-8 max-w-2xl">
      {erreur && (
        <div className="rounded-xl bg-destructive/8 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      {/* Infos generales */}
      <section className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Informations generales</h2>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="titre">
            Titre
          </label>
          <input
            id="titre"
            required
            value={form.titre}
            onChange={(e) => set("titre", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="type">
            Type
          </label>
          <select
            id="type"
            value={form.type}
            onChange={(e) => set("type", e.target.value as TypeEvenement)}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="STAND">Stand</option>
            <option value="FETE">Fete</option>
            <option value="AUTRE">Autre</option>
          </select>
        </div>
      </section>

      {/* Lieu et dates */}
      <section className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Lieu et dates</h2>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="lieu">
            Adresse
          </label>
          <input
            id="lieu"
            value={form.lieuAdresseFormatee}
            onChange={(e) => set("lieuAdresseFormatee", e.target.value)}
            placeholder="Adresse du lieu"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="debut">
              Debut
            </label>
            <input
              id="debut"
              type="datetime-local"
              required
              value={form.dateHeureDebut}
              onChange={(e) => set("dateHeureDebut", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="fin">
              Fin
            </label>
            <input
              id="fin"
              type="datetime-local"
              required
              value={form.dateHeureFin}
              onChange={(e) => set("dateHeureFin", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </section>

      {/* Besoin staff */}
      <section className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Besoin de staff benevole</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.aBesoiNStaff}
            onChange={(e) => set("aBesoiNStaff", e.target.checked)}
            className="size-4 rounded accent-primary"
          />
          <span className="text-sm text-foreground">Cet evenement recherche des benevoles staff</span>
        </label>
        {form.aBesoiNStaff && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="capStaff">
              Nombre de staff max (optionnel)
            </label>
            <input
              id="capStaff"
              type="number"
              min={1}
              value={form.capaciteStaff}
              onChange={(e) => set("capaciteStaff", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        )}
      </section>

      {/* Ouverture participants */}
      <section className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Ouverture aux participants</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.ouvertParticipants}
            onChange={(e) => set("ouvertParticipants", e.target.checked)}
            className="size-4 rounded accent-primary"
          />
          <span className="text-sm text-foreground">
            Cet evenement est ouvert aux participants
          </span>
        </label>
        {form.ouvertParticipants && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="publicCible">
                Public cible
              </label>
              <select
                id="publicCible"
                value={form.publicParticipants}
                onChange={(e) => set("publicParticipants", e.target.value as PublicCible)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">-- Choisir --</option>
                <option value="BENEVOLES">Benevoles uniquement</option>
                <option value="BENEFICIAIRES">Beneficiaires uniquement</option>
                <option value="TOUS">Tous</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="capParticipants">
                Nombre de participants max (optionnel)
              </label>
              <input
                id="capParticipants"
                type="number"
                min={1}
                value={form.capaciteParticipants}
                onChange={(e) => set("capaciteParticipants", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        )}
      </section>

      {/* Mode inscription */}
      <section className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Mode d&apos;inscription</h2>
        <div className="space-y-2">
          {(
            [
              { value: "OBLIGATOIRE", label: "Obligatoire", desc: "Inscription requise, pointage disponible" },
              { value: "LIBRE", label: "Libre", desc: "Inscription sans pointage" },
              { value: "SANS_INSCRIPTION", label: "Sans inscription", desc: "Participation libre, pas de liste" },
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
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {pending ? "Creation..." : "Creer l'evenement"}
        </button>
      </div>
    </form>
  );
}
