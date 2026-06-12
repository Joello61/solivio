import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

export interface LieuDto {
  latitude: number | null;
  longitude: number | null;
  adresseFormatee: string | null;
}

// react-native-maps exige un module natif absent de Expo Go.
// Chargement conditionnel pour eviter l'erreur TurboModuleRegistry en Expo Go.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// eslint-disable-next-line @typescript-eslint/no-require-imports
let MapViewComp: any = isExpoGo ? null : require('react-native-maps').default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
let MarkerComp: any = isExpoGo ? null : require('react-native-maps').Marker;
// eslint-disable-next-line @typescript-eslint/no-require-imports
let PROVIDER_GOOGLE_CONST: any = isExpoGo ? null : require('react-native-maps').PROVIDER_GOOGLE;

function buildGoogleMapsUrl(lieu: LieuDto): string {
  if (lieu.latitude != null && lieu.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lieu.latitude},${lieu.longitude}`;
  }
  if (lieu.adresseFormatee) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lieu.adresseFormatee)}`;
  }
  return 'https://maps.google.com';
}

interface Props {
  lieu: LieuDto;
  hauteur?: number;
  interactive?: boolean;
}

export function CarteEmplacement({ lieu, hauteur = 200, interactive = false }: Props) {
  if (lieu.latitude == null || lieu.longitude == null) {
    return null;
  }

  function ouvrirGoogleMaps() {
    Linking.openURL(buildGoogleMapsUrl(lieu));
  }

  // Expo Go : afficher un bouton vers Google Maps en remplacement de la carte native
  if (!MapViewComp) {
    return (
      <View style={styles.container}>
        <Pressable
          onPress={ouvrirGoogleMaps}
          style={[styles.placeholder, { height: hauteur }]}
        >
          <Text style={styles.placeholderTexte}>Voir sur Google Maps</Text>
        </Pressable>
      </View>
    );
  }

  const region = {
    latitude: lieu.latitude,
    longitude: lieu.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <MapViewComp
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE_CONST : undefined}
        initialRegion={region}
        style={[styles.map, { height: hauteur }]}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        <MarkerComp coordinate={{ latitude: lieu.latitude, longitude: lieu.longitude }} />
      </MapViewComp>
      <Pressable onPress={ouvrirGoogleMaps} style={styles.lien}>
        <Text style={styles.lienTexte}>Voir sur Google Maps</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  map: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  placeholder: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTexte: {
    fontSize: 13,
    color: '#16513F',
    textDecorationLine: 'underline',
  },
  lien: {
    alignSelf: 'flex-start',
  },
  lienTexte: {
    fontSize: 12,
    color: '#16513F',
    textDecorationLine: 'underline',
  },
});
