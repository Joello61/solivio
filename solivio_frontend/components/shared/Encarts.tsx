import type { ReactNode } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import type { Photo } from "@/lib/photos";
import { cn } from "@/lib/utils";

/* Encart illustre d'une photo de l'association, pour la colonne de droite. */
export function EncartPhoto({ photo, titre, children }: { photo: Photo; titre: string; children?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card">
      <Image src={photo.src} alt={photo.alt} placeholder="blur" sizes="(min-width: 1024px) 384px, 100vw" className="aspect-[16/10] w-full object-cover" />
      <div className="flex flex-col gap-2 p-5">
        <h2 className="font-display text-lg font-bold text-foreground">{titre}</h2>
        {children && <div className="text-base text-muted-foreground">{children}</div>}
      </div>
    </section>
  );
}

export interface PointInfo {
  icone: LucideIcon;
  texte: ReactNode;
}

/* Liste courte de reperes ("A savoir"), chaque point derriere une pastille d'icone. */
export function EncartInfo({ titre, points, ton = "neutre", className }: { titre: string; points: PointInfo[]; ton?: "neutre" | "marque"; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-3xl p-5", ton === "marque" ? "bg-secondary" : "border border-border bg-card", className)}>
      <h2 className="font-display text-lg font-bold text-foreground">{titre}</h2>
      <ul className="flex flex-col gap-3">
        {points.map(({ icone: Icone, texte }, i) => (
          <li key={i} className="flex items-start gap-3 text-base text-foreground">
            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-alt text-on-brand-alt">
              <Icone className="size-5" />
            </span>
            <span className="pt-1.5">{texte}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
