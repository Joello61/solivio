import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-4xl font-bold text-foreground">404</Text>
      <Text className="text-muted-foreground mt-2 text-center">Page introuvable.</Text>
      <Pressable
        onPress={() => router.replace('/')}
        className="mt-6 bg-primary-600 rounded-lg px-6 py-3 active:bg-primary-700"
      >
        <Text className="text-white font-semibold">Retour a l'accueil</Text>
      </Pressable>
    </SafeAreaView>
  );
}
