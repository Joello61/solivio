import { useState } from 'react';
import { ScrollView, Text, View, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { buildImageUrl } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { lireAssociation, mettreAJourAssociation, uploadLogo } from '@/lib/api/association';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus } from 'lucide-react-native';

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

const schema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  contactEmail: z.string().email('Email invalide').optional().or(z.literal('')),
  contactTelephone: z.string().optional(),
  frequenceMaxParSemaine: z.string().nullable().optional(),
  couleurPrimaire: z
    .string()
    .optional()
    .refine((v) => !v || HEX_RE.test(v), 'Format attendu : #RRGGBB'),
  couleurSecondaire: z
    .string()
    .optional()
    .refine((v) => !v || HEX_RE.test(v), 'Format attendu : #RRGGBB'),
  fuseauHoraire: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function ColorInput({
  label,
  value,
  onChange,
  onBlur,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
}) {
  const isValid = HEX_RE.test(value);
  return (
    <View className="flex-row items-end gap-3">
      <View className="flex-1">
        <Input
          label={label}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error}
          placeholder="#0D9488"
          autoCapitalize="characters"
          maxLength={7}
        />
      </View>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          marginBottom: error ? 20 : 0,
          backgroundColor: isValid ? value : '#F1F5F9',
          borderWidth: 1,
          borderColor: '#E2E8F0',
        }}
      />
    </View>
  );
}

export default function ConfigurationScreen() {
  const queryClient = useQueryClient();
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

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
          couleurPrimaire: association.couleurPrimaire ?? '',
          couleurSecondaire: association.couleurSecondaire ?? '',
          fuseauHoraire: association.fuseauHoraire ?? '',
        }
      : undefined,
  });

  async function pickLogo() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusee', "L'acces a la galerie est necessaire pour changer le logo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setLogoUri(uri);
    setLogoUploading(true);
    try {
      await uploadLogo(uri);
      queryClient.invalidateQueries({ queryKey: ['association'] });
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      Alert.alert('Erreur', e.detail ?? e.message ?? "Impossible d'envoyer le logo.");
      setLogoUri(null);
    } finally {
      setLogoUploading(false);
    }
  }

  function onSubmit(data: FormData) {
    mutation.mutate({
      nom: data.nom,
      contactEmail: data.contactEmail || undefined,
      contactTelephone: data.contactTelephone || undefined,
      frequenceMaxParSemaine: data.frequenceMaxParSemaine
        ? Number(data.frequenceMaxParSemaine)
        : null,
      couleurPrimaire: data.couleurPrimaire || undefined,
      couleurSecondaire: data.couleurSecondaire || undefined,
      fuseauHoraire: data.fuseauHoraire || undefined,
    });
  }

  if (isLoading) return <Spinner fullScreen />;

  const currentLogoUrl = logoUri ?? (association ? buildImageUrl(association.logoUrl) : null);

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
            <View className="bg-muted/50 rounded-xl px-4 py-3">
              <Text className="text-sm text-muted-foreground">
                Code :{' '}
                <Text className="font-mono font-bold text-foreground">{association.code}</Text>
              </Text>
            </View>
          )}

          {/* Logo */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Logo</Text>
            <View className="flex-row items-center gap-4">
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 14,
                  backgroundColor: '#F1F5F9',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {currentLogoUrl ? (
                  <Image
                    source={{ uri: currentLogoUrl }}
                    style={{ width: 72, height: 72 }}
                    resizeMode="contain"
                  />
                ) : (
                  <ImagePlus size={28} color="#94A3B8" strokeWidth={1.5} />
                )}
              </View>
              <Button
                variant="outline"
                onPress={pickLogo}
                loading={logoUploading}
                size="sm"
              >
                {currentLogoUrl ? 'Changer le logo' : 'Ajouter un logo'}
              </Button>
            </View>
          </View>

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

          <View className="h-px bg-border" />

          <Text className="text-sm font-semibold text-foreground">Apparence</Text>

          <Controller
            control={control}
            name="couleurPrimaire"
            render={({ field: { value, onChange, onBlur } }) => (
              <ColorInput
                label="Couleur primaire"
                value={value ?? ''}
                onChange={onChange}
                onBlur={onBlur}
                error={errors.couleurPrimaire?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="couleurSecondaire"
            render={({ field: { value, onChange, onBlur } }) => (
              <ColorInput
                label="Couleur secondaire"
                value={value ?? ''}
                onChange={onChange}
                onBlur={onBlur}
                error={errors.couleurSecondaire?.message}
              />
            )}
          />

          <View className="h-px bg-border" />

          <Text className="text-sm font-semibold text-foreground">Localisation</Text>

          <Controller
            control={control}
            name="fuseauHoraire"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Fuseau horaire"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.fuseauHoraire?.message}
                placeholder="Europe/Paris"
                autoCapitalize="none"
                helper="Format IANA (ex: Europe/Paris, America/New_York)"
              />
            )}
          />

          <Button
            onPress={handleSubmit(onSubmit)}
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
