import { FlatList, Text, View, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, CalendarDays, ChevronRight } from 'lucide-react-native';
import { useAuthContext } from '@/context/AuthContext';
import { listerDistributions } from '@/lib/api/distributions';
import { AppHeader } from '@/components/layout/AppHeader';
import { DistributionCard } from '@/components/distributions/DistributionCard';
import { Spinner } from '@/components/ui/Spinner';

function EmptyDistributions({ estResponsable }: { estResponsable: boolean | undefined }) {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center px-8 py-16 gap-6">
      <View className="items-center gap-5">
        <View className="w-24 h-24 rounded-3xl bg-primary-50 items-center justify-center">
          <CalendarDays size={40} color="#16513F" strokeWidth={1.5} />
        </View>
        <View className="items-center gap-2">
          <Text className="text-xl font-bold text-foreground text-center">
            Aucune distribution
          </Text>
          <Text className="text-base text-muted-foreground text-center leading-relaxed">
            {estResponsable
              ? 'Creez votre premiere distribution pour demarrer.'
              : 'Aucune distribution n\'est disponible pour le moment.'}
          </Text>
        </View>
      </View>
      {estResponsable && (
        <Pressable
          onPress={() => router.push('/(app)/distributions/nouvelle')}
          className="flex-row items-center gap-2 bg-primary px-6 py-3.5 rounded-xl active:bg-primary-700"
        >
          <Plus size={18} color="#fff" />
          <Text className="text-base font-semibold text-white">Creer une distribution</Text>
        </Pressable>
      )}
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

  const boutonNouvelle = estResponsable ? (
    <Pressable
      onPress={() => router.push('/(app)/distributions/nouvelle')}
      className="flex-row items-center gap-1.5 bg-white/20 rounded-lg px-3 py-2 active:bg-white/30"
    >
      <Plus size={16} color="#fff" />
      <Text className="text-sm font-semibold text-white">Nouvelle</Text>
    </Pressable>
  ) : undefined;

  return (
    <View className="flex-1 bg-background">
      <AppHeader title="Distributions" right={boutonNouvelle} />

      {distributions.length === 0 ? (
        <EmptyDistributions estResponsable={estResponsable} />
      ) : (
        <FlatList
          data={distributions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DistributionCard distribution={item} />}
          contentContainerClassName="px-4 py-4 gap-3"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16513F" />
          }
        />
      )}
    </View>
  );
}
