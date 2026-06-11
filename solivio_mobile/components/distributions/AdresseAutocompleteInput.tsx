import { View, Text, StyleSheet } from 'react-native';
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

// Extrait une composante d'adresse par type depuis les address_components (new Places API).
function composante(components: AddressComponent[], type: string): string | undefined {
  return components.find((c) => c.types?.includes(type))?.longText ?? undefined;
}

export function AdresseAutocompleteInput({ apiKey, value, onSelect, onClear, label, error }: Props) {
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
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrap, error ? styles.inputError : null]}>
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
            input: styles.input,
            container: styles.gpContainer,
            suggestionsContainer: styles.list,
          }}
          showClearButton
          onTextChange={(text) => {
            if (text === '') onClear?.();
          }}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  label: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  inputWrap: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  inputError: { borderColor: '#EF4444' },
  input: { fontSize: 14, color: '#0F172A', paddingHorizontal: 12, paddingVertical: 12 },
  gpContainer: { backgroundColor: 'transparent' },
  list: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  error: { fontSize: 12, color: '#EF4444' },
});
