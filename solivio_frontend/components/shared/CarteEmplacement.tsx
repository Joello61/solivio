"use client";

import { useEffect, useRef, useState } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { ExternalLink } from "lucide-react";

export interface LieuDto {
  latitude: number | null;
  longitude: number | null;
  adresseFormatee: string | null;
}

function buildGoogleMapsUrl(lieu: LieuDto): string {
  if (lieu.latitude != null && lieu.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lieu.latitude},${lieu.longitude}`;
  }
  if (lieu.adresseFormatee) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lieu.adresseFormatee)}`;
  }
  return "https://maps.google.com";
}

interface Props {
  lieu: LieuDto;
  hauteur?: string;
  interactive?: boolean;
}

export function CarteEmplacement({ lieu, hauteur = "300px", interactive = false }: Props) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch("/api/public/config")
      .then((r) => r.json())
      .then((d: { googleMapsApiKey?: string }) => setApiKey(d.googleMapsApiKey ?? ""))
      .catch(() => setApiKey(""));
  }, []);

  if (lieu.latitude == null || lieu.longitude == null) {
    return null;
  }

  const center = { lat: lieu.latitude, lng: lieu.longitude };

  return (
    <div className="space-y-2">
      <div style={{ height: hauteur }} className="rounded-xl overflow-hidden border border-border/60">
        {apiKey != null ? (
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={center}
              defaultZoom={15}
              gestureHandling={interactive ? "auto" : "none"}
              disableDefaultUI={!interactive}
              style={{ width: "100%", height: "100%" }}
            >
              <AdvancedMarker position={center} />
            </Map>
          </APIProvider>
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Chargement de la carte...</span>
          </div>
        )}
      </div>
      <a
        href={buildGoogleMapsUrl(lieu)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <ExternalLink className="size-3" />
        Voir sur Google Maps
      </a>
    </div>
  );
}
