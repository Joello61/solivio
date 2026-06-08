import { FlatList, Text, View, Pressable, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserX, ShieldCheck } from 'lucide-react-native';
import { listerMembres, supprimerMembre, changerStatutMembre } from '@/lib/api/association';
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

function MembreCard({ membre }: { membre: MembreResponse }) {
  const queryClient = useQueryClient();

  const mutStatut = useMutation({
    mutationFn: (statut: 'actif' | 'suspendu') => changerStatutMembre(membre.compteId, statut),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['membres'] }),
  });

  const mutSupprimer = useMutation({
    mutationFn: () => supprimerMembre(membre.compteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['membres'] }),
  });

  function confirmerSuppression() {
    Alert.alert(
      'Retirer le membre',
      `Retirer ${membre.prenom} ${membre.nom} de l'association ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => mutSupprimer.mutate(),
        },
      ],
    );
  }

  const estActif = membre.statut === 'actif';

  return (
    <Card>
      <View className="flex-row items-start gap-3">
        <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
          <Text className="font-bold text-primary-600 text-sm">
            {membre.prenom[0]}{membre.nom[0]}
          </Text>
        </View>

        <View className="flex-1">
          <Text className="font-semibold text-foreground">
            {membre.prenom} {membre.nom}
          </Text>
          <Text className="text-sm text-muted-foreground">{membre.email}</Text>
          <View className="flex-row items-center gap-2 mt-1.5">
            <Badge variant="default">
              {ROLES_LABELS[membre.role] ?? membre.role}
            </Badge>
            <Badge variant={estActif ? 'success' : 'warning'}>
              {estActif ? 'Actif' : 'Suspendu'}
            </Badge>
          </View>
        </View>

        <View className="flex-row gap-1">
          <Pressable
            onPress={() => mutStatut.mutate(estActif ? 'suspendu' : 'actif')}
            disabled={mutStatut.isPending}
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-muted"
          >
            <ShieldCheck size={16} color={estActif ? '#f59e0b' : '#10b981'} />
          </Pressable>
          <Pressable
            onPress={confirmerSuppression}
            disabled={mutSupprimer.isPending}
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-red-50"
          >
            <UserX size={16} color="#ef4444" />
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

export default function MembresScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['membres'],
    queryFn: listerMembres,
  });

  if (isLoading) return <Spinner fullScreen />;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Membres" />
      <SafeAreaView edges={['bottom']} className="flex-1">
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.compteId}
        renderItem={({ item }) => <MembreCard membre={item} />}
        contentContainerClassName="px-4 py-4 gap-3"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16513F" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-muted-foreground">Aucun membre.</Text>
          </View>
        }
      />
      </SafeAreaView>
    </View>
  );
}
