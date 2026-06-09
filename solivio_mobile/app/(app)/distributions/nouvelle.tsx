import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { creerDistribution } from '@/lib/api/distributions';

const creneauSchema = z.object({
  heureDebut: z.string().min(1, 'Heure de debut requise'),
  heureFin: z.string().min(1, 'Heure de fin requise'),
  capacite: z.string().min(1, 'Capacite requise'),
});

const schema = z.object({
  titre: z.string().min(1, 'Titre requis'),
  lieu: z.string().optional(),
  description: z.string().optional(),
  date: z.string().min(1, 'Date requise'),
  capaciteBeneficiaires: z.string().min(1, 'Capacite requise'),
  capaciteBenevoles: z.string().optional(),
  creneaux: z.array(creneauSchema).min(1, 'Au moins un creneau est requis'),
});

type FormData = z.infer<typeof schema>;

export default function NouvelleDistributionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      capaciteBeneficiaires: '',
      creneaux: [{ heureDebut: '10:00', heureFin: '12:00', capacite: '50' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'creneaux' });

  const mutation = useMutation({
    mutationFn: creerDistribution,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['distributions'] });
      router.replace(`/(app)/distributions/${data.id}` as never);
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
      lieu: data.lieu,
      description: data.description,
      date: data.date,
      capaciteBeneficiaires: Number(data.capaciteBeneficiaires),
      capaciteBenevoles: data.capaciteBenevoles ? Number(data.capaciteBenevoles) : undefined,
      modeCreneau: data.creneaux.length > 1 ? 'CRENEAUX_DECOUPES' : 'CRENEAU_UNIQUE',
      creneaux: data.creneaux.map((c) => ({
        heureDebut: c.heureDebut,
        heureFin: c.heureFin,
        capacite: Number(c.capacite),
      })),
    });
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Nouvelle distribution" showClose />
      <SafeAreaView edges={['bottom']} className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView
            contentContainerClassName="px-4 py-4 gap-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <Text className="text-sm text-destructive">{error}</Text>
              </View>
            )}

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
                  placeholder="Distribution du 15 janvier"
                />
              )}
            />

            <Controller
              control={control}
              name="date"
              render={({ field: { value, onChange } }) => (
                <DatePickerInput
                  label="Date *"
                  value={value}
                  onChange={onChange}
                  mode="date"
                  error={errors.date?.message}
                  minimumDate={new Date()}
                />
              )}
            />

            <Controller
              control={control}
              name="lieu"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Lieu"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.lieu?.message}
                  placeholder="Salle polyvalente, 12 rue..."
                />
              )}
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

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="capaciteBeneficiaires"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Input
                      label="Places beneficiaires *"
                      value={value ? String(value) : ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.capaciteBeneficiaires?.message}
                      keyboardType="number-pad"
                      placeholder="50"
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={control}
                  name="capaciteBenevoles"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Input
                      label="Places benevoles"
                      value={value ? String(value) : ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.capaciteBenevoles?.message}
                      keyboardType="number-pad"
                      placeholder="10"
                    />
                  )}
                />
              </View>
            </View>

            {/* Creneaux horaires */}
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-medium text-foreground">Creneaux horaires *</Text>
                <Pressable
                  onPress={() => append({ heureDebut: '', heureFin: '', capacite: '50' })}
                  className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg border border-input active:bg-muted"
                >
                  <Plus size={15} color="#16513F" />
                  <Text className="text-sm font-medium text-primary">Ajouter</Text>
                </Pressable>
              </View>

              {fields.map((field, index) => (
                <View key={field.id} className="bg-muted/40 rounded-xl p-3 gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-foreground">
                      Creneau {index + 1}
                    </Text>
                    {fields.length > 1 && (
                      <Pressable
                        onPress={() => remove(index)}
                        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </Pressable>
                    )}
                  </View>

                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Controller
                        control={control}
                        name={`creneaux.${index}.heureDebut`}
                        render={({ field: { value, onChange } }) => (
                          <DatePickerInput
                            label="Debut"
                            value={value}
                            onChange={onChange}
                            mode="time"
                            error={errors.creneaux?.[index]?.heureDebut?.message}
                          />
                        )}
                      />
                    </View>
                    <View className="flex-1">
                      <Controller
                        control={control}
                        name={`creneaux.${index}.heureFin`}
                        render={({ field: { value, onChange } }) => (
                          <DatePickerInput
                            label="Fin"
                            value={value}
                            onChange={onChange}
                            mode="time"
                            error={errors.creneaux?.[index]?.heureFin?.message}
                          />
                        )}
                      />
                    </View>
                  </View>

                  <Controller
                    control={control}
                    name={`creneaux.${index}.capacite`}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <Input
                        label="Places"
                        value={value ? String(value) : ''}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.creneaux?.[index]?.capacite?.message}
                        keyboardType="number-pad"
                        placeholder="50"
                      />
                    )}
                  />
                </View>
              ))}

              {errors.creneaux?.root && (
                <Text className="text-sm text-destructive">{errors.creneaux.root.message}</Text>
              )}
            </View>

            <Button
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting || mutation.isPending}
              size="lg"
              className="mt-2"
            >
              Creer la distribution
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
