"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { creerAssociation } from "@/lib/api/association";
import type { AssociationAdminResponse, CreateAssociationPayload } from "@/types/association";

interface Props {
  associations: AssociationAdminResponse[];
}

function deriverSlug(valeur: string): string {
  return valeur
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface FormulaireProps {
  onSuccess: () => void;
  onAnnuler: () => void;
}

function FormulaireNouvelleAssociation({ onSuccess, onAnnuler }: FormulaireProps) {
  const [nom, setNom] = useState("");
  const [slug, setSlug] = useState("");
  const [emailResponsable, setEmailResponsable] = useState("");
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [slugManuel, setSlugManuel] = useState(false);

  function handleNomChange(valeur: string) {
    setNom(valeur);
    if (!slugManuel) {
      setSlug(deriverSlug(valeur));
    }
  }

  function handleSlugChange(valeur: string) {
    setSlug(valeur);
    setSlugManuel(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !slug.trim() || !emailResponsable.trim()) return;
    setPending(true);
    setErreur(null);
    try {
      const payload: CreateAssociationPayload = {
        nom: nom.trim(),
        slug: slug.trim(),
        emailResponsable: emailResponsable.trim(),
      };
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nom">Nom de l&apos;association</Label>
        <Input
          id="nom"
          value={nom}
          onChange={(e) => handleNomChange(e.target.value)}
          placeholder="Association Solidarite Paris"
          required
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">Identifiant technique (slug)</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="solidarite-paris"
          pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
          title="Minuscules, chiffres et traits d'union uniquement"
          required
        />
        <p className="text-xs text-muted-foreground">
          Minuscules, chiffres et traits d&apos;union. Derive automatiquement du nom.
        </p>
      </div>

      <div className="space-y-1.5">
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

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onAnnuler} disabled={pending}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <><Spinner size="sm" /> Creation...</> : "Creer l'association"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function GestionAssociations({ associations: initial }: Props) {
  const router = useRouter();
  const [dialogOuvert, setDialogOuvert] = useState(false);

  function handleSuccess() {
    setDialogOuvert(false);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* En-tete */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {initial.length} association{initial.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={() => setDialogOuvert(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle association
        </Button>
      </div>

      {/* Dialog de creation */}
      <Dialog open={dialogOuvert} onOpenChange={setDialogOuvert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle association</DialogTitle>
            <DialogDescription>
              Creer une nouvelle association sur la plateforme Solivio.
            </DialogDescription>
          </DialogHeader>
          <FormulaireNouvelleAssociation
            onSuccess={handleSuccess}
            onAnnuler={() => setDialogOuvert(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Tableau */}
      {initial.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 px-6 py-12 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Aucune association enregistree</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Creez la premiere association pour commencer.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Association</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Acces</th>
              </tr>
            </thead>
            <tbody>
              {initial.map((asso) => (
                <tr key={asso.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{asso.nom}</p>
                        <p className="text-xs text-muted-foreground font-mono">{asso.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                    {asso.code}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={asso.statut === "active" ? "default" : "destructive"}>
                      {asso.statut === "active" ? "Active" : asso.statut}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <a href="/association/configuration" className="inline-flex items-center justify-center h-7 px-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
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
