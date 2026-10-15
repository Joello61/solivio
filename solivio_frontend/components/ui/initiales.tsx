import { cn } from "@/lib/utils";

/* Pastille aux initiales : un repere pour parcourir une liste de personnes, sans photo. */
export function Initiales({ prenom, nom, className }: { prenom: string; nom: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground", className)}
    >
      {`${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase()}
    </span>
  );
}
