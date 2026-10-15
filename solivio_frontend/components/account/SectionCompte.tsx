import type { ReactNode } from "react";

interface Props {
  id: string;
  titre: string;
  description?: ReactNode;
  children: ReactNode;
}

/* Une rubrique de la page Compte : un titre, une phrase, puis le contenu. */
export function SectionCompte({ id, titre, description, children }: Props) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="font-display text-xl font-bold text-foreground">
          {titre}
        </h2>
        {description && <div className="text-base text-muted-foreground">{description}</div>}
      </div>
      {children}
    </section>
  );
}
