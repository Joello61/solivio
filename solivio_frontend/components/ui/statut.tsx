import { Badge } from "@/components/ui/badge";
import type { LibelleStatut, TonStatut } from "@/lib/libelles";
import { cn } from "@/lib/utils";

const VARIANTE: Record<TonStatut, "accent" | "default" | "dashed" | "muted" | "destructive" | "warning" | "success" | "info"> = {
  maintenant: "accent",
  ouvert: "default",
  brouillon: "dashed",
  passe: "muted",
  annule: "destructive",
  attente: "warning",
  succes: "success",
  info: "info",
};

interface StatutProps {
  libelle: LibelleStatut;
  /* Complement affiche apres le libelle, par exemple un rang de liste d'attente. */
  detail?: string;
  className?: string;
}

/* Pastille de statut : une seule logique de couleur pour tous les modules. */
export function Statut({ libelle, detail, className }: StatutProps) {
  return (
    <Badge variant={VARIANTE[libelle.ton]} className={className}>
      {libelle.ton === "maintenant" && (
        <span aria-hidden="true" className={cn("size-1.5 rounded-full bg-current")} />
      )}
      {detail ? `${libelle.texte}, ${detail}` : libelle.texte}
    </Badge>
  );
}
