import type { DistributionPubliqueResponse } from "@/types/distribution";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

// Le backend met aussi la reponse en cache cinq minutes et limite le debit par IP :
// la page publique ne l'interroge qu'une fois par periode, quel que soit le trafic.
const REVALIDATION_SECONDES = 300;

/** Prochaines distributions annoncees ; null si le backend ne repond pas. */
export async function lireProchainesDistributions(): Promise<DistributionPubliqueResponse[] | null> {
  try {
    const reponse = await fetch(`${API_URL}/api/public/distributions/prochaines`, {
      next: { revalidate: REVALIDATION_SECONDES },
    });
    return reponse.ok ? ((await reponse.json()) as DistributionPubliqueResponse[]) : null;
  } catch {
    return null;
  }
}
