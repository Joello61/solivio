"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function FormulaireNouvelleAssociation({
  onSuccess,
  onAnnuler,
}: {
  onSuccess: () => void;
  onAnnuler: () => void;
}) {
  const [nom, setNom] = useState("");
  const [slug, setSlug] = useState("");
  const [emailResponsable, setEmailResponsable] = useState("");
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [slugManuel, setSlugManuel] = useState(false);

  function handleNomChange(valeur: string) {
    setNom(valeur);
    if (!slugManuel) setSlug(deriverSlug(valeur));
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

// --- Composant principal ---

export default function GestionAssociations({ associations: initial }: Props) {
  const router = useRouter();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");

  const filtres = useMemo(() => {
    const q = recherche.toLowerCase().trim();
    return initial.filter((a) => {
      if (q && !`${a.nom} ${a.slug}`.toLowerCase().includes(q)) return false;
      if (filtreStatut !== "tous" && a.statut !== filtreStatut) return false;
      return true;
    });
  }, [initial, recherche, filtreStatut]);

  function handleSuccess() {
    setDialogOuvert(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Carte toolbar */}
      <div className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par nom ou slug..."
              className="pl-8"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-medium text-muted-foreground shrink-0">Statut</span>
              <Select value={filtreStatut} onValueChange={(v) => { if (v) setFiltreStatut(v); }}>
                <SelectTrigger className="flex-1 sm:w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setDialogOuvert(true)} className="w-full sm:w-auto shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle association
            </Button>
          </div>
        </div>
        {filtres.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {filtres.length} association{filtres.length !== 1 ? "s" : ""}
            {filtres.length !== initial.length && ` sur ${initial.length}`}
          </p>
        )}
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

      {filtres.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-neutral-50 dark:bg-neutral-900/50 px-6 py-12 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            {initial.length === 0 ? "Aucune association enregistree" : "Aucune association ne correspond aux filtres."}
          </p>
          {initial.length === 0 && (
            <p className="text-xs text-muted-foreground/70 mt-1">
              Creez la premiere association pour commencer.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Vue mobile : cartes */}
          <div className="space-y-3 lg:hidden">
            {filtres.map((asso) => (
              <div
                key={asso.id}
                className="rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 border border-teal-100 dark:bg-teal-950/30 dark:border-teal-800/40">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{asso.nom}</p>
                      <Badge
                        variant={asso.statut === "active" ? "default" : "destructive"}
                        className="text-[11px] shrink-0"
                      >
                        {asso.statut === "active" ? "Active" : asso.statut}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{asso.slug}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Code : {asso.code}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60">
                  <a
                    href="/association/configuration"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Acces configuration
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Vue desktop : tableau */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-border/60 bg-white dark:bg-neutral-900 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-neutral-50/80 dark:bg-neutral-800/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Association</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acces</th>
                </tr>
              </thead>
              <tbody>
                {filtres.map((asso) => (
                  <tr
                    key={asso.id}
                    className="border-b border-border/60 last:border-0 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 border border-teal-100 dark:bg-teal-950/30 dark:border-teal-800/40">
                          <Building2 className="h-4 w-4 text-primary" />
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
                      <a
                        href="/association/configuration"
                        className="inline-flex items-center justify-center h-7 px-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                        aria-label="Acces configuration"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
