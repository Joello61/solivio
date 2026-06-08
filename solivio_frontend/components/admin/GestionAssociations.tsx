"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { creerAssociation } from "@/lib/api/association";
import type { AssociationAdminResponse, CreateAssociationPayload } from "@/types/association";

interface Props {
  associations: AssociationAdminResponse[];
}

function FormulaireNouvelleAssociation({ onSuccess }: { onSuccess: () => void }) {
  const [nom, setNom] = useState("");
  const [slug, setSlug] = useState("");
  const [emailResponsable, setEmailResponsable] = useState("");
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  function deriverSlug(valeur: string) {
    return valeur
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleNomChange(valeur: string) {
    setNom(valeur);
    if (slug === "" || slug === deriverSlug(nom)) {
      setSlug(deriverSlug(valeur));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !slug.trim() || !emailResponsable.trim()) return;
    setPending(true);
    setErreur(null);
    try {
      const payload: CreateAssociationPayload = { nom: nom.trim(), slug: slug.trim(), emailResponsable: emailResponsable.trim() };
      await creerAssociation(payload);
      onSuccess();
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      setErreur(e.detail ?? e.message ?? "Erreur lors de la creation.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-lg p-4 space-y-4 max-w-md">
      <h2 className="font-semibold text-base">Nouvelle association</h2>

      <div className="space-y-1">
        <Label htmlFor="nom">Nom de l&apos;association</Label>
        <Input
          id="nom"
          value={nom}
          onChange={(e) => handleNomChange(e.target.value)}
          placeholder="Association Solidarite Paris"
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="slug">Identifiant technique (slug)</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="solidarite-paris"
          pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
          title="Minuscules, chiffres et traits d'union uniquement"
          required
        />
        <p className="text-xs text-muted-foreground">
          Minuscules, chiffres et traits d&apos;union. Derive automatiquement du nom.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="emailResponsable">Email du responsable</Label>
        <Input
          id="emailResponsable"
          type="email"
          value={emailResponsable}
          onChange={(e) => setEmailResponsable(e.target.value)}
          placeholder="responsable@association.fr"
          required
        />
        <p className="text-xs text-muted-foreground">
          Une invitation sera envoyee a cette adresse.
        </p>
      </div>

      {erreur && <p className="text-sm text-destructive">{erreur}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Creation..." : "Creer l'association"}
      </Button>
    </form>
  );
}

export default function GestionAssociations({ associations: initial }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  function handleSuccess() {
    setShowForm(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {initial.length} association{initial.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={() => setShowForm((v) => !v)} variant={showForm ? "outline" : "default"}>
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? "Annuler" : "Nouvelle association"}
        </Button>
      </div>

      {showForm && <FormulaireNouvelleAssociation onSuccess={handleSuccess} />}

      {initial.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4">Aucune association enregistree.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left pb-2 pr-4 font-medium">Association</th>
                <th className="text-left pb-2 pr-4 font-medium">Code</th>
                <th className="text-left pb-2 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {initial.map((asso) => (
                <tr key={asso.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium">{asso.nom}</p>
                        <p className="text-xs text-muted-foreground">{asso.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">{asso.code}</td>
                  <td className="py-3">
                    <Badge variant={asso.statut === "active" ? "default" : "destructive"}>
                      {asso.statut}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
