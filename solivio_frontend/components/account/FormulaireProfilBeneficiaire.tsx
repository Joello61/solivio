"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { mettreAJourProfilBeneficiaire } from "@/lib/api/profil";
import type { ProfilBeneficiaireResponse } from "@/types/profil";

interface Props {
  profil: ProfilBeneficiaireResponse;
}

const STATUTS_BOURSIER = [
  { value: "boursier", label: "Boursier" },
  { value: "non_boursier", label: "Non boursier" },
];

const CATEGORIES_NATIONALITE = [
  { value: "francaise", label: "Francaise" },
  { value: "ressortissant_ue", label: "Ressortissant UE" },
  { value: "hors_ue", label: "Hors UE" },
];

const NIVEAUX_ACADEMIQUES = [
  { value: "L1", label: "Licence 1" },
  { value: "L2", label: "Licence 2" },
  { value: "L3", label: "Licence 3" },
  { value: "M1", label: "Master 1" },
  { value: "M2", label: "Master 2" },
  { value: "doctorat", label: "Doctorat" },
  { value: "BTS", label: "BTS" },
  { value: "autre", label: "Autre" },
];

const SITUATIONS_LOGEMENT = [
  { value: "seul", label: "Seul(e)" },
  { value: "colocation", label: "Colocation" },
  { value: "chez_parents", label: "Chez les parents" },
  { value: "residence", label: "Residence universitaire" },
  { value: "sans_domicile_stable", label: "Sans domicile stable" },
  { value: "autre", label: "Autre" },
];

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "-- Choisir --",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FormulaireProfilBeneficiaire({ profil }: Props) {
  const router = useRouter();
  const [dateNaissance, setDateNaissance] = useState(profil.dateNaissance ?? "");
  const [statutBoursier, setStatutBoursier] = useState(profil.statutBoursier ?? "");
  const [echelonBourse, setEchelonBourse] = useState(
    profil.echelonBourse != null ? String(profil.echelonBourse) : ""
  );
  const [categorieNationalite, setCategorieNationalite] = useState(
    profil.categorieNationalite ?? ""
  );
  const [resteAVivre, setResteAVivre] = useState(
    profil.resteAVivreMensuel != null ? String(profil.resteAVivreMensuel) : ""
  );
  const [niveauAcademique, setNiveauAcademique] = useState(profil.niveauAcademique ?? "");
  const [etablissement, setEtablissement] = useState(profil.etablissement ?? "");
  const [situationLogement, setSituationLogement] = useState(profil.situationLogement ?? "");
  const [aEmploi, setAEmploi] = useState(
    profil.aEmploiEtudiant != null ? String(profil.aEmploiEtudiant) : ""
  );
  const [pending, setPending] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErreur(null);
    setSucces(false);
    try {
      await mettreAJourProfilBeneficiaire({
        dateNaissance: dateNaissance || null,
        statutBoursier: statutBoursier || null,
        echelonBourse: echelonBourse !== "" ? Number(echelonBourse) : null,
        categorieNationalite: categorieNationalite || null,
        resteAVivreMensuel: resteAVivre !== "" ? Number(resteAVivre) : null,
        niveauAcademique: niveauAcademique || null,
        etablissement: etablissement || null,
        situationLogement: situationLogement || null,
        aEmploiEtudiant: aEmploi !== "" ? aEmploi === "true" : null,
      });
      setSucces(true);
      router.refresh();
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      setErreur(e.detail ?? e.message ?? "Erreur lors de la mise a jour.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-medium">Informations sociales</h2>
        <Badge variant={profil.complet ? "default" : "secondary"}>
          {profil.complet ? "Complet" : "Incomplet"}
        </Badge>
      </div>

      {!profil.complet && (
        <Alert className="border-amber-500/50 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 text-sm">
          Completez votre dossier pour faciliter l&apos;inscription aux distributions.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="dateNaissance">Date de naissance</Label>
          <Input
            id="dateNaissance"
            type="date"
            value={dateNaissance}
            onChange={(e) => setDateNaissance(e.target.value)}
          />
        </div>

        <SelectField
          id="categorieNationalite"
          label="Nationalite"
          value={categorieNationalite}
          onChange={setCategorieNationalite}
          options={CATEGORIES_NATIONALITE}
        />

        <SelectField
          id="statutBoursier"
          label="Statut boursier"
          value={statutBoursier}
          onChange={setStatutBoursier}
          options={STATUTS_BOURSIER}
        />

        {statutBoursier === "boursier" && (
          <div className="space-y-1.5">
            <Label htmlFor="echelonBourse">Echelon de bourse</Label>
            <Input
              id="echelonBourse"
              type="number"
              min={0}
              max={7}
              value={echelonBourse}
              onChange={(e) => setEchelonBourse(e.target.value)}
              placeholder="0 a 7"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="resteAVivre">Reste a vivre mensuel (euros)</Label>
          <Input
            id="resteAVivre"
            type="number"
            min={0}
            step="0.01"
            value={resteAVivre}
            onChange={(e) => setResteAVivre(e.target.value)}
            placeholder="ex : 350"
          />
        </div>

        <SelectField
          id="niveauAcademique"
          label="Niveau academique"
          value={niveauAcademique}
          onChange={setNiveauAcademique}
          options={NIVEAUX_ACADEMIQUES}
        />

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="etablissement">Etablissement</Label>
          <Input
            id="etablissement"
            value={etablissement}
            onChange={(e) => setEtablissement(e.target.value)}
            maxLength={255}
            placeholder="Nom de votre universite ou ecole"
          />
        </div>

        <SelectField
          id="situationLogement"
          label="Situation de logement"
          value={situationLogement}
          onChange={setSituationLogement}
          options={SITUATIONS_LOGEMENT}
        />

        <div className="space-y-1.5">
          <Label htmlFor="aEmploi">Emploi etudiant</Label>
          <select
            id="aEmploi"
            value={aEmploi}
            onChange={(e) => setAEmploi(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">-- Choisir --</option>
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        </div>
      </div>

      {succes && (
        <Alert className="border-green-500/50 bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-400">
          Dossier mis a jour avec succes.
        </Alert>
      )}
      {erreur && <Alert variant="destructive">{erreur}</Alert>}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement..." : "Enregistrer le dossier"}
      </Button>
    </form>
  );
}
