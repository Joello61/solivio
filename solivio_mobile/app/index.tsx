import { Redirect } from 'expo-router';
import { useAuthContext } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/Spinner';

export default function Index() {
  const { isLoading, isAuthenticated } = useAuthContext();

  if (isLoading) return <Spinner fullScreen />;

  return <Redirect href={isAuthenticated ? '/(app)/(tabs)' : '/(auth)/login'} />;
}
