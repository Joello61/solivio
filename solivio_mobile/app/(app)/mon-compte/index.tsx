import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, Pressable, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react-native';
import { useAuthContext } from '@/context/AuthContext';
import { mettreAJourProfil } from '@/lib/api/profil';
import { buildImageUrl } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  prenom: z.string().min(1, 'Prenom requis'),
  nom: z.string().min(1, 'Nom requis'),
  telephone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function MonCompteScreen() {
  const router = useRouter();
  const { user, refresh } = useAuthContext();
  const [success, setSuccess] = useState(false);

  const estBeneficiaire = user?.roles.includes('beneficiaire');
  const initiales =
    user ? `${user.prenom[0] ?? ''}${user.nom[0] ?? ''}`.toUpperCase() : '??';
  const avatarUri = buildImageUrl(user?.photoUrl);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      prenom: user?.prenom ?? '',
      nom: user?.nom ?? '',
      telephone: user?.telephone ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: mettreAJourProfil,
    onSuccess: async () => {
      await refresh();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: unknown) => {
      const e = err as { detail?: string; message?: string };
      Alert.alert('Erreur', e.detail ?? e.message ?? 'Impossible de mettre a jour le profil.');
    },
  });

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Mon compte" />
      <SafeAreaView edges={['bottom']} className="flex-1">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView
          contentContainerClassName="px-4 py-6 gap-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View className="items-center gap-3">
            <View className="w-20 h-20 rounded-full bg-primary-100 items-center justify-center overflow-hidden">
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-2xl font-bold text-primary-600">{initiales}</Text>
              )}
            </View>
            <Text className="text-sm text-muted-foreground">{user?.email}</Text>
          </View>

          {success && (
            <View className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <Text className="text-sm text-green-700">Profil mis a jour.</Text>
            </View>
          )}

          {/* Formulaire */}
          <View className="gap-4">
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

            <Controller
              control={control}
              name="telephone"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Telephone"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.telephone?.message}
                  keyboardType="phone-pad"
                  placeholder="+33 6 12 34 56 78"
                />
              )}
            />

            <Button
              onPress={handleSubmit((d) => mutation.mutate(d))}
              loading={isSubmitting || mutation.isPending}
              disabled={!isDirty}
              size="lg"
            >
              Enregistrer
            </Button>
          </View>

          {/* Lien profil beneficiaire */}
          {estBeneficiaire && (
            <Pressable
              onPress={() => router.push('/(app)/mon-compte/profil-beneficiaire')}
              className="flex-row items-center gap-3 border border-border rounded-xl px-4 py-3.5 active:bg-muted"
            >
              <Text className="flex-1 text-base font-medium text-foreground">
                Profil beneficiaire
              </Text>
              <ChevronRight size={16} color="#9ca3af" />
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
