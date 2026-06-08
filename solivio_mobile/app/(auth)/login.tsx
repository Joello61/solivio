import { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { login } from '@/lib/auth';
import { useAuthContext } from '@/context/AuthContext';

const schema = z.object({
  email: z.string().email('Email invalide'),
  motDePasse: z.string().min(1, 'Mot de passe requis'),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const { refresh, setTenants } = useAuthContext();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      const response = await login(data.email, data.motDePasse, false);

      if (response.tenants.length === 0) {
        setError('Aucune association associee a ce compte.');
        return;
      }

      if (response.tenants.length > 1) {
        setTenants(response.tenants);
        router.replace('/(auth)/tenant-select');
        return;
      }

      await refresh();
      router.replace('/(app)/(tabs)');
    } catch (err: unknown) {
      const e = err as { detail?: string; message?: string };
      setError(e.detail ?? e.message ?? 'Identifiants incorrects.');
    }
  }

  return (
    <AuthLayout title="Connexion" description="Acces a votre espace association">
      <View className="gap-4">
        {error && (
          <View className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        )}

        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Adresse email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="vous@exemple.fr"
            />
          )}
        />

        <View className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-foreground">Mot de passe</Text>
            <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
              <Text className="text-xs text-primary-600 font-medium">
                Mot de passe oublie ?
              </Text>
            </Pressable>
          </View>
          <Controller
            control={control}
            name="motDePasse"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.motDePasse?.message}
                secureTextEntry
                autoComplete="password"
                placeholder="Votre mot de passe"
              />
            )}
          />
        </View>

        <Button
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          size="lg"
        >
          Se connecter
        </Button>
      </View>

      <View className="flex-row justify-center gap-1">
        <Text className="text-sm text-muted-foreground">Pas encore de compte ?</Text>
        <Pressable onPress={() => router.push('/(auth)/register')}>
          <Text className="text-sm text-primary-600 font-medium">Creer un compte</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
