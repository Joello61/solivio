import { ScrollView, Text, View, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { buildImageUrl } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { lireAssociation, mettreAJourAssociation } from '@/lib/api/association';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

const schema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  contactEmail: z.string().email('Email invalide').optional().or(z.literal('')),
  contactTelephone: z.string().optional(),
  frequenceMaxParSemaine: z.string().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ConfigurationScreen() {
  const queryClient = useQueryClient();

  const { data: association, isLoading } = useQuery({
    queryKey: ['association'],
    queryFn: lireAssociation,
  });

  const mutation = useMutation({
    mutationFn: mettreAJourAssociation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['association'] });
      Alert.alert('Succes', 'Configuration mise a jour.');
    },
    onError: (err: unknown) => {
      const e = err as { detail?: string; message?: string };
      Alert.alert('Erreur', e.detail ?? e.message ?? 'Impossible de mettre a jour.');
    },
  });

  const { control, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: association
      ? {
          nom: association.nom,
          contactEmail: association.contactEmail ?? '',
          contactTelephone: association.contactTelephone ?? '',
          frequenceMaxParSemaine: association.frequenceMaxParSemaine != null
            ? String(association.frequenceMaxParSemaine)
            : null,
        }
      : undefined,
  });

  if (isLoading) return <Spinner fullScreen />;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Configuration" />
      <SafeAreaView edges={['bottom']} className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 gap-4"
        showsVerticalScrollIndicator={false}
      >
        {association && (
          <View className="bg-muted rounded-xl px-4 py-3 gap-3">
            {buildImageUrl(association.logoUrl) && (
              <Image
                source={{ uri: buildImageUrl(association.logoUrl)! }}
                style={{ width: 64, height: 64, borderRadius: 12 }}
                resizeMode="contain"
              />
            )}
            <Text className="text-sm text-muted-foreground">
              Code association : <Text className="font-mono font-bold text-foreground">{association.code}</Text>
            </Text>
          </View>
        )}

        <Controller
          control={control}
          name="nom"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Nom de l'association *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.nom?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="contactEmail"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Email de contact"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.contactEmail?.message}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />

        <Controller
          control={control}
          name="contactTelephone"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Telephone de contact"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
            />
          )}
        />

        <Controller
          control={control}
          name="frequenceMaxParSemaine"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Frequence max par semaine"
              value={value != null ? String(value) : ''}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="number-pad"
              placeholder="Aucune limite"
            />
          )}
        />

        <Button
          onPress={handleSubmit((d) => mutation.mutate({
            ...d,
            frequenceMaxParSemaine: d.frequenceMaxParSemaine ? Number(d.frequenceMaxParSemaine) : null,
          }))}
          loading={mutation.isPending}
          disabled={!isDirty}
          size="lg"
          className="mt-2"
        >
          Enregistrer
        </Button>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}
