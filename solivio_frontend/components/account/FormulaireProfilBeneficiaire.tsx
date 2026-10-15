"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
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
import {
  CATEGORIES_NATIONALITE,
  NIVEAUX_ACADEMIQUES,
  SITUATIONS_LOGEMENT,
  STATUTS_BOURSIER,
} from "@/lib/profil-beneficiaire";

interface Props {
  profil: ProfilBeneficiaireResponse;
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const EMPLOI = [
  { value: "true", label: "Oui" },
  { value: "false", label: "Non" },
];

function SelectField({ id, label, value, onChange, options, placeholder = "Choisir" }: SelectFieldProps) {
  return (
    <FormField label={label} htmlFor={id}>
      <Select items={options} value={value || undefined} onValueChange={(v) => { if (v !== null) onChange(v); }}>
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
    </FormField>
  );
}

function Rubrique({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <legend className="float-left mb-4 w-full font-display text-lg font-bold text-foreground">{titre}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold">Dossier</span>
        <Badge variant={profil.complet ? "success" : "warning"}>
          {profil.complet ? "Complet" : "Incomplet"}
        </Badge>
      </div>

      {!profil.complet && (
        <Alert variant="warning">
          Complétez votre dossier pour faciliter l&apos;inscription aux distributions.
        </Alert>
      )}

      <Rubrique titre="Vous">
        <FormField label="Date de naissance" htmlFor="dateNaissance">
          <Input
            id="dateNaissance"
            type="date"
            value={dateNaissance}
            onChange={(e) => setDateNaissance(e.target.value)}
          />
        </FormField>
        <SelectField
          id="categorieNationalite"
          label="Nationalité"
          value={categorieNationalite}
          onChange={setCategorieNationalite}
          options={CATEGORIES_NATIONALITE}
        />
      </Rubrique>

      <Rubrique titre="Études">
        <SelectField
          id="niveauAcademique"
          label="Niveau académique"
          value={niveauAcademique}
          onChange={setNiveauAcademique}
          options={NIVEAUX_ACADEMIQUES}
        />
        <FormField label="Établissement" htmlFor="etablissement" hint="Université ou école.">
          <Input
            id="etablissement"
            value={etablissement}
            onChange={(e) => setEtablissement(e.target.value)}
            maxLength={255}
          />
        </FormField>
      </Rubrique>

      <Rubrique titre="Ressources">
        <SelectField
          id="statutBoursier"
          label="Statut boursier"
          value={statutBoursier}
          onChange={setStatutBoursier}
          options={STATUTS_BOURSIER}
        />
        {statutBoursier === "boursier" && (
          <FormField label="Échelon de bourse" htmlFor="echelonBourse" hint="De 0 à 7.">
            <Input
              id="echelonBourse"
              type="number"
              min={0}
              max={7}
              value={echelonBourse}
              onChange={(e) => setEchelonBourse(e.target.value)}
            />
          </FormField>
        )}
        <FormField
          label="Reste à vivre mensuel (euros)"
          htmlFor="resteAVivre"
          hint="Ce qu'il vous reste chaque mois après le loyer et les factures."
        >
          <Input
            id="resteAVivre"
            type="number"
            min={0}
            step="0.01"
            value={resteAVivre}
            onChange={(e) => setResteAVivre(e.target.value)}
          />
        </FormField>
        <SelectField id="aEmploi" label="Emploi étudiant" value={aEmploi} onChange={setAEmploi} options={EMPLOI} />
      </Rubrique>

      <Rubrique titre="Logement">
        <SelectField
          id="situationLogement"
          label="Situation de logement"
          value={situationLogement}
          onChange={setSituationLogement}
          options={SITUATIONS_LOGEMENT}
        />
      </Rubrique>

      {succes && (
        <p role="status" className="flex items-center gap-2 text-base font-semibold text-success">
          <CheckCircle aria-hidden="true" className="size-5 shrink-0" />
          Dossier mis à jour.
        </p>
      )}
      {erreur && <Alert variant="destructive">{erreur}</Alert>}

      <Button type="submit" className="self-start" disabled={pending}>
        {pending ? <><Spinner size="sm" /> Enregistrement...</> : "Enregistrer le dossier"}
      </Button>
    </form>
  );
}
