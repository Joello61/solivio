import Image from "next/image";

interface Props {
  imageSrc: string;
  imageAlt: string;
  titre: string;
  description: string;
  points: string[];
  accentColor?: string;
}

export function FormInfoPanel({
  imageSrc,
  imageAlt,
  titre,
  description,
  points,
  accentColor = "var(--color-primary)",
}: Props) {
  return (
    <div className="sticky top-6 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      {/* Image grande format */}
      <div className="relative h-56 w-full">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 0px, 380px"
          priority={false}
        />
        {/* Overlay gradient subtil pour lisibilité du titre */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
          <h2 className="font-display text-base font-semibold text-white leading-snug drop-shadow">
            {titre}
          </h2>
        </div>
      </div>

      {/* Corps */}
      <div className="px-5 py-5 space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            À savoir
          </p>
          <ul className="space-y-2.5">
            {points.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="text-sm text-muted-foreground leading-snug">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
