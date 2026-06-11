import { useRef, useState } from 'react';
import { Text, TextInput, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react-native';
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

function otpBoxStyle(digit: string, focused: boolean) {
  return {
    flex: 1,
    aspectRatio: 1 as const,
    borderWidth: 1.5,
    borderRadius: 16,
    backgroundColor: focused ? '#F0FDFA' : '#FFFFFF',
    borderColor: focused ? '#0D9488' : digit ? '#0D9488' : '#E2E8F0',
    textAlign: 'center' as const,
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#0F172A',
    shadowColor: focused ? '#0D9488' : '#0F172A',
    shadowOffset: { width: 0, height: focused ? 0 : 1 },
    shadowOpacity: focused ? 0.14 : 0.04,
    shadowRadius: focused ? 6 : 4,
    elevation: focused ? 2 : 1,
  };
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
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

  const codeComplet = digits.every((d) => d !== '');

  return (
    <AuthLayout
      title="Reinitialiser le mot de passe"
      description="Saisissez le code recu par email et choisissez un nouveau mot de passe."
    >
      <View className="gap-5">
        {error ? (
          <View className="flex-row items-start gap-3 bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3">
            <AlertCircle size={16} color="#EF4444" style={{ marginTop: 1 }} />
            <Text className="flex-1 text-sm text-destructive">{error}</Text>
          </View>
        ) : null}

        {/* Code OTP */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Code a 6 chiffres</Text>
          <View className="flex-row gap-2">
            {digits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputs.current[index] = ref; }}
                style={otpBoxStyle(digit, focusedIndex === index)}
                value={digit}
                onChangeText={(v) => onDigitChange(index, v)}
                onKeyPress={({ nativeEvent: { key } }) => onKeyPress(index, key)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
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
              label="Confirmer le mot de passe"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmer?.message}
              secureTextEntry
              placeholder="Confirmer"
            />
          )}
        />

        <Button
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={!codeComplet}
          size="lg"
          fullWidth
        >
          Reinitialiser le mot de passe
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
