import { FlatList, Text, View, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, PackageOpen } from 'lucide-react-native';
import { useAuthContext } from '@/context/AuthContext';
import { listerSessions } from '@/lib/api/reconditionnement';
import { AppHeader } from '@/components/layout/AppHeader';
import { SessionCard } from '@/components/reconditionnement/SessionCard';
import { Spinner } from '@/components/ui/Spinner';

export default function ReconditionnementListeScreen() {
  const router = useRouter();
  const { user } = useAuthContext();

  const estResponsable = user?.roles.some((r) => ['responsable', 'super_admin'].includes(r));
  const estCoordinateur = user?.roles.some((r) =>
    ['coordinateur', 'responsable', 'super_admin'].includes(r),
  );

  const { data: sessions = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['sessions-reco'],
    queryFn: listerSessions,
  });

  if (isLoading) return <Spinner fullScreen />;

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        title="Reconditionnement"
        right={
          estResponsable ? (
            <Pressable
              onPress={() => router.push('/(app)/reconditionnement/nouvelle' as never)}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Plus size={22} color="#0D9488" />
            </Pressable>
          ) : undefined
        }
      />

      {sessions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8 py-16 gap-6">
          <View className="w-20 h-20 rounded-3xl bg-primary/10 items-center justify-center">
            <PackageOpen size={36} color="#0D9488" strokeWidth={1.5} />
          </View>
          <View className="items-center gap-2">
            <Text className="text-xl font-bold text-foreground text-center">
              Aucune session
            </Text>
            <Text className="text-sm text-muted-foreground text-center leading-relaxed">
              {estCoordinateur
                ? 'Aucune session de reconditionnement creee.'
                : 'Aucune session disponible pour le moment.'}
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => <SessionCard session={item} />}
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
