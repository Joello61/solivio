"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { MapPin, X } from "lucide-react";
import type { LieuRequest } from "@/types/distribution";

interface Props {
  value?: string;
  onSelect: (lieu: LieuRequest) => void;
  onClear?: () => void;
  placeholder?: string;
}

interface Suggestion {
  placePrediction: google.maps.places.PlacePrediction;
  label: string;
}

export function AdresseAutocomplete({ value, onSelect, onClear, placeholder = "Rechercher une adresse..." }: Props) {
  const placesLib = useMapsLibrary("places");
  const [input, setInput] = useState(value ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Rafraichit le sessionToken a chaque nouvelle session de recherche.
  useEffect(() => {
    if (placesLib) {
      sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
    }
  }, [placesLib]);

  const rechercher = useCallback(
    async (terme: string) => {
      if (!placesLib || terme.length < 3) {
        setSuggestions([]);
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const { suggestions: resultats } =
          await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: terme,
            sessionToken: sessionTokenRef.current ?? undefined,
            language: "fr",
            region: "fr",
          });

        setSuggestions(
          resultats
            .filter((s) => s.placePrediction !== null)
            .map((s) => ({
              placePrediction: s.placePrediction!,
              label: s.placePrediction!.text.toString(),
            }))
        );
        setOuvert(true);
      } catch {
        // Requete annulee ou erreur reseau : on ne met pas a jour les suggestions.
      }
    },
    [placesLib]
  );

  const selectionner = useCallback(
    async (suggestion: Suggestion) => {
      if (!placesLib) return;
      setOuvert(false);
      setSuggestions([]);

      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ["id", "displayName", "formattedAddress", "location", "addressComponents"],
      });

      // Extrait les composantes de l'adresse depuis address_components.
      const composantes = place.addressComponents ?? [];
      const composante = (type: string) =>
        composantes.find((c) => c.types.includes(type))?.longText ?? undefined;

      const lieu: LieuRequest = {
        placeId: place.id ?? undefined,
        nom: place.displayName ?? undefined,
        adresseFormatee: place.formattedAddress ?? undefined,
        latitude: place.location?.lat() ?? undefined,
        longitude: place.location?.lng() ?? undefined,
        numeroRue: composante("street_number"),
        voie: composante("route"),
        codePostal: composante("postal_code"),
        ville: composante("locality"),
      };

      setInput(lieu.adresseFormatee ?? lieu.nom ?? "");
      onSelect(lieu);

      // Nouveau token pour la prochaine session.
      sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
    },
    [placesLib, onSelect]
  );

  function effacer() {
    setInput("");
    setSuggestions([]);
    setOuvert(false);
    onClear?.();
  }

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <MapPin className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={placeholder}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            rechercher(e.target.value);
          }}
          onFocus={() => suggestions.length > 0 && setOuvert(true)}
          onBlur={() => setTimeout(() => setOuvert(false), 150)}
          autoComplete="off"
        />
        {input && (
          <button
            type="button"
            onClick={effacer}
            className="absolute right-2 text-muted-foreground hover:text-foreground"
            aria-label="Effacer l'adresse"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {ouvert && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-md overflow-hidden">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                onMouseDown={() => selectionner(s)}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
