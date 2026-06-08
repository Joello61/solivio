import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import '../global.css';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  // La native splash reste visible jusqu'a ce que AuthProvider ait resolu
  // l'etat d'authentification. AppSplash prend le relais cote JS.
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider onReady={() => SplashScreen.hideAsync().catch(() => {})}>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
