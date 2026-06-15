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
        Le composant GooglePlacesTextInput est le conteneur principal.
        Le wrapper visuel (bordure, icône) est rendu via inputContainer + icône dans le style.
        Les suggestions flottent en dehors grâce à position absolute + zIndex.
      */}
      <View style={{ zIndex: 10 }}>
        <GooglePlacesTextInput
          apiKey={apiKey}
          value={value}
          languageCode="fr"
          includedRegionCodes={['fr']}
          placeHolderText="Rechercher une adresse..."
          onPlaceSelect={handlePlaceSelect}
          fetchDetails
          detailsFields={['displayName', 'formattedAddress', 'location', 'addressComponents']}
          scrollEnabled={false}
          nestedScrollEnabled={false}
          style={{
            container: {
              flex: 1,
              backgroundColor: 'transparent',
            },
            inputContainer: {
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: 52,
              borderRadius: 16,
              borderWidth: 1,
              borderColor,
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 16,
              gap: 10,
              ...(focused ? FOCUS_SHADOW : {}),
            },
            input: {
              flex: 1,
              fontSize: 16,
              color: '#0F172A',
              paddingVertical: 14,
              paddingHorizontal: 0,
              backgroundColor: 'transparent',
            },
            placeholder: {
              color: '#94A3B8',
            },
            suggestionsContainer: {
              position: 'absolute',
              top: 56,           // juste sous l'input (minHeight 52 + marge 4)
              left: 0,
              right: 0,
              zIndex: 999,
              elevation: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              backgroundColor: '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              maxHeight: 250,
            },
          }}
          showClearButton
          onTextChange={(text) => {
            if (text === '') onClear?.();
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {/* Icône MapPin positionnée en absolue dans l'inputContainer */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 16,
            top: 0,
            bottom: 0,
            justifyContent: 'center',
          }}
        >
          <MapPin size={18} color={iconColor} />
        </View>
      </View>

      {error ? (
        <Text className="text-xs text-destructive ml-0.5">{error}</Text>
      ) : null}
    </View>
  );
}