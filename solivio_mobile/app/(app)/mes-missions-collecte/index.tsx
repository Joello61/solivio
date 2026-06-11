import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Truck } from 'lucide-react-native';
import { mesMissions } from '@/lib/api/collecte';
import { AppHeader } from '@/components/layout/AppHeader';
import { MissionCard } from '@/components/collecte/MissionCard';
import { Spinner } from '@/components/ui/Spinner';

export default function MesMissionsCollecteScreen() {
  const { data: missions = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['mes-missions-collecte'],
    queryFn: mesMissions,
  });

  if (isLoading) return <Spinner fullScreen />;

  return (
    <View className="flex-1 bg-background">
      <AppHeader title="Mes missions" />

      {missions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8 py-16 gap-6">
          <View className="w-20 h-20 rounded-3xl bg-primary/10 items-center justify-center">
            <Truck size={36} color="#0D9488" strokeWidth={1.5} />
          </View>
          <Text className="text-xl font-bold text-foreground text-center">
            Aucune mission
          </Text>
          <Text className="text-sm text-muted-foreground text-center leading-relaxed">
            Vous n'avez pas encore pris de mission en charge.
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
