export interface PositionLieu {
  latitude: number | null;
  longitude: number | null;
  adresseFormatee: string | null;
}

/* Recherche Google Maps du lieu : coordonnees si connues, sinon adresse. Null sans l'un ni l'autre. */
export function lienItineraire(lieu: PositionLieu): string | null {
  if (lieu.latitude != null && lieu.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lieu.latitude},${lieu.longitude}`;
  }
  if (lieu.adresseFormatee) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lieu.adresseFormatee)}`;
  }
  return null;
}
