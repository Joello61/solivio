import { useState, useCallback } from 'react';
import {
  FlatList,
  Text,
  View,
  Pressable,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ShieldCheck, Trash2, Shield } from 'lucide-react-native';
import {
  listerComptesAdmin,
  changerStatutCompte,
  changerSuperAdmin,
  supprimerCompteAdmin,
} from '@/lib/api/profil';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { CompteAdminResponse } from '@/types/profil';

function CompteCard({ compte }: { compte: CompteAdminResponse }) {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin-comptes'] });
  }, [queryClient]);

  const mutStatut = useMutation({
    mutationFn: (actif: boolean) => changerStatutCompte(compte.id, actif),
    onSuccess: invalidate,
    onError: (err: unknown) => {
      const e = err as { detail?: string; message?: string };
      Alert.alert('Erreur', e.detail ?? e.message ?? 'Impossible de modifier le statut.');
    },
  });

  const mutSuperAdmin = useMutation({
    mutationFn: (superAdmin: boolean) => changerSuperAdmin(compte.id, superAdmin),
    onSuccess: invalidate,
    onError: (err: unknown) => {
      const e = err as { detail?: string; message?: string };
      Alert.alert('Erreur', e.detail ?? e.message ?? 'Impossible de modifier le role.');
    },
  });

  const mutSupprimer = useMutation({
    mutationFn: () => supprimerCompteAdmin(compte.id),
    onSuccess: invalidate,
    onError: (err: unknown) => {
      const e = err as { detail?: string; message?: string };
      Alert.alert('Erreur', e.detail ?? e.message ?? 'Impossible de supprimer ce compte.');
    },
  });

  function confirmerSuppression() {
    Alert.alert(
      'Supprimer le compte',
      `Supprimer definitivement le compte de ${compte.prenom} ${compte.nom} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => mutSupprimer.mutate(),
        },
      ],
    );
  }

  return (
    <Card>
      <View className="flex-row items-start gap-3">
        <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center flex-shrink-0">
          <Text className="font-bold text-slate-600 text-sm">
            {compte.prenom[0]}{compte.nom[0]}
          </Text>
        </View>

        <View className="flex-1">
          <Text className="font-semibold text-foreground">
            {compte.prenom} {compte.nom}
          </Text>
          <Text className="text-sm text-muted-foreground">{compte.email}</Text>
          <View className="flex-row items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant={compte.actif ? 'success' : 'warning'}>
              {compte.actif ? 'Actif' : 'Inactif'}
            </Badge>
            {compte.superAdmin && (
              <Badge variant="default">Super admin</Badge>
            )}
            {compte.affiliations.slice(0, 2).map((a, i) => (
              <Badge key={i} variant="outline">{a.associationNom}</Badge>
            ))}
          </View>
        </View>

        <View className="flex-row gap-1">
          <Pressable
            onPress={() => mutStatut.mutate(!compte.actif)}
            disabled={mutStatut.isPending}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-muted"
          >
            <ShieldCheck size={16} color={compte.actif ? '#D97706' : '#0D9488'} />
          </Pressable>
          <Pressable
            onPress={() => mutSuperAdmin.mutate(!compte.superAdmin)}
            disabled={mutSuperAdmin.isPending}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-muted"
          >
            <Shield size={16} color={compte.superAdmin ? '#6366F1' : '#94A3B8'} />
          </Pressable>
          <Pressable
            onPress={confirmerSuppression}
            disabled={mutSupprimer.isPending}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-red-50"
          >
            <Trash2 size={16} color="#EF4444" />
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

export default function UtilisateursScreen() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-comptes', search, page],
    queryFn: () => listerComptesAdmin(search || undefined, page, 20),
  });

  const comptes = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  function handleSearch(text: string) {
    setSearch(text);
    setPage(0);
  }

  if (isLoading) return <Spinner fullScreen />;

  const ListHeader = (
    <View className="gap-3 mb-3">
      <View
        className="flex-row items-center gap-2 bg-muted/60 rounded-xl px-3"
        style={{ height: 44 }}
      >
        <Search size={16} color="#94A3B8" />
        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder="Rechercher un utilisateur..."
          placeholderTextColor="#94A3B8"
          className="flex-1 text-sm text-foreground"
          style={{ height: 44 }}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
      {totalElements > 0 && (
        <Text className="text-xs text-muted-foreground">
          {totalElements} utilisateur{totalElements > 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );

  const ListFooter =
    totalPages > 1 ? (
      <View className="flex-row items-center justify-between mt-4 gap-3">
        <Pressable
          onPress={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="flex-1 items-center py-2.5 rounded-xl border border-border active:bg-muted"
          style={({ pressed }) => pressed ? { opacity: 0.75 } : null}
        >
          <Text className={`text-sm font-medium ${page === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
            Precedent
          </Text>
        </Pressable>
        <Text className="text-xs text-muted-foreground">
          {page + 1} / {totalPages}
        </Text>
        <Pressable
          onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          className="flex-1 items-center py-2.5 rounded-xl border border-border active:bg-muted"
          style={({ pressed }) => pressed ? { opacity: 0.75 } : null}
        >
          <Text className={`text-sm font-medium ${page >= totalPages - 1 ? 'text-muted-foreground' : 'text-foreground'}`}>
            Suivant
          </Text>
        </Pressable>
      </View>
    ) : null;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Utilisateurs" />
      <SafeAreaView edges={['bottom']} className="flex-1">
        <FlatList
          data={comptes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CompteCard compte={item} />}
          contentContainerClassName="px-4 py-4 gap-3"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0D9488" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-sm text-muted-foreground">
                {search ? 'Aucun utilisateur trouve.' : 'Aucun utilisateur.'}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}
