import { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle } from 'lucide-react-native';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { forgotPassword } from '@/lib/auth';

const schema = z.object({
  email: z.string().email('Email invalide'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    await forgotPassword(data.email).catch(() => {});
    setSentEmail(data.email);
    setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout title="Email envoye">
        <View className="items-center gap-4 py-4">
          <CheckCircle size={56} color="#10b981" />
          <Text className="text-muted-foreground text-center">
            Si <Text className="font-medium text-foreground">{sentEmail}</Text> est associe a un
            compte, vous recevrez un code de reinitialisation.
          </Text>
          <Button
            onPress={() =>
              router.push({ pathname: '/(auth)/reset-password', params: { email: sentEmail } })
            }
            size="lg"
            className="w-full"
          >
            Saisir le code
          </Button>
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text className="text-sm text-primary-600 font-medium">Retour a la connexion</Text>
          </Pressable>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Mot de passe oublie"
      description="Entrez votre email pour recevoir un code de reinitialisation."
    >
      <View className="gap-4">
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

        <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg">
          Envoyer le code
        </Button>
      </View>

      <Pressable onPress={() => router.back()} className="items-center">
        <Text className="text-sm text-primary-600 font-medium">Retour</Text>
      </Pressable>
    </AuthLayout>
  );
}
