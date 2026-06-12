import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

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

  const region = {
    latitude: lieu.latitude,
    longitude: lieu.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  function ouvrirGoogleMaps() {
    Linking.openURL(buildGoogleMapsUrl(lieu));
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
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
        <Marker coordinate={{ latitude: lieu.latitude, longitude: lieu.longitude }} />
      </MapView>
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
  lien: {
    alignSelf: 'flex-start',
  },
  lienTexte: {
    fontSize: 12,
    color: '#16513F',
    textDecorationLine: 'underline',
  },
});
