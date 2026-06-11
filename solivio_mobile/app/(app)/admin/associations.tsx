import { useState } from 'react';
import { FlatList, Text, View, Pressable, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Building2, X } from 'lucide-react-native';
import { listerAssociationsAdmin, creerAssociation } from '@/lib/api/association';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import type { AssociationAdminResponse } from '@/types/association';

const schema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  slug: z
    .string()
    .min(2, 'Slug requis (min 2 caracteres)')
    .regex(/^[a-z0-9-]+$/, 'Uniquement lettres minuscules, chiffres et tirets'),
  emailResponsable: z.string().email('Email invalide'),
});

type FormData = z.infer<typeof schema>;

const STATUT_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'default' }> = {
  active:    { label: 'Active',    variant: 'success' },
  suspendue: { label: 'Suspendue', variant: 'warning' },
  fermee:    { label: 'Fermee',    variant: 'destructive' },
};

function AssociationCard({ asso }: { asso: AssociationAdminResponse }) {
  const cfg = STATUT_CONFIG[asso.statut] ?? { label: asso.statut, variant: 'default' as const };
  return (
    <Card>
      <View className="flex-row items-start gap-3">
        <View className="w-10 h-10 rounded-xl bg-teal-50 items-center justify-center flex-shrink-0">
          <Building2 size={18} color="#0D9488" />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-foreground">{asso.nom}</Text>
          <View className="flex-row items-center gap-2 mt-0.5">
            <Text className="text-xs font-mono text-muted-foreground">{asso.code}</Text>
            <Text className="text-xs text-muted-foreground">·</Text>
            <Text className="text-xs text-muted-foreground">{asso.slug}</Text>
          </View>
          <View className="flex-row items-center gap-2 mt-1.5">
            <View
              className={`px-2 py-0.5 rounded-full ${
                cfg.variant === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : cfg.variant === 'warning'
                  ? 'bg-amber-50 border border-amber-200'
                  : cfg.variant === 'destructive'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-muted border border-border'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  cfg.variant === 'success'
                    ? 'text-green-700'
                    : cfg.variant === 'warning'
                    ? 'text-amber-700'
                    : cfg.variant === 'destructive'
                    ? 'text-red-700'
                    : 'text-foreground'
                }`}
              >
                {cfg.label}
              </Text>
            </View>
            <Text className="text-xs text-muted-foreground">
              Creee le {formatDate(asso.dateCreation)}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

function CreationForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nom: '', slug: '', emailResponsable: '' },
  });

  const mutation = useMutation({
    mutationFn: creerAssociation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-associations'] });
      reset();
      onClose();
      Alert.alert('Succes', 'Association creee.');
    },
    onError: (err: unknown) => {
      const e = err as { detail?: string; message?: string };
      Alert.alert('Erreur', e.detail ?? e.message ?? "Impossible de creer l'association.");
    },
  });

  return (
    <View className="bg-card border border-border rounded-2xl p-4 gap-4 mb-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-foreground">Nouvelle association</Text>
        <Pressable
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={18} color="#94A3B8" />
        </Pressable>
      </View>

      <Controller
        control={control}
        name="nom"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Nom *"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.nom?.message}
            placeholder="Banque Alimentaire XYZ"
          />
        )}
      />

      <Controller
        control={control}
        name="slug"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Slug *"
            value={value}
            onChangeText={(t) => onChange(t.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            onBlur={onBlur}
            error={errors.slug?.message}
            placeholder="banque-alimentaire-xyz"
            autoCapitalize="none"
            helper="Identifiant unique dans l'URL (lettres minuscules, tirets)"
          />
        )}
      />

      <Controller
        control={control}
        name="emailResponsable"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Email du responsable *"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.emailResponsable?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="responsable@asso.fr"
          />
        )}
      />

      <Button
        onPress={handleSubmit((d) => mutation.mutate(d))}
        loading={mutation.isPending}
        fullWidth
      >
        Creer
      </Button>
    </View>
  );
}

export default function AssociationsScreen() {
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-associations'],
    queryFn: listerAssociationsAdmin,
  });

  if (isLoading) return <Spinner fullScreen />;

  const associations = data ?? [];

  const ListHeader = (
    <View className="mb-1">
      {showForm ? (
        <CreationForm onClose={() => setShowForm(false)} />
      ) : null}
      {associations.length > 0 && (
        <Text className="text-xs text-muted-foreground mb-3">
          {associations.length} association{associations.length > 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Associations" />
      <SafeAreaView edges={['bottom']} className="flex-1">
        <FlatList
          data={associations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AssociationCard asso={item} />}
          contentContainerClassName="px-4 py-4 gap-3"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0D9488" />
          }
          ListEmptyComponent={
            !showForm ? (
              <View className="items-center justify-center py-12">
                <Text className="text-sm text-muted-foreground">Aucune association.</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>

      {!showForm ? (
        <View style={{ position: 'absolute', right: 20, bottom: 24 }}>
          <Pressable
            onPress={() => setShowForm(true)}
            className="bg-primary rounded-full w-14 h-14 items-center justify-center"
            style={({ pressed }) =>
              pressed ? { opacity: 0.88, transform: [{ scale: 0.93 }] } : {
                shadowColor: '#0D9488',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 10,
              }
            }
          >
            <Plus size={26} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
