"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  { value: "francaise", label: "Française" },
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

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

function SelectField({ id, label, value, onChange, options, placeholder = "-- Choisir --" }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value || undefined} onValueChange={(v) => { if (v !== null) onChange(v); }}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function FormulaireProfilBeneficiaire({ profil }: Props) {
  const router = useRouter();
  const [dateNaissance, setDateNaissance] = useState(profil.dateNaissance ?? "");
  const [statutBoursier, setStatutBoursier] = useState(profil.statutBoursier ?? "");
  const [echelonBourse, setEchelonBourse] = useState(
    profil.echelonBourse != null ? String(profil.echelonBourse) : "",
  );
  const [categorieNationalite, setCategorieNationalite] = useState(
    profil.categorieNationalite ?? "",
  );
  const [resteAVivre, setResteAVivre] = useState(
    profil.resteAVivreMensuel != null ? String(profil.resteAVivreMensuel) : "",
  );
  const [niveauAcademique, setNiveauAcademique] = useState(profil.niveauAcademique ?? "");
  const [etablissement, setEtablissement] = useState(profil.etablissement ?? "");
  const [situationLogement, setSituationLogement] = useState(profil.situationLogement ?? "");
  const [aEmploi, setAEmploi] = useState(
    profil.aEmploiEtudiant != null ? String(profil.aEmploiEtudiant) : "",
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
      setErreur(e.detail ?? e.message ?? "Erreur lors de la mise à jour.");
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
        <Alert className="border-warning/50 bg-warning/10 text-warning text-sm">
          Complétez votre dossier pour faciliter l&apos;inscription aux distributions.
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
          label="Nationalité"
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
            <Label htmlFor="echelonBourse">Échelon de bourse</Label>
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
          label="Niveau académique"
          value={niveauAcademique}
          onChange={setNiveauAcademique}
          options={NIVEAUX_ACADEMIQUES}
        />

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="etablissement">Établissement</Label>
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
          <Label htmlFor="aEmploi">Emploi étudiant</Label>
          <Select value={aEmploi || undefined} onValueChange={(v) => { if (v !== null) setAEmploi(v); }}>
            <SelectTrigger id="aEmploi" className="w-full">
              <SelectValue placeholder="-- Choisir --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Oui</SelectItem>
              <SelectItem value="false">Non</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {succes && (
        <div className="flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-primary">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm">Dossier mis à jour avec succès.</span>
        </div>
      )}
      {erreur && <Alert variant="destructive">{erreur}</Alert>}

      <Button type="submit" disabled={pending}>
        {pending ? <><Spinner size="sm" /> Enregistrement...</> : "Enregistrer le dossier"}
      </Button>
    </form>
  );
}
