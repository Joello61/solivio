import type { ExpoConfig, ConfigContext } from 'expo/config';

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? 'AIzaSyARDf3AExqhj8D4K8rkhFWhrVojuBCBCx0';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'solivio_mobile',
  slug: 'solivio_mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'soliviomobile',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    config: {
      googleMapsApiKey,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
    '@react-native-community/datetimepicker',
    [
      'react-native-maps',
      {
        googleMapsApiKey,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
