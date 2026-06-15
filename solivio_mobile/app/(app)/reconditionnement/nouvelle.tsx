import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { AdresseAutocompleteInput } from '@/components/distributions/AdresseAutocompleteInput';
import { creerSession } from '@/lib/api/reconditionnement';
import type { LieuRequest } from '@/types/distribution';

const schema = z
  .object({
    titre: z.string().min(1, 'Titre requis'),
    description: z.string().optional(),
    dateHeureDebut: z.string().min(1, 'Date et heure de debut requises'),
    dateHeureFin: z.string().min(1, 'Date et heure de fin requises'),
    capacite: z.string().optional(),
  })
  .refine((d) => !d.dateHeureDebut || !d.dateHeureFin || d.dateHeureFin > d.dateHeureDebut, {
    message: 'La fin doit etre apres le debut',
    path: ['dateHeureFin'],
  });

type FormData = z.infer<typeof schema>;

export default function NouvelleSessionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [lieu, setLieu] = useState<LieuRequest | undefined>(undefined);
  const [mapsApiKey, setMapsApiKey] = useState<string>('');
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch(`${process.env.EXPO_PUBLIC_API_URL ?? ''}/api/public/config`)
      .then((r) => r.json())
      .then((d: { googleMapsApiKey?: string }) => setMapsApiKey(d.googleMapsApiKey ?? ''))
      .catch(() => {});
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: creerSession,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions-reco'] });
      router.replace(`/(app)/reconditionnement/${data.id}` as never);
    },
    onError: (err: unknown) => {
      const e = err as { detail?: string; message?: string };
      setError(e.detail ?? e.message ?? 'Erreur lors de la creation.');
    },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    mutation.mutate({
      titre: data.titre,
      description: data.description,
      lieu,
      dateHeureDebut: new Date(data.dateHeureDebut).toISOString(),
      dateHeureFin: new Date(data.dateHeureFin).toISOString(),
      capacite: data.capacite ? parseInt(data.capacite, 10) : undefined,
    });
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Nouvelle session" showClose modal />
      <SafeAreaView edges={['bottom']} className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView
            contentContainerClassName="px-4 py-4 gap-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {error ? (
              <View className="flex-row items-start gap-3 bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3">
                <AlertCircle size={16} color="#EF4444" style={{ marginTop: 1 }} />
                <Text className="flex-1 text-sm text-destructive">{error}</Text>
              </View>
            ) : null}

            <Controller
              control={control}
              name="titre"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Titre *"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.titre?.message}
                  placeholder="Tri et reconditionnement printemps"
                />
              )}
            />

            <Controller
              control={control}
              name="dateHeureDebut"
              render={({ field: { value, onChange } }) => (
                <DatePickerInput
                  label="Date et heure de debut *"
                  value={value}
                  onChange={onChange}
                  mode="datetime"
                  error={errors.dateHeureDebut?.message}
                  minimumDate={new Date()}
                />
              )}
            />

            <Controller
              control={control}
              name="dateHeureFin"
              render={({ field: { value, onChange } }) => (
                <DatePickerInput
                  label="Date et heure de fin *"
                  value={value}
                  onChange={onChange}
                  mode="datetime"
                  error={errors.dateHeureFin?.message}
                />
              )}
            />

            <AdresseAutocompleteInput
              apiKey={mapsApiKey}
              label="Lieu"
              value={lieu?.adresseFormatee}
              onSelect={setLieu}
              onClear={() => setLieu(undefined)}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Description"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.description?.message}
                  placeholder="Informations complementaires..."
                  multiline
                  numberOfLines={3}
                />
              )}
            />

            <Controller
              control={control}
              name="capacite"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Nombre de places (optionnel)"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.capacite?.message}
                  keyboardType="number-pad"
                  placeholder="20"
                />
              )}
            />

            <Button
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting || mutation.isPending}
              size="lg"
              fullWidth
              className="mt-2"
            >
              Creer la session
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
