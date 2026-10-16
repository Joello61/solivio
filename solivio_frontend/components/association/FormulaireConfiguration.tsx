"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { SectionFormulaire } from "@/components/shared/SectionFormulaire";
import { mettreAJourAssociation, uploadLogo } from "@/lib/api/association";
import type { AssociationResponse } from "@/types/association";

interface Props {
  association: AssociationResponse;
}

export function FormulaireConfiguration({ association }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [logoErreur, setLogoErreur] = useState<string | null>(null);

  const [nom, setNom] = useState(association.nom);
  const [logoUrl, setLogoUrl] = useState(association.logoUrl ?? "");
  const [frequenceMax, setFrequenceMax] = useState<string>(
    association.frequenceMaxParSemaine?.toString() ?? "",
  );
  const [contactEmail, setContactEmail] = useState(association.contactEmail ?? "");
  const [contactTelephone, setContactTelephone] = useState(association.contactTelephone ?? "");

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoErreur(null);
    setLogoUploading(true);
    try {
      const updated = await uploadLogo(file);
      setLogoUrl(updated.logoUrl ?? "");
      router.refresh();
    } catch (err) {
      const e2 = err as { detail?: string; message?: string };
      setLogoErreur(e2.detail ?? e2.message ?? "Le logo n'a pas pu être envoyé.");
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErreur(null);
    setSucces(false);
    try {
      await mettreAJourAssociation({
        nom: nom.trim() || undefined,
        logoUrl: logoUrl || undefined,
        // 0 remet la limite par defaut : l'API ignore une valeur absente.
        frequenceMaxParSemaine: frequenceMax ? parseInt(frequenceMax, 10) : 0,
        contactEmail: contactEmail || undefined,
        contactTelephone: contactTelephone || undefined,
      });
      setSucces(true);
      router.refresh();
    } catch (err) {
      const e2 = err as { detail?: string; message?: string };
      setErreur(e2.detail ?? e2.message ?? "Les réglages n'ont pas pu être enregistrés.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-6">
      <SectionFormulaire titre="Identité">
        <FormField label="Nom de l'association" htmlFor="nom">
          <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} minLength={2} maxLength={255} />
        </FormField>
        <FormField label="Logo" hint="JPG, PNG, GIF ou WEBP, 2 Mo au plus." error={logoErreur ?? undefined}>
          <div className="flex items-center gap-3">
            {logoUrl && (
              <Image
                src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}${logoUrl}`}
                alt="Logo actuel"
                width={48}
                height={48}
                className="rounded-md border border-border bg-muted object-contain p-1"
              />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleLogoChange}
              aria-label="Choisir un fichier logo"
            />
            <Button type="button" variant="outline" disabled={logoUploading} onClick={() => fileInputRef.current?.click()}>
              {logoUploading ? <Spinner size="sm" /> : <Upload aria-hidden="true" />}
              {logoUrl ? "Changer le logo" : "Choisir un logo"}
            </Button>
          </div>
        </FormField>
      </SectionFormulaire>

      <SectionFormulaire titre="Règles">
        <FormField
          label="Distributions par semaine et par bénéficiaire"
          htmlFor="frequenceMax"
          hint="Les inscriptions confirmées et en liste d'attente comptent. Laissez vide pour la limite par défaut : une par semaine."
        >
          <Input
            id="frequenceMax"
            type="number"
            inputMode="numeric"
            min="1"
            max="7"
            value={frequenceMax}
            onChange={(e) => setFrequenceMax(e.target.value)}
            placeholder="1"
            className="w-40"
          />
        </FormField>
      </SectionFormulaire>

      <SectionFormulaire titre="Contact">
        <FormField label="Email de contact" htmlFor="contactEmail">
          <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </FormField>
        <FormField label="Téléphone de contact" htmlFor="contactTelephone">
          <Input id="contactTelephone" type="tel" value={contactTelephone} onChange={(e) => setContactTelephone(e.target.value)} />
        </FormField>
      </SectionFormulaire>

      {erreur && <Alert variant="destructive">{erreur}</Alert>}
      {succes && (
        <Alert role="status">
          <CheckCircle aria-hidden="true" />
          Configuration mise à jour.
        </Alert>
      )}
      <Button type="submit" size="lg" disabled={pending} className="self-end">
        {pending && <Spinner size="sm" />}
        Enregistrer
      </Button>
    </form>
  );
}
