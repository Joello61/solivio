import { useState, useCallback } from 'react';
import {
  FlatList,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Search, UserCheck, UserX } from 'lucide-react-native';
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
          className={`w-10 h-10 rounded-full items-center justify-center ${
            item.presence === 'PRESENT' ? 'bg-green-500' : 'bg-green-100 active:bg-green-200'
          }`}
        >
          <UserCheck size={18} color={item.presence === 'PRESENT' ? '#fff' : '#10b981'} />
        </Pressable>
        <Pressable
          onPress={() => mutPointer.mutate('ABSENT')}
          disabled={mutPointer.isPending}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            item.presence === 'ABSENT' ? 'bg-red-500' : 'bg-red-100 active:bg-red-200'
          }`}
        >
          <UserX size={18} color={item.presence === 'ABSENT' ? '#fff' : '#ef4444'} />
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
    enabled: query.length >= 2,
    placeholderData: [],
  });

  const results = data ?? [];

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Pointage" showClose />
      <SafeAreaView edges={['bottom']} className="flex-1">
      {/* Barre de recherche */}
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <Search size={18} color="#6b7280" />
        <TextInput
          className="flex-1 text-base text-foreground"
          placeholder="Rechercher par nom (min. 2 car.)..."
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        {isFetching && <ActivityIndicator size="small" color="#16513F" />}
      </View>

      {query.length < 2 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground text-sm">
            Saisissez au moins 2 caracteres pour rechercher.
          </Text>
        </View>
      ) : results.length === 0 && !isFetching ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground text-sm">Aucun resultat.</Text>
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
