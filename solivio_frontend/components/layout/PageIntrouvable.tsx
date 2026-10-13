import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/**
 * Page introuvable aux couleurs de l'application. La page par defaut de Next.js suit le
 * theme du systeme et non celui choisi dans Solivio : son texte devenait illisible en sombre.
 */
export function PageIntrouvable({ retour, libelleRetour }: { retour: string; libelleRetour: string }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
        <SearchX className="size-6" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground font-display">Page introuvable</h1>
        <p className="text-sm text-muted-foreground">
          Cette page n&apos;existe pas, ou vous n&apos;y avez pas accès.
        </p>
      </div>
      <Link href={retour} className={buttonVariants()}>
        {libelleRetour}
      </Link>
    </div>
  );
}
