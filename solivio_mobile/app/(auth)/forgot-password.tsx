import { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, Mail } from 'lucide-react-native';
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
        <View className="items-center gap-6 py-4">
          <View className="w-20 h-20 rounded-3xl bg-teal-50 items-center justify-center">
            <CheckCircle size={40} color="#0D9488" strokeWidth={1.5} />
          </View>
          <View className="items-center gap-2">
            <Text className="text-base font-semibold text-foreground text-center">
              Verifiez votre messagerie
            </Text>
            <Text className="text-sm text-muted-foreground text-center leading-relaxed">
              Si{' '}
              <Text className="font-semibold text-foreground">{sentEmail}</Text>
              {' '}est associe a un compte, vous recevrez un code de reinitialisation.
            </Text>
          </View>
          <Button
            onPress={() =>
              router.push({ pathname: '/(auth)/reset-password', params: { email: sentEmail } })
            }
            size="lg"
            fullWidth
          >
            Saisir le code
          </Button>
          <Pressable
            onPress={() => router.replace('/(auth)/login')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-sm text-primary font-semibold">Retour a la connexion</Text>
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
      <View className="gap-2 py-2">
        <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center mb-2">
          <Mail size={26} color="#0D9488" strokeWidth={1.5} />
        </View>
      </View>

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
              autoComplete="email"
              placeholder="vous@exemple.fr"
            />
          )}
        />

        <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg" fullWidth>
          Envoyer le code
        </Button>
      </View>

      <Pressable
        onPress={() => router.back()}
        className="items-center"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text className="text-sm text-primary font-semibold">Retour</Text>
      </Pressable>
    </AuthLayout>
  );
}
