import { Stack } from 'expo-router';
import { useAuthContext } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import { Spinner } from '@/components/ui/Spinner';

export default function AuthLayout() {
  const { isLoading, isAuthenticated } = useAuthContext();

  if (isLoading) return <Spinner fullScreen />;

  if (isAuthenticated) return <Redirect href="/(app)/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="complete-google-registration" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="tenant-select" />
    </Stack>
  );
}
