import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Users, Calendar } from 'lucide-react-native';
import { StatutBadge } from './StatutBadge';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { DistributionResponse } from '@/types/distribution';

interface DistributionCardProps {
  distribution: DistributionResponse;
}

const STATUT_ACCENT: Record<string, string> = {
  BROUILLON: 'bg-border',
  PUBLIEE:   'bg-primary',
  EN_COURS:  'bg-emerald-500',
  TERMINEE:  'bg-border',
  ANNULEE:   'bg-destructive',
};

export function DistributionCard({ distribution }: DistributionCardProps) {
  const router = useRouter();
  const accentClass = STATUT_ACCENT[distribution.statut] ?? 'bg-border';

  return (
    <Pressable
      onPress={() => router.push(`/(app)/distributions/${distribution.id}`)}
      className="active:opacity-75"
    >
      <View className="flex-row overflow-hidden rounded-xl border border-border bg-card">
        {/* Barre coloree gauche identique au web */}
        <View className={cn('w-1 shrink-0', accentClass)} />

        <View className="flex-1 p-4 gap-3">
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className="text-base font-semibold text-foreground flex-1 leading-snug"
              numberOfLines={2}
            >
              {distribution.titre}
            </Text>
            <StatutBadge statut={distribution.statut} />
          </View>

          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <Calendar size={15} color="#5E7A6B" />
              <Text className="text-sm text-muted-foreground capitalize">
                {formatDate(distribution.date)}
              </Text>
            </View>

            {distribution.lieu && (
              <View className="flex-row items-center gap-2">
                <MapPin size={15} color="#5E7A6B" />
                <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                  {distribution.lieu}
                </Text>
              </View>
            )}

            <View className="flex-row items-center gap-2">
              <Users size={15} color="#5E7A6B" />
              <Text className="text-sm text-muted-foreground">
                {distribution.capaciteBeneficiaires} beneficiaires
                {distribution.capaciteBenevoles != null &&
                  ` - ${distribution.capaciteBenevoles} benevoles`}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
