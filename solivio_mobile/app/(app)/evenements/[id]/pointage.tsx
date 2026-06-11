import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react-native';
import { listerPourPointage, pointer } from '@/lib/api/evenement';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Spinner } from '@/components/ui/Spinner';
import type { ParticipationEvenementResponse, PresenceEvenement } from '@/types/evenement';

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

export default function PointageEvenementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [recherche, setRecherche] = useState('');

  const { data: participations = [], isLoading } = useQuery({
    queryKey: ['pointage-evenement', id],
    queryFn: () => listerPourPointage(id),
  });

  const pointerMutation = useMutation({
    mutationFn: ({ participationId, presence }: {
      participationId: string;
      presence: PresenceEvenement;
    }) => pointer(id, participationId, presence),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ['pointage-evenement', id],
        (prev: ParticipationEvenementResponse[] | undefined) =>
          prev?.map((p) => (p.id === updated.id ? updated : p)) ?? [updated],
      );
    },
  });

  const filtrees = recherche.trim()
    ? participations.filter((p) =>
        p.personneNomComplet?.toLowerCase().includes(recherche.toLowerCase()),
      )
    : participations;

  const presents = participations.filter((p) => p.presence === 'PRESENT').length;

  if (isLoading) return <Spinner fullScreen />;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Pointage" />

      <View className="px-4 pt-3 pb-2">
        <Text className="text-xs text-muted-foreground mb-2">
          {presents} / {participations.length} pointe{participations.length > 1 ? 's' : ''}
        </Text>
        <TextInput
          placeholder="Rechercher..."
          value={recherche}
          onChangeText={setRecherche}
          className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <FlatList
        data={filtrees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }) => {
          const couleur = COULEUR_PRESENCE[item.presence] ?? COULEUR_PRESENCE.NON_POINTE;
          return (
            <View
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: '#FFFFFF', borderRadius: 14,
                borderWidth: 1, borderColor: '#E2E8F0', padding: 12, gap: 8,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }} numberOfLines={1}>
                  {item.personneNomComplet ?? 'Inconnu'}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>
                  {item.role === 'STAFF' ? 'Staff' : 'Participant'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
                  backgroundColor: couleur.bg,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: couleur.text }}>
                    {LABEL_PRESENCE[item.presence] ?? item.presence}
                  </Text>
                </View>
                <Pressable
                  onPress={() => pointerMutation.mutate({ participationId: item.id, presence: 'PRESENT' })}
                  disabled={item.presence === 'PRESENT' || pointerMutation.isPending}
                  style={({ pressed }) => ({
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: '#ECFDF5',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: item.presence === 'PRESENT' || pressed ? 0.5 : 1,
                  })}
                >
                  <Check size={18} color="#059669" />
                </Pressable>
                <Pressable
                  onPress={() => pointerMutation.mutate({ participationId: item.id, presence: 'ABSENT' })}
                  disabled={item.presence === 'ABSENT' || pointerMutation.isPending}
                  style={({ pressed }) => ({
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: '#FEF2F2',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: item.presence === 'ABSENT' || pressed ? 0.5 : 1,
                  })}
                >
                  <X size={18} color="#DC2626" />
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="py-10 items-center">
            <Text className="text-sm text-muted-foreground">Aucun participant.</Text>
          </View>
        }
      />
    </View>
  );
}
