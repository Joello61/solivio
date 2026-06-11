import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react-native';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { completerInscriptionGoogle } from '@/lib/auth';
import { setTokens } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';

const schemaAvecInvitation = z.object({
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prenom requis'),
});

const schemaSansInvitation = z.object({
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prenom requis'),
  codeAssociation: z.string().min(1, 'Code association requis'),
});

type FormData = { nom: string; prenom: string; codeAssociation?: string };

export default function CompleteGoogleRegistrationScreen() {
  const router = useRouter();
  const { email, nom: nomParam, prenom: prenomParam, tokenInvitation } =
    useLocalSearchParams<{
      email: string;
      nom?: string;
      prenom?: string;
      tokenInvitation?: string;
    }>();
  const { refresh, setTenants } = useAuthContext();
  const [error, setError] = useState<string | null>(null);

  const aInvitation = !!tokenInvitation;
  const schema = useMemo(
    () => (aInvitation ? schemaAvecInvitation : schemaSansInvitation),
    [aInvitation],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: nomParam ?? '',
      prenom: prenomParam ?? '',
    },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      const response = await completerInscriptionGoogle({
        email: email ?? '',
        nom: data.nom,
        prenom: data.prenom,
        codeAssociation: aInvitation ? undefined : data.codeAssociation,
        tokenInvitation: tokenInvitation || undefined,
      });
      await setTokens(response.accessToken, response.refreshToken ?? undefined);

      if (response.tenants.length > 1) {
        setTenants(response.tenants);
        router.replace('/(auth)/tenant-select');
        return;
      }

      await refresh();
      router.replace('/(app)/(tabs)');
    } catch (err: unknown) {
      const e = err as { detail?: string; message?: string };
      setError(e.detail ?? e.message ?? "Erreur lors de la finalisation de l'inscription.");
    }
  }

  return (
    <AuthLayout
      title="Finaliser votre inscription"
      description="Verifiez vos informations pour rejoindre votre association."
    >
      <View className="gap-4">
        {aInvitation ? (
          <View className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
            <Text className="text-sm text-teal-700 font-medium">
              Invitation detectee - votre compte sera automatiquement lie a l'association.
            </Text>
          </View>
        ) : null}

        {error ? (
          <View className="flex-row items-start gap-3 bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3">
            <AlertCircle size={16} color="#EF4444" style={{ marginTop: 1 }} />
            <Text className="flex-1 text-sm text-destructive">{error}</Text>
          </View>
        ) : null}

        {/* Email read-only */}
        <View className="gap-1.5">
          <Text className="text-sm font-medium text-foreground">Adresse email</Text>
          <View className="h-12 px-4 rounded-xl bg-muted/50 border border-border/60 justify-center">
            <Text className="text-sm text-muted-foreground">{email}</Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Controller
              control={control}
              name="prenom"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Prenom"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.prenom?.message}
                  autoCapitalize="words"
                />
              )}
            />
          </View>
          <View className="flex-1">
            <Controller
              control={control}
              name="nom"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Nom"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.nom?.message}
                  autoCapitalize="words"
                />
              )}
            />
          </View>
        </View>

        {!aInvitation ? (
          <Controller
            control={control}
            name="codeAssociation"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Code association *"
                value={(value as string | undefined) ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={
                  (errors as { codeAssociation?: { message?: string } }).codeAssociation?.message
                }
                helper="Code fourni par votre association pour rejoindre son espace."
                autoCapitalize="characters"
                placeholder="CODE123"
              />
            )}
          />
        ) : null}

        <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg" fullWidth>
          Rejoindre l'association
        </Button>
      </View>
    </AuthLayout>
  );
}
