import { useMemo, useState } from 'react';
import { FlatList, Text, View, Pressable, Alert, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserX, ShieldCheck, Search, ChevronDown } from 'lucide-react-native';
import { listerMembres, supprimerMembre, changerStatutMembre, mettreAJourRoleMembre } from '@/lib/api/association';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { MembreResponse } from '@/types/association';

const ROLES_LABELS: Record<string, string> = {
  responsable: 'Responsable',
  coordinateur: 'Coordinateur',
  beneficiaire: 'Beneficiaire',
  benevole: 'Benevole',
};

const ALL_ROLES = ['responsable', 'coordinateur', 'benevole', 'beneficiaire'];

function MembreCard({ membre }: { membre: MembreResponse }) {
  const queryClient = useQueryClient();

  const mutStatut = useMutation({
    mutationFn: (statut: 'actif' | 'suspendu') => changerStatutMembre(membre.compteId, statut),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['membres'] }),
    onError: (err: unknown) => {
      const e = err as { detail?: string; message?: string };
      Alert.alert('Erreur', e.detail ?? e.message ?? 'Impossible de modifier le statut.');
    },
  });

  const mutRole = useMutation({
    mutationFn: (role: string) => mettreAJourRoleMembre(membre.compteId, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['membres'] }),
    onError: (err: unknown) => {
      const e = err as { detail?: string; message?: string };
      Alert.alert('Erreur', e.detail ?? e.message ?? 'Impossible de modifier le role.');
    },
  });

  const mutSupprimer = useMutation({
    mutationFn: () => supprimerMembre(membre.compteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['membres'] }),
    onError: (err: unknown) => {
      const e = err as { detail?: string; message?: string };
      Alert.alert('Erreur', e.detail ?? e.message ?? 'Impossible de retirer le membre.');
    },
  });

  function confirmerSuppression() {
    Alert.alert(
      'Retirer le membre',
      `Retirer ${membre.prenom} ${membre.nom} de l'association ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Retirer', style: 'destructive', onPress: () => mutSupprimer.mutate() },
      ],
    );
  }

  function choisirRole() {
    const options = ALL_ROLES.filter((r) => r !== membre.role);
    Alert.alert(
      'Changer le role',
      `Role actuel : ${ROLES_LABELS[membre.role] ?? membre.role}`,
      [
        ...options.map((r) => ({
          text: ROLES_LABELS[r] ?? r,
          onPress: () => mutRole.mutate(r),
        })),
        { text: 'Annuler', style: 'cancel' as const },
      ],
    );
  }

  const estActif = membre.statut === 'actif';

  return (
    <Card>
      <View className="flex-row items-start gap-3">
        <View className="w-10 h-10 rounded-full bg-teal-100 items-center justify-center flex-shrink-0">
          <Text className="font-bold text-teal-700 text-sm">
            {membre.prenom[0]}{membre.nom[0]}
          </Text>
        </View>

        <View className="flex-1">
          <Text className="font-semibold text-foreground">
            {membre.prenom} {membre.nom}
          </Text>
          <Text className="text-sm text-muted-foreground">{membre.email}</Text>
          <View className="flex-row items-center gap-2 mt-1.5 flex-wrap">
            <Pressable
              onPress={choisirRole}
              disabled={mutRole.isPending}
              style={({ pressed }) => pressed ? { opacity: 0.7 } : null}
            >
              <View className="flex-row items-center gap-1 bg-slate-100 rounded-full px-2.5 py-1">
                <Text className="text-xs font-medium text-slate-700">
                  {ROLES_LABELS[membre.role] ?? membre.role}
                </Text>
                <ChevronDown size={11} color="#64748B" />
              </View>
            </Pressable>
            <Badge variant={estActif ? 'success' : 'warning'}>
              {estActif ? 'Actif' : 'Suspendu'}
            </Badge>
          </View>
        </View>

        <View className="flex-row gap-1">
          <Pressable
            onPress={() => mutStatut.mutate(estActif ? 'suspendu' : 'actif')}
            disabled={mutStatut.isPending}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-muted"
          >
            <ShieldCheck size={16} color={estActif ? '#D97706' : '#0D9488'} />
          </Pressable>
          <Pressable
            onPress={confirmerSuppression}
            disabled={mutSupprimer.isPending}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-red-50"
          >
            <UserX size={16} color="#ef4444" />
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

type RoleFilter = 'tous' | string;
type StatutFilter = 'tous' | 'actif' | 'suspendu';

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed ? { opacity: 0.75 } : null}
      className={`px-3 py-1.5 rounded-full border ${
        active
          ? 'bg-primary border-primary'
          : 'bg-background border-border'
      }`}
    >
      <Text className={`text-xs font-medium ${active ? 'text-white' : 'text-foreground'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function MembresScreen() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('tous');
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('tous');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['membres'],
    queryFn: listerMembres,
  });

  const membres = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (data ?? []).filter((m) => {
      if (q && !`${m.prenom} ${m.nom} ${m.email}`.toLowerCase().includes(q)) return false;
      if (roleFilter !== 'tous' && m.role !== roleFilter) return false;
      if (statutFilter !== 'tous' && m.statut !== statutFilter) return false;
      return true;
    });
  }, [data, search, roleFilter, statutFilter]);

  if (isLoading) return <Spinner fullScreen />;

  const ListHeader = (
    <View className="gap-3 mb-3">
      {/* Search */}
      <View
        className="flex-row items-center gap-2 bg-muted/60 rounded-xl px-3"
        style={{ height: 44 }}
      >
        <Search size={16} color="#94A3B8" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un membre..."
          placeholderTextColor="#94A3B8"
          className="flex-1 text-sm text-foreground"
          style={{ height: 44 }}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filtres role */}
      <View className="flex-row flex-wrap gap-2">
        <FilterChip
          label="Tous"
          active={roleFilter === 'tous'}
          onPress={() => setRoleFilter('tous')}
        />
        {ALL_ROLES.map((r) => (
          <FilterChip
            key={r}
            label={ROLES_LABELS[r] ?? r}
            active={roleFilter === r}
            onPress={() => setRoleFilter(roleFilter === r ? 'tous' : r)}
          />
        ))}
      </View>

      {/* Filtres statut */}
      <View className="flex-row gap-2">
        <FilterChip
          label="Tous"
          active={statutFilter === 'tous'}
          onPress={() => setStatutFilter('tous')}
        />
        <FilterChip
          label="Actifs"
          active={statutFilter === 'actif'}
          onPress={() => setStatutFilter(statutFilter === 'actif' ? 'tous' : 'actif')}
        />
        <FilterChip
          label="Suspendus"
          active={statutFilter === 'suspendu'}
          onPress={() => setStatutFilter(statutFilter === 'suspendu' ? 'tous' : 'suspendu')}
        />
      </View>

      {membres.length !== (data ?? []).length && (
        <Text className="text-xs text-muted-foreground">
          {membres.length} / {(data ?? []).length} membres
        </Text>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Membres" />
      <SafeAreaView edges={['bottom']} className="flex-1">
        <FlatList
          data={membres}
          keyExtractor={(item) => item.compteId}
          renderItem={({ item }) => <MembreCard membre={item} />}
          contentContainerClassName="px-4 py-4 gap-3"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0D9488" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-muted-foreground text-sm">
                {search || roleFilter !== 'tous' || statutFilter !== 'tous'
                  ? 'Aucun membre ne correspond aux filtres.'
                  : 'Aucun membre.'}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}
