import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react-native';
import { mesEvenements } from '@/lib/api/evenement';
import { AppHeader } from '@/components/layout/AppHeader';
import { Spinner } from '@/components/ui/Spinner';

const COULEUR_PRESENCE: Record<string, { bg: string; text: string }> = {
  NON_POINTE: { bg: '#F1F5F9', text: '#475569' },
  PRESENT:    { bg: '#ECFDF5', text: '#059669' },
  ABSENT:     { bg: '#FEF2F2', text: '#DC2626' },
};

const LABEL_PRESENCE: Record<string, string> = {
  NON_POINTE: 'Non pointe',
  PRESENT:    'Present',
  ABSENT:     'Absent',
};

export default function MesEvenementsScreen() {
  const router = useRouter();
  const { data: participations = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['mes-evenements'],
    queryFn: mesEvenements,
  });

  if (isLoading) return <Spinner fullScreen />;

  return (
    <View className="flex-1 bg-background">
      <AppHeader title="Mes evenements" />
      <FlatList
        data={participations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0D9488" />
        }
        renderItem={({ item }) => {
          const couleur = COULEUR_PRESENCE[item.presence] ?? COULEUR_PRESENCE.NON_POINTE;
          return (
            <Pressable
              onPress={() => router.push(`/(app)/evenements/${item.evenementId}` as never)}
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
            >
              <View
                style={{
                  backgroundColor: '#FFFFFF', borderRadius: 16,
                  borderWidth: 1, borderColor: '#E2E8F0',
                  padding: 14, flexDirection: 'row',
                  alignItems: 'center', justifyContent: 'space-between', gap: 8,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }} numberOfLines={1}>
                    {item.personneNomComplet ?? 'Evenement'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>
                    {item.role === 'STAFF' ? 'Staff' : 'Participant'} - Inscrit le{' '}
                    {new Date(item.dateInscription).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <View style={{
                  borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
                  backgroundColor: couleur.bg,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: couleur.text }}>
                    {LABEL_PRESENCE[item.presence] ?? item.presence}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20 gap-6">
            <View className="w-20 h-20 rounded-3xl bg-primary/10 items-center justify-center">
              <CalendarDays size={32} color="#0D9488" />
            </View>
            <Text className="text-sm text-muted-foreground text-center">
              {"Vous n'etes inscrit a aucun evenement."}
            </Text>
          </View>
        }
      />
    </View>
  );
}
