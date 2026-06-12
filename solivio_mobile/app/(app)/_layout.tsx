import { Stack, Redirect } from 'expo-router';
import { useAuthContext } from '@/context/AuthContext';
import { AppSplash } from '@/components/layout/AppSplash';

export default function AppLayout() {
  const { isLoading, isAuthenticated } = useAuthContext();

  if (isLoading) return <AppSplash />;

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="distributions/[id]/index" />
      <Stack.Screen name="distributions/[id]/pointage" options={{ presentation: 'modal' }} />
      <Stack.Screen name="distributions/[id]/repartition" options={{ presentation: 'modal' }} />
      <Stack.Screen name="distributions/nouvelle" options={{ presentation: 'modal' }} />
      <Stack.Screen name="association/configuration" />
      <Stack.Screen name="association/membres" />
      <Stack.Screen name="association/catalogue-denrees" />
      <Stack.Screen name="mon-compte/index" />
      <Stack.Screen name="mon-compte/profil-beneficiaire" />
      <Stack.Screen name="admin/utilisateurs" />
      <Stack.Screen name="admin/associations" />
      <Stack.Screen name="notifications/email-libre" options={{ presentation: 'modal' }} />
      <Stack.Screen name="reconditionnement/index" />
      <Stack.Screen name="reconditionnement/[id]/index" />
      <Stack.Screen name="reconditionnement/nouvelle" options={{ presentation: 'modal' }} />
      <Stack.Screen name="missions-collecte/index" />
      <Stack.Screen name="missions-collecte/[id]/index" />
      <Stack.Screen name="missions-collecte/nouvelle" options={{ presentation: 'modal' }} />
      <Stack.Screen name="evenements/index" />
      <Stack.Screen name="evenements/[id]/index" />
      <Stack.Screen name="evenements/[id]/pointage" options={{ presentation: 'modal' }} />
      <Stack.Screen name="evenements/nouveau" options={{ presentation: 'modal' }} />
      <Stack.Screen name="mes-evenements/index" />
      <Stack.Screen name="mes-missions-collecte/index" />
      <Stack.Screen name="distributions/[id]/ajout-benevole" options={{ presentation: 'modal' }} />
      <Stack.Screen name="a-propos" />
    </Stack>
  );
}
