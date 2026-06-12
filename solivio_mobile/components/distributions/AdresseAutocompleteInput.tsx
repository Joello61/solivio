import { useState } from 'react';
import { View, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';
import GooglePlacesTextInput, { type Place } from 'react-native-google-places-textinput';
import type { LieuRequest } from '@/types/distribution';

interface Props {
  apiKey: string;
  value?: string;
  onSelect: (lieu: LieuRequest) => void;
  onClear?: () => void;
  label?: string;
  error?: string;
}

interface AddressComponent {
  longText?: string;
  types?: string[];
}

function composante(components: AddressComponent[], type: string): string | undefined {
  return components.find((c) => c.types?.includes(type))?.longText ?? undefined;
}

const FOCUS_SHADOW = {
  shadowColor: '#0D9488',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 0,
} as const;

export function AdresseAutocompleteInput({ apiKey, value, onSelect, onClear, label, error }: Props) {
  const [focused, setFocused] = useState(false);

  const borderColor = focused ? '#0D9488' : error ? '#EF4444' : '#E2E8F0';
  const iconColor   = focused ? '#0D9488' : '#94A3B8';

  function handlePlaceSelect(place: Place) {
    const details = place.details ?? {};
    const comps: AddressComponent[] = details.addressComponents ?? [];
    const location = details.location ?? {};

    const lieu: LieuRequest = {
      placeId: place.placeId ?? undefined,
      nom: details.displayName?.text ?? place.structuredFormat?.mainText?.text ?? undefined,
      adresseFormatee: details.formattedAddress ?? undefined,
      latitude: location.latitude ?? undefined,
      longitude: location.longitude ?? undefined,
      numeroRue: composante(comps, 'street_number'),
      voie: composante(comps, 'route'),
      codePostal: composante(comps, 'postal_code'),
      ville: composante(comps, 'locality'),
    };
    onSelect(lieu);
  }

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text className="text-sm font-medium text-foreground">{label}</Text>
      ) : null}

      {/*
        Le wrapper externe porte TOUS les styles visuels (bordure, fond, radius).
        L'inputContainer interne est rendu entièrement transparent et sans bordure
        pour éviter le double-input — maintenant qu'on connaît la bonne clé.
      */}
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 52,
            borderRadius: 16,         // rounded-xl
            borderWidth: 1,
            borderColor,
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 16,    // px-4
            gap: 10,
          },
          focused ? FOCUS_SHADOW : undefined,
        ]}
      >
        {/* Icône MapPin — change de couleur avec le focus */}
        <MapPin size={18} color={iconColor} />

        <GooglePlacesTextInput
          apiKey={apiKey}
          value={value}
          languageCode="fr"
          includedRegionCodes={['fr']}
          placeHolderText="Rechercher une adresse..."
          onPlaceSelect={handlePlaceSelect}
          fetchDetails
          detailsFields={['displayName', 'formattedAddress', 'location', 'addressComponents']}
          style={{
            /* container : prend le reste de la largeur, transparent */
            container: {
              flex: 1,
              backgroundColor: 'transparent',
            },
            /* inputContainer : plus de bordure ni fond, le wrapper s'en charge */
            inputContainer: {
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 0,
              borderColor: 'transparent',
              backgroundColor: 'transparent',
              paddingHorizontal: 0,
              paddingVertical: 0,
            },
            input: {
              flex: 1,
              fontSize: 16,          // text-base
              color: '#0F172A',      // text-foreground
              paddingVertical: 14,   // py-3.5
              paddingHorizontal: 0,
              backgroundColor: 'transparent',
            },
            placeholder: {
              color: '#94A3B8',
            },
            suggestionsContainer: {
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              marginTop: 4,
              backgroundColor: '#FFFFFF',
            },
          }}
          showClearButton
          onTextChange={(text) => {
            if (text === '') onClear?.();
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>

      {error ? (
        <Text className="text-xs text-destructive ml-0.5">{error}</Text>
      ) : null}
    </View>
  );
}
