import { useRef, useState } from 'react';
import { Text, TextInput, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AlertCircle, Mail } from 'lucide-react-native';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { verifyEmail } from '@/lib/auth';

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

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
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
    <AuthLayout title="Verifier votre email">
      <View className="gap-5">
        {/* Email affiché */}
        <View className="flex-row items-center gap-3 bg-muted rounded-xl px-4 py-3">
          <Mail size={18} color="#64748B" />
          <Text className="flex-1 text-sm text-muted-foreground" numberOfLines={1}>
            Code envoye a{' '}
            <Text className="font-semibold text-foreground">{email ?? ''}</Text>
          </Text>
        </View>

        {error ? (
          <View className="flex-row items-start gap-3 bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3">
            <AlertCircle size={16} color="#EF4444" style={{ marginTop: 1 }} />
            <Text className="flex-1 text-sm text-destructive">{error}</Text>
          </View>
        ) : null}

        {/* Saisie du code OTP */}
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

        <Button onPress={onSubmit} loading={loading} disabled={!codeComplet} size="lg" fullWidth>
          Verifier
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
