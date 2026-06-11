import { FlatList, Text, View, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, CalendarDays } from 'lucide-react-native';
import { useAuthContext } from '@/context/AuthContext';
import { listerDistributions } from '@/lib/api/distributions';
import { AppHeader } from '@/components/layout/AppHeader';
import { DistributionCard } from '@/components/distributions/DistributionCard';
import { Spinner } from '@/components/ui/Spinner';

const FAB_SHADOW = {
  shadowColor: '#0D9488',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.35,
  shadowRadius: 16,
  elevation: 10,
} as const;

function EmptyDistributions({ estResponsable }: { estResponsable: boolean | undefined }) {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center px-8 py-16 gap-6">
      <View className="items-center gap-5">
        <View className="w-24 h-24 rounded-3xl bg-primary/10 items-center justify-center">
          <CalendarDays size={40} color="#0D9488" strokeWidth={1.5} />
        </View>
        <View className="items-center gap-2">
          <Text className="text-xl font-bold text-foreground text-center">
            Aucune distribution
          </Text>
          <Text className="text-base text-muted-foreground text-center leading-relaxed">
            {estResponsable
              ? 'Creez votre premiere distribution pour demarrer.'
              : "Aucune distribution n'est disponible pour le moment."}
          </Text>
        </View>
      </View>
      {estResponsable ? (
        <Pressable
          onPress={() => router.push('/(app)/distributions/nouvelle')}
          className="flex-row items-center gap-2 bg-primary px-6 py-3.5 rounded-xl"
          style={({ pressed }) =>
            pressed ? { opacity: 0.86, transform: [{ scale: 0.97 }] } : FAB_SHADOW
          }
        >
          <Plus size={18} color="#fff" />
          <Text className="text-base font-semibold text-white">Creer une distribution</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function DistributionsScreen() {
  const router = useRouter();
  const { user } = useAuthContext();

  const estResponsable = user?.roles.some((r) => ['responsable', 'super_admin'].includes(r));

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['distributions'],
    queryFn: listerDistributions,
  });

  if (isLoading) return <Spinner fullScreen />;

  const distributions = data ?? [];

  return (
    <View className="flex-1 bg-background">
      <AppHeader title="Distributions" />

      {distributions.length === 0 ? (
        <EmptyDistributions estResponsable={estResponsable} />
      ) : (
        <FlatList
          data={distributions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DistributionCard distribution={item} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: estResponsable ? 100 : 16,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0D9488" />
          }
        />
      )}

      {/* FAB - responsables uniquement, quand la liste est non vide */}
      {estResponsable && distributions.length > 0 ? (
        <View
          style={{
            position: 'absolute',
            right: 20,
            bottom: 24,
            ...FAB_SHADOW,
          }}
        >
          <Pressable
            onPress={() => router.push('/(app)/distributions/nouvelle')}
            className="bg-primary rounded-full w-14 h-14 items-center justify-center"
            style={({ pressed }) =>
              pressed ? { opacity: 0.88, transform: [{ scale: 0.93 }] } : null
            }
          >
            <Plus size={26} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
