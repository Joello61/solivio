import { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react-native';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { register } from '@/lib/auth';

const schema = z
  .object({
    prenom: z.string().min(1, 'Prenom requis'),
    nom: z.string().min(1, 'Nom requis'),
    email: z.string().email('Email invalide'),
    motDePasse: z.string().min(8, 'Minimum 8 caracteres'),
    confirmerMotDePasse: z.string(),
    codeAssociation: z.string().optional(),
  })
  .refine((d) => d.motDePasse === d.confirmerMotDePasse, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmerMotDePasse'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      await register({
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        motDePasse: data.motDePasse,
        codeAssociation: data.codeAssociation,
      });
      router.push({ pathname: '/(auth)/verify-email', params: { email: data.email } });
    } catch (err: unknown) {
      const e = err as { detail?: string; message?: string };
      setError(e.detail ?? e.message ?? "Erreur lors de l'inscription.");
    }
  }

  return (
    <AuthLayout title="Creer un compte" description="Rejoignez votre association sur Solivio.">
      <View className="gap-4">
        {error ? (
          <View className="flex-row items-start gap-3 bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3">
            <AlertCircle size={16} color="#EF4444" style={{ marginTop: 1 }} />
            <Text className="flex-1 text-sm text-destructive">{error}</Text>
          </View>
        ) : null}

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
                  placeholder="Marie"
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
                  placeholder="Dupont"
                />
              )}
            />
          </View>
        </View>

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
              placeholder="vous@exemple.fr"
            />
          )}
        />

        <Controller
          control={control}
          name="motDePasse"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Mot de passe"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.motDePasse?.message}
              secureTextEntry
              placeholder="8 caracteres minimum"
            />
          )}
        />

        <Controller
          control={control}
          name="confirmerMotDePasse"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Confirmer le mot de passe"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmerMotDePasse?.message}
              secureTextEntry
              placeholder="Confirmer"
            />
          )}
        />

        <Controller
          control={control}
          name="codeAssociation"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Code association (optionnel)"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.codeAssociation?.message}
              helper="Code fourni par votre association pour rejoindre son espace."
              autoCapitalize="characters"
              placeholder="CODE123"
            />
          )}
        />

        <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg" fullWidth>
          Creer mon compte
        </Button>
      </View>

      <View className="flex-row justify-center items-center gap-1.5">
        <Text className="text-sm text-muted-foreground">Deja un compte ?</Text>
        <Pressable
          onPress={() => router.replace('/(auth)/login')}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Text className="text-sm text-primary font-semibold">Se connecter</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
