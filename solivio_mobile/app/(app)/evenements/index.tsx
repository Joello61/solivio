import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, CalendarDays } from 'lucide-react-native';
import { useAuthContext } from '@/context/AuthContext';
import { listerEvenements } from '@/lib/api/evenement';
import { AppHeader } from '@/components/layout/AppHeader';
import { EvenementCard } from '@/components/evenement/EvenementCard';
import { Spinner } from '@/components/ui/Spinner';
import type { StatutEvenement } from '@/types/evenement';

const ONGLETS: { statut: StatutEvenement | undefined; label: string }[] = [
  { statut: undefined,    label: 'Tous' },
  { statut: 'PUBLIE',     label: 'Publies' },
  { statut: 'EN_COURS',   label: 'En cours' },
  { statut: 'TERMINE',    label: 'Termines' },
  { statut: 'BROUILLON',  label: 'Brouillons' },
];

export default function EvenementsScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [filtre, setFiltre] = useState<StatutEvenement | undefined>(undefined);

  const estGestionnaire = user?.roles.some((r) =>
    ['admin', 'coordinateur', 'responsable', 'super_admin'].includes(r),
  );

  const { data: evenements = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['evenements', filtre],
    queryFn: () => listerEvenements(filtre ? { statut: filtre } : undefined),
  });

  if (isLoading) return <Spinner fullScreen />;

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        title="Evenements"
        right={
          estGestionnaire ? (
            <Pressable
              onPress={() => router.push('/(app)/evenements/nouveau' as never)}
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

      {evenements.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8 py-16 gap-6">
          <View className="w-20 h-20 rounded-3xl bg-primary/10 items-center justify-center">
            <CalendarDays size={32} color="#0D9488" />
          </View>
          <Text className="text-sm text-muted-foreground text-center">
            Aucun evenement pour ce filtre.
          </Text>
        </View>
      ) : (
        <FlatList
          data={evenements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => <EvenementCard evenement={item} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0D9488" />
          }
        />
      )}
    </View>
  );
}
