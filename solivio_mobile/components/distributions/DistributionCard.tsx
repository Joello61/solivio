import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Users, Calendar } from 'lucide-react-native';
import { StatutBadge } from './StatutBadge';
import { formatDate } from '@/lib/utils';
import type { DistributionResponse } from '@/types/distribution';

const CARD_SHADOW = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const;

const ACCENT_COLOR: Record<string, string> = {
  BROUILLON: '#CBD5E1',
  PUBLIEE:   '#0D9488',
  EN_COURS:  '#10B981',
  TERMINEE:  '#CBD5E1',
  ANNULEE:   '#EF4444',
};

interface DistributionCardProps {
  distribution: DistributionResponse;
}

export function DistributionCard({ distribution }: DistributionCardProps) {
  const router = useRouter();
  const accentColor = ACCENT_COLOR[distribution.statut] ?? '#CBD5E1';

  return (
    <Pressable
      onPress={() => router.push(`/(app)/distributions/${distribution.id}`)}
      style={({ pressed }) => [
        CARD_SHADOW,
        pressed ? { opacity: 0.82, transform: [{ scale: 0.988 }] } : null,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          overflow: 'hidden',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Barre coloree gauche */}
        <View style={{ width: 4, backgroundColor: accentColor }} />

        <View style={{ flex: 1, padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <Text
              style={{ fontSize: 15, fontWeight: '600', color: '#0F172A', flex: 1, lineHeight: 22 }}
              numberOfLines={2}
            >
              {distribution.titre}
            </Text>
            <StatutBadge statut={distribution.statut} />
          </View>

          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Calendar size={14} color="#94A3B8" />
              <Text style={{ fontSize: 13, color: '#64748B' }} className="capitalize">
                {formatDate(distribution.date)}
              </Text>
            </View>

            {distribution.lieu ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MapPin size={14} color="#94A3B8" />
                <Text style={{ fontSize: 13, color: '#64748B' }} numberOfLines={1}>
                  {distribution.lieu}
                </Text>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Users size={14} color="#94A3B8" />
              <Text style={{ fontSize: 13, color: '#64748B' }}>
                {distribution.capaciteBeneficiaires} beneficiaires
                {distribution.capaciteBenevoles != null
                  ? ` - ${distribution.capaciteBenevoles} benevoles`
                  : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
