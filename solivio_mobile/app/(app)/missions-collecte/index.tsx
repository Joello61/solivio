import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, Truck } from 'lucide-react-native';
import { useAuthContext } from '@/context/AuthContext';
import { listerMissions } from '@/lib/api/collecte';
import { AppHeader } from '@/components/layout/AppHeader';
import { MissionCard } from '@/components/collecte/MissionCard';
import { Spinner } from '@/components/ui/Spinner';
import type { StatutMission } from '@/types/collecte';

const ONGLETS: { statut: StatutMission | undefined; label: string }[] = [
  { statut: undefined,            label: 'Toutes' },
  { statut: 'DISPONIBLE',        label: 'Disponibles' },
  { statut: 'PRISE_EN_CHARGE',   label: 'En cours' },
  { statut: 'COLLECTE_EFFECTUEE',label: 'Collecte faite' },
  { statut: 'DEPOT_VALIDE',      label: 'Terminees' },
  { statut: 'ANNULEE',           label: 'Annulees' },
];

export default function MissionsCollecteScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [filtre, setFiltre] = useState<StatutMission | undefined>(undefined);

  const estGestionnaire = user?.roles.some((r) =>
    ['admin', 'coordinateur', 'responsable', 'super_admin'].includes(r),
  );

  const { data: missions = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['missions-collecte', filtre],
    queryFn: () => listerMissions(filtre),
  });

  if (isLoading) return <Spinner fullScreen />;

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        title="Missions collecte"
        right={
          estGestionnaire ? (
            <Pressable
              onPress={() => router.push('/(app)/missions-collecte/nouvelle' as never)}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Plus size={22} color="#0D9488" />
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {ONGLETS.map((o) => {
          const actif = filtre === o.statut;
          return (
            <Pressable
              key={o.label}
              onPress={() => setFiltre(o.statut)}
              style={{
                paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                backgroundColor: actif ? '#0D9488' : '#F1F5F9',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: actif ? '#FFFFFF' : '#64748B' }}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {missions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8 py-16 gap-6">
          <View className="w-20 h-20 rounded-3xl bg-primary/10 items-center justify-center">
            <Truck size={36} color="#0D9488" strokeWidth={1.5} />
          </View>
          <Text className="text-xl font-bold text-foreground text-center">Aucune mission</Text>
          <Text className="text-sm text-muted-foreground text-center">
            {estGestionnaire
              ? 'Aucune mission pour ce filtre.'
              : 'Aucune mission disponible pour le moment.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={missions}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MissionCard mission={item} />}
          contentContainerClassName="px-4 py-4 gap-3"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0D9488" />
          }
        />
      )}
    </View>
  );
}
