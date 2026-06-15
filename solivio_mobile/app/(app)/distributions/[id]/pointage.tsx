import { useState } from 'react';
import {
  FlatList,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Search, UserCheck, UserX, UserPlus } from 'lucide-react-native';
import { rechercherPointage, pointer } from '@/lib/api/distributions';
import { Badge } from '@/components/ui/Badge';
import type { PointageInfoResponse, StatutPresence } from '@/types/distribution';

const PRESENCE_CONFIG: Record<
  StatutPresence,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }
> = {
  NON_POINTE: { label: 'Non pointe', variant: 'secondary' },
  PRESENT: { label: 'Present', variant: 'success' },
  ABSENT: { label: 'Absent', variant: 'destructive' },
};

function PointageRow({
  item,
  distributionId,
}: {
  item: PointageInfoResponse;
  distributionId: string;
}) {
  const queryClient = useQueryClient();
  const presence = PRESENCE_CONFIG[item.presence];

  const mutPointer = useMutation({
    mutationFn: (val: StatutPresence) => pointer(distributionId, item.inscriptionId, val),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['pointage', distributionId] }),
  });

  return (
    <View className="flex-row items-center gap-3 py-3 border-b border-border px-4">
      <View className="flex-1">
        <Text className="font-medium text-foreground">
          {item.prenom} {item.nom}
        </Text>
        <View className="flex-row items-center gap-2 mt-1">
          <Badge variant="outline">
            {item.type === 'BENEFICIAIRE' ? 'Beneficiaire' : 'Benevole'}
          </Badge>
          <Badge variant={presence.variant}>{presence.label}</Badge>
        </View>
      </View>

      <View className="flex-row gap-2">
        <Pressable
          onPress={() => mutPointer.mutate('PRESENT')}
          disabled={mutPointer.isPending}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            backgroundColor:
              item.presence === 'PRESENT'
                ? '#0D9488'
                : pressed
                ? '#CCFBF1'
                : '#F0FDFA',
          })}
        >
          <UserCheck size={20} color={item.presence === 'PRESENT' ? '#fff' : '#0D9488'} />
        </Pressable>

        <Pressable
          onPress={() => mutPointer.mutate('ABSENT')}
          disabled={mutPointer.isPending}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            backgroundColor:
              item.presence === 'ABSENT'
                ? '#EF4444'
                : pressed
                ? '#FEE2E2'
                : '#FEF2F2',
          })}
        >
          <UserX size={20} color={item.presence === 'ABSENT' ? '#fff' : '#DC2626'} />
        </Pressable>
      </View>
    </View>
  );
}

export default function PointageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [query, setQuery] = useState('');

  const { data, isFetching } = useQuery({
    queryKey: ['pointage', id, query],
    queryFn: () => rechercherPointage(id, query),
    enabled: query.length >= 1,
    placeholderData: [],
  });

  const results = data ?? [];

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Pointage"
        showClose
        modal
        right={
          <Pressable
            onPress={() => router.push(`/distributions/${id}/ajout-benevole` as never)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <UserPlus size={20} color="rgba(255,255,255,0.9)" />
          </Pressable>
        }
      />
      <SafeAreaView edges={['bottom']} className="flex-1">
        {/* Barre de recherche */}
        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <Search size={18} color="#94A3B8" />
          <TextInput
            className="flex-1 text-base text-foreground"
            placeholder="Rechercher par nom ou prenom..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {isFetching ? <ActivityIndicator size="small" color="#0D9488" /> : null}
        </View>

        {query.length < 1 ? (
          <View className="flex-1 items-center justify-center gap-2 px-8">
            <Text className="text-sm text-muted-foreground text-center">
              Recherchez un participant par nom ou prenom.
            </Text>
          </View>
        ) : results.length === 0 && !isFetching ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-sm text-muted-foreground">Aucun resultat.</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.inscriptionId}
            renderItem={({ item }) => <PointageRow item={item} distributionId={id} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
