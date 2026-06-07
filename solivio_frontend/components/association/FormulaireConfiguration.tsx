"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mettreAJourAssociation } from "@/lib/api/association";
import type { AssociationResponse } from "@/types/association";

interface Props {
  association: AssociationResponse;
}

export function FormulaireConfiguration({ association }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  const [nom, setNom] = useState(association.nom);
  const [logoUrl, setLogoUrl] = useState(association.logoUrl ?? "");
  const [couleurPrimaire, setCouleurPrimaire] = useState(
    association.couleurPrimaire ?? "#16513F"
  );
  const [couleurSecondaire, setCouleurSecondaire] = useState(
    association.couleurSecondaire ?? "#1E6B52"
  );
  const [fuseauHoraire, setFuseauHoraire] = useState(
    association.fuseauHoraire ?? "Europe/Paris"
  );
  const [frequenceMax, setFrequenceMax] = useState<string>(
    association.frequenceMaxParSemaine?.toString() ?? ""
  );
  const [contactEmail, setContactEmail] = useState(association.contactEmail ?? "");
  const [contactTelephone, setContactTelephone] = useState(
    association.contactTelephone ?? ""
  );

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
        frequenceMaxParSemaine: frequenceMax
          ? parseInt(frequenceMax, 10)
          : null,
        contactEmail: contactEmail || undefined,
        contactTelephone: contactTelephone || undefined,
      });
      setSucces(true);
      router.refresh();
    } catch (err) {
      const e2 = err as { detail?: string; message?: string };
      setErreur(e2.detail ?? e2.message ?? "Erreur lors de la mise a jour.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-6 max-w-lg">
      {erreur && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {erreur}
        </div>
      )}
      {succes && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
          Configuration mise a jour.
        </div>
      )}

      <div className="space-y-2">
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
        <Label htmlFor="logoUrl">URL du logo</Label>
        <Input
          id="logoUrl"
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="couleurPrimaire">Couleur primaire</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={couleurPrimaire}
              onChange={(e) => setCouleurPrimaire(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded border border-input"
            />
            <Input
              id="couleurPrimaire"
              value={couleurPrimaire}
              onChange={(e) => setCouleurPrimaire(e.target.value)}
              pattern="^#[0-9A-Fa-f]{6}$"
              className="font-mono"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="couleurSecondaire">Couleur secondaire</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={couleurSecondaire}
              onChange={(e) => setCouleurSecondaire(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded border border-input"
            />
            <Input
              id="couleurSecondaire"
              value={couleurSecondaire}
              onChange={(e) => setCouleurSecondaire(e.target.value)}
              pattern="^#[0-9A-Fa-f]{6}$"
              className="font-mono"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fuseauHoraire">Fuseau horaire</Label>
        <Input
          id="fuseauHoraire"
          value={fuseauHoraire}
          onChange={(e) => setFuseauHoraire(e.target.value)}
          placeholder="Europe/Paris"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="frequenceMax">
          Frequence max d&apos;inscription par semaine (vide = illimitee)
        </Label>
        <Input
          id="frequenceMax"
          type="number"
          min="1"
          max="7"
          value={frequenceMax}
          onChange={(e) => setFrequenceMax(e.target.value)}
          placeholder="Illimitee"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactEmail">Email de contact</Label>
        <Input
          id="contactEmail"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="contact@association.fr"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactTelephone">Telephone de contact</Label>
        <Input
          id="contactTelephone"
          value={contactTelephone}
          onChange={(e) => setContactTelephone(e.target.value)}
          placeholder="+33 1 23 45 67 89"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
