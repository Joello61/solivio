import { useRef, useState } from 'react';
import { Text, TextInput, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { verifyEmail } from '@/lib/auth';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  function onDigitChange(index: number, value: string) {
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      const newDigits = value.split('');
      setDigits(newDigits);
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

  async function onSubmit() {
    const code = digits.join('');
    if (code.length < 6) return;
    setError(null);
    setLoading(true);
    try {
      await verifyEmail(email ?? '', code);
      router.replace('/(auth)/login');
    } catch (err: unknown) {
      const e = err as { detail?: string; message?: string };
      setError(e.detail ?? e.message ?? 'Code invalide.');
    } finally {
      setLoading(false);
    }
  }

  const codeComplet = digits.every((d) => d !== '');

  return (
    <AuthLayout
      title="Verifier votre email"
      description={`Un code a 6 chiffres a ete envoye a ${email ?? ''}.`}
    >
      <View className="gap-4">
        {error && (
          <View className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        )}

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

        <Button onPress={onSubmit} loading={loading} disabled={!codeComplet} size="lg">
          Verifier
        </Button>
      </View>

      <Pressable onPress={() => router.back()} className="items-center">
        <Text className="text-sm text-primary-600 font-medium">Retour</Text>
      </Pressable>
    </AuthLayout>
  );
}
