import { useMemo, useState } from 'react';
import { FlatList, Text, View, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, CalendarDays } from 'lucide-react-native';
import { useAuthContext } from '@/context/AuthContext';
import { listerDistributions } from '@/lib/api/distributions';
import { AppHeader } from '@/components/layout/AppHeader';
import { DistributionCard } from '@/components/distributions/DistributionCard';
import { Spinner } from '@/components/ui/Spinner';
import type { StatutDistribution } from '@/types/distribution';

const FAB_SHADOW = {
  shadowColor: '#0D9488',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.35,
  shadowRadius: 16,
  elevation: 10,
} as const;

const STATUT_CONFIG: Record<
  StatutDistribution,
  { label: string; color: string; bg: string; activeBg: string }
> = {
  BROUILLON: { label: 'Brouillon', color: '#64748B', bg: '#F8FAFC', activeBg: '#64748B' },
  PUBLIEE:   { label: 'Publiee',   color: '#0D9488', bg: '#F0FDFA', activeBg: '#0D9488' },
  EN_COURS:  { label: 'En cours',  color: '#10B981', bg: '#F0FDF4', activeBg: '#10B981' },
  TERMINEE:  { label: 'Terminee',  color: '#6366F1', bg: '#EEF2FF', activeBg: '#6366F1' },
  ANNULEE:   { label: 'Annulee',   color: '#EF4444', bg: '#FFF1F2', activeBg: '#EF4444' },
};

const STATUT_ORDER: StatutDistribution[] = ['EN_COURS', 'PUBLIEE', 'BROUILLON', 'TERMINEE', 'ANNULEE'];

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
  const [activeFilter, setActiveFilter] = useState<StatutDistribution | null>(null);

  const estResponsable = user?.roles.some((r) => ['responsable', 'super_admin'].includes(r));

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['distributions'],
    queryFn: listerDistributions,
  });

  const counts = useMemo(() => {
    const all = data ?? [];
    const result: Partial<Record<StatutDistribution, number>> = {};
    for (const d of all) {
      result[d.statut] = (result[d.statut] ?? 0) + 1;
    }
    return result;
  }, [data]);

  const filtered = useMemo(() => {
    const all = data ?? [];
    if (!activeFilter) return all;
    return all.filter((d) => d.statut === activeFilter);
  }, [data, activeFilter]);

  if (isLoading) return <Spinner fullScreen />;

  const allDistributions = data ?? [];
  const statusesPresent = STATUT_ORDER.filter((s) => (counts[s] ?? 0) > 0);

  const ListHeader = statusesPresent.length > 0 ? (
    <View className="mb-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
      >
        {activeFilter !== null && (
          <Pressable
            onPress={() => setActiveFilter(null)}
            style={({ pressed }) => pressed ? { opacity: 0.75 } : null}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background"
          >
            <Text className="text-xs font-medium text-muted-foreground">
              Tous ({allDistributions.length})
            </Text>
          </Pressable>
        )}
        {statusesPresent.map((s) => {
          const cfg = STATUT_CONFIG[s];
          const isActive = activeFilter === s;
          return (
            <Pressable
              key={s}
              onPress={() => setActiveFilter(activeFilter === s ? null : s)}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: isActive ? cfg.activeBg : cfg.bg,
                  borderWidth: 1,
                  borderColor: isActive ? cfg.activeBg : `${cfg.color}40`,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: isActive ? '#fff' : cfg.color,
                }}
              >
                {cfg.label}
              </Text>
              <View
                style={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : `${cfg.color}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: isActive ? '#fff' : cfg.color,
                  }}
                >
                  {counts[s]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  ) : null;

  return (
    <View className="flex-1 bg-background">
      <AppHeader title="Distributions" />

      {allDistributions.length === 0 ? (
        <EmptyDistributions estResponsable={estResponsable} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DistributionCard distribution={item} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: estResponsable ? 100 : 16,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0D9488" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-sm text-muted-foreground">
                Aucune distribution avec ce statut.
              </Text>
            </View>
          }
        />
      )}

      {/* FAB - responsables uniquement, quand la liste est non vide */}
      {estResponsable && allDistributions.length > 0 ? (
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
