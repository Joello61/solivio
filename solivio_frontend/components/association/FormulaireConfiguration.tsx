"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
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
  const [couleurPrimaire, setCouleurPrimaire] = useState(association.couleurPrimaire ?? "#16513F");
  const [couleurSecondaire, setCouleurSecondaire] = useState(association.couleurSecondaire ?? "#1E6B52");
  const [fuseauHoraire, setFuseauHoraire] = useState(association.fuseauHoraire ?? "Europe/Paris");
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
      setLogoErreur(e2.detail ?? e2.message ?? "Erreur lors du telechargement du logo.");
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
        couleurPrimaire,
        couleurSecondaire,
        fuseauHoraire: fuseauHoraire || undefined,
        frequenceMaxParSemaine: frequenceMax ? parseInt(frequenceMax, 10) : null,
        contactEmail: contactEmail || undefined,
        contactTelephone: contactTelephone || undefined,
      });
      setSucces(true);
      router.refresh();
    } catch (err) {
      const e2 = err as { detail?: string; message?: string };
      setErreur(e2.detail ?? e2.message ?? "Erreur lors de la mise à jour.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-6">
      {erreur && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}
      {succes && (
        <div className="flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-primary">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm">Configuration mise à jour avec succes.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 items-start">
        {/* Colonne gauche : identite visuelle */}
        <div className="space-y-6">
          <p className="text-sm font-semibold text-foreground font-display">Identite visuelle</p>

          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom de l&apos;association</Label>
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              minLength={2}
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            {logoUrl && (
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-lg border border-border/60 bg-muted p-1.5">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}${logoUrl}`}
                    alt="Logo actuel"
                    width={48}
                    height={48}
                    className="rounded object-contain"
                  />
                </div>
                <span className="text-sm text-muted-foreground">Logo actuel</span>
              </div>
            )}
            {logoErreur && <p className="text-sm text-destructive">{logoErreur}</p>}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleLogoChange}
                aria-label="Choisir un fichier logo"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={logoUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {logoUploading ? (
                  <><Spinner size="sm" /> Telechargement...</>
                ) : (
                  <><Upload className="mr-2 h-4 w-4" />Choisir un logo</>
                )}
              </Button>
              <span className="text-xs text-muted-foreground">JPG, PNG, GIF ou WEBP - 2 Mo max</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="couleurPrimaire">Couleur primaire</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={couleurPrimaire}
                  onChange={(e) => setCouleurPrimaire(e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded-lg border border-input p-0.5 bg-background"
                  aria-label="Choisir couleur primaire"
                />
                <Input
                  id="couleurPrimaire"
                  value={couleurPrimaire}
                  onChange={(e) => setCouleurPrimaire(e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="couleurSecondaire">Couleur secondaire</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={couleurSecondaire}
                  onChange={(e) => setCouleurSecondaire(e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded-lg border border-input p-0.5 bg-background"
                  aria-label="Choisir couleur secondaire"
                />
                <Input
                  id="couleurSecondaire"
                  value={couleurSecondaire}
                  onChange={(e) => setCouleurSecondaire(e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite : parametres */}
        <div className="space-y-6">
          <p className="text-sm font-semibold text-foreground font-display">Paramètres</p>

          <div className="space-y-1.5">
            <Label htmlFor="fuseauHoraire">Fuseau horaire</Label>
            <Input
              id="fuseauHoraire"
              value={fuseauHoraire}
              onChange={(e) => setFuseauHoraire(e.target.value)}
              placeholder="Europe/Paris"
            />
            <p className="text-xs text-muted-foreground">Format IANA : Europe/Paris, America/New_York, etc.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="frequenceMax">Fréquence max par semaine</Label>
            <Input
              id="frequenceMax"
              type="number"
              min="1"
              max="7"
              value={frequenceMax}
              onChange={(e) => setFrequenceMax(e.target.value)}
              placeholder="Illimitee"
            />
            <p className="text-xs text-muted-foreground">Laisser vide pour ne pas limiter.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contactEmail">Email de contact</Label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@association.fr"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contactTelephone">Téléphone de contact</Label>
            <Input
              id="contactTelephone"
              value={contactTelephone}
              onChange={(e) => setContactTelephone(e.target.value)}
              placeholder="+33 1 23 45 67 89"
            />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-border/60">
        <Button type="submit" disabled={pending}>
          {pending ? <><Spinner size="sm" /> Enregistrement...</> : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
