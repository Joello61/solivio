import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GooglePlacesTextInput from 'react-native-google-places-textinput';
import type { LieuRequest } from '@/types/distribution';

interface Props {
  apiKey: string;
  value?: string;
  onSelect: (lieu: LieuRequest) => void;
  onClear?: () => void;
  label?: string;
  error?: string;
}

// Extrait une composante d'adresse par type depuis le tableau address_components.
function composante(
  components: Array<{ long_name: string; types: string[] }>,
  type: string
): string | undefined {
  return components.find((c) => c.types.includes(type))?.long_name ?? undefined;
}

export function AdresseAutocompleteInput({ apiKey, value, onSelect, onClear, label, error }: Props) {
  const [texte, setTexte] = useState(value ?? '');

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrap, error ? styles.inputError : null]}>
        <GooglePlacesTextInput
          apiKey={apiKey}
          initialValue={texte}
          language="fr"
          country="fr"
          placeholder="Rechercher une adresse..."
          placeholderTextColor="#94A3B8"
          textInputStyle={styles.input}
          containerStyle={styles.gpContainer}
          listStyle={styles.list}
          onPlaceSelected={(data, details) => {
            if (!details) return;
            const comps = details.address_components ?? [];
            const lieu: LieuRequest = {
              placeId: details.place_id ?? undefined,
              nom: details.name ?? undefined,
              adresseFormatee: details.formatted_address ?? undefined,
              latitude: details.geometry?.location?.lat ?? undefined,
              longitude: details.geometry?.location?.lng ?? undefined,
              numeroRue: composante(comps, 'street_number'),
              voie: composante(comps, 'route'),
              codePostal: composante(comps, 'postal_code'),
              ville: composante(comps, 'locality'),
            };
            setTexte(lieu.adresseFormatee ?? lieu.nom ?? '');
            onSelect(lieu);
          }}
          fields="place_id,name,formatted_address,geometry,address_components"
          onClear={() => {
            setTexte('');
            onClear?.();
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
