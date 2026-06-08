import { useRef, useState } from 'react';
import { Text, TextInput, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { resetPassword } from '@/lib/auth';

const schema = z
  .object({
    nouveauMotDePasse: z.string().min(8, 'Minimum 8 caracteres'),
    confirmer: z.string(),
  })
  .refine((d) => d.nouveauMotDePasse === d.confirmer, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmer'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(TextInput | null)[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function onDigitChange(index: number, value: string) {
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      setDigits(value.split(''));
      inputs.current[5]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  }

  function onKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputs.current[index - 1]?.focus();
    }
  }

  async function onSubmit(data: FormData) {
    const code = digits.join('');
    if (code.length < 6) {
      setError('Saisissez le code a 6 chiffres.');
      return;
    }
    setError(null);
    try {
      await resetPassword(email ?? '', code, data.nouveauMotDePasse);
      router.replace('/(auth)/login');
    } catch (err: unknown) {
      const e = err as { detail?: string; message?: string };
      setError(e.detail ?? e.message ?? 'Code invalide.');
    }
  }

  return (
    <AuthLayout
      title="Reinitialiser le mot de passe"
      description="Saisissez le code recu par email et choisissez un nouveau mot de passe."
    >
      <View className="gap-5">
        {error && (
          <View className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        )}

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Code de verification</Text>
          <View className="flex-row justify-between gap-2">
            {digits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputs.current[index] = ref; }}
                className="flex-1 aspect-square border border-input rounded-xl text-center text-xl font-bold text-foreground bg-background focus:border-primary-600"
                value={digit}
                onChangeText={(v) => onDigitChange(index, v)}
                onKeyPress={({ nativeEvent: { key } }) => onKeyPress(index, key)}
                keyboardType="number-pad"
                maxLength={6}
                selectTextOnFocus
              />
            ))}
          </View>
        </View>

        <Controller
          control={control}
          name="nouveauMotDePasse"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Nouveau mot de passe"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.nouveauMotDePasse?.message}
              secureTextEntry
              placeholder="8 caracteres minimum"
            />
          )}
        />

        <Controller
          control={control}
          name="confirmer"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Confirmer"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmer?.message}
              secureTextEntry
              placeholder="Confirmer"
            />
          )}
        />

        <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg">
          Reinitialiser
        </Button>
      </View>

      <Pressable onPress={() => router.back()} className="items-center">
        <Text className="text-sm text-primary-600 font-medium">Retour</Text>
      </Pressable>
    </AuthLayout>
  );
}
