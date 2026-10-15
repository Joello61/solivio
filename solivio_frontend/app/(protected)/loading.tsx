import { Skeleton } from "@/components/ui/skeleton";

// Squelette commun le temps que la page lise ses donnees : un titre puis une liste.
export default function Chargement() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-8 sm:py-10" aria-busy="true">
      <span className="sr-only" role="status">
        Chargement
      </span>
      <Skeleton className="h-10 w-2/3 max-w-sm" />
      <Skeleton className="h-5 w-1/2 max-w-xs" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
