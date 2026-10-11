// Configuration publique servie par la route /api/public/config du frontend.
let cleGoogleMaps: Promise<string> | null = null;

/** Cle Google Maps, chargee une fois par session de navigation ; vide si indisponible. */
export function lireCleGoogleMaps(): Promise<string> {
  cleGoogleMaps ??= fetch("/api/public/config")
    .then((r) => r.json())
    .then((d: { googleMapsApiKey?: string }) => d.googleMapsApiKey ?? "")
    .catch(() => "");
  return cleGoogleMaps;
}
