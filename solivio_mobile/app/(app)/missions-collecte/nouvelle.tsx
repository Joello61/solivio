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
import { creerMission } from '@/lib/api/collecte';
import type { LieuRequest } from '@/types/distribution';

const schema = z.object({
  titre: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  dateHeure: z.string().min(1, 'Date et heure requises'),
  capacitePersonnes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NouvelleMissionCollecteScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [lieuCollecte, setLieuCollecte] = useState<LieuRequest | undefined>(undefined);
  const [lieuDepot, setLieuDepot] = useState<LieuRequest | undefined>(undefined);
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

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: creerMission,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['missions-collecte'] });
      router.replace(`/(app)/missions-collecte/${data.id}` as never);
    },
    onError: (err: unknown) => {
      const e = err as { detail?: string; message?: string };
      setError(e.detail ?? e.message ?? 'Erreur lors de la creation.');
    },
  });

  function onSubmit(data: FormData) {
    setError(null);
    mutation.mutate({
      titre: data.titre,
      description: data.description,
      lieuCollecte: lieuCollecte
        ? { placeId: lieuCollecte.placeId, adresseFormatee: lieuCollecte.adresseFormatee,
            latitude: lieuCollecte.latitude, longitude: lieuCollecte.longitude }
        : undefined,
      lieuDepot: lieuDepot
        ? { placeId: lieuDepot.placeId, adresseFormatee: lieuDepot.adresseFormatee,
            latitude: lieuDepot.latitude, longitude: lieuDepot.longitude }
        : undefined,
      dateHeure: new Date(data.dateHeure).toISOString(),
      capacitePersonnes: data.capacitePersonnes ? parseInt(data.capacitePersonnes, 10) : undefined,
    });
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Nouvelle mission" showClose modal />
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
              control={control} name="titre"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Titre *" value={value} onChangeText={onChange} onBlur={onBlur}
                  error={errors.titre?.message} placeholder="Collecte alimentaire quartier Nord"
                />
              )}
            />

            <Controller
              control={control} name="dateHeure"
              render={({ field: { value, onChange } }) => (
                <DatePickerInput
                  label="Date et heure *" value={value} onChange={onChange}
                  mode="datetime" error={errors.dateHeure?.message} minimumDate={new Date()}
                />
              )}
            />

            <AdresseAutocompleteInput
              apiKey={mapsApiKey} label="Lieu de collecte"
              value={lieuCollecte?.adresseFormatee}
              onSelect={setLieuCollecte}
              onClear={() => setLieuCollecte(undefined)}
            />

            <AdresseAutocompleteInput
              apiKey={mapsApiKey} label="Lieu de depot"
              value={lieuDepot?.adresseFormatee}
              onSelect={setLieuDepot}
              onClear={() => setLieuDepot(undefined)}
            />

            <Controller
              control={control} name="description"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Description" value={value ?? ''} onChangeText={onChange} onBlur={onBlur}
                  placeholder="Informations complementaires..." multiline numberOfLines={3}
                />
              )}
            />

            <Controller
              control={control} name="capacitePersonnes"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Nombre de benevoles" value={value ?? ''} onChangeText={onChange} onBlur={onBlur}
                  keyboardType="number-pad" placeholder="6"
                />
              )}
            />

            <Button
              onPress={handleSubmit(onSubmit)} loading={isSubmitting || mutation.isPending}
              size="lg" fullWidth className="mt-2"
            >
              Creer la mission
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
