import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, Users } from 'lucide-react-native';
import { StatutBadge } from './StatutBadge';
import type { SessionReconditionnementResponse } from '@/types/reconditionnement';

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

interface Props {
  session: SessionReconditionnementResponse;
}

export function SessionCard({ session }: Props) {
  const router = useRouter();
  const accentColor = ACCENT_COLOR[session.statut] ?? '#CBD5E1';

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <Pressable
      onPress={() => router.push(`/(app)/reconditionnement/${session.id}` as never)}
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
        <View style={{ width: 4, backgroundColor: accentColor }} />

        <View style={{ flex: 1, padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <Text
              style={{ fontSize: 15, fontWeight: '600', color: '#0F172A', flex: 1, lineHeight: 22 }}
              numberOfLines={2}
            >
              {session.titre}
            </Text>
            <StatutBadge statut={session.statut} />
          </View>

          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Calendar size={14} color="#94A3B8" />
              <Text style={{ fontSize: 13, color: '#64748B' }}>
                {formatDate(session.dateHeureDebut)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Clock size={14} color="#94A3B8" />
              <Text style={{ fontSize: 13, color: '#64748B' }}>
                {formatTime(session.dateHeureDebut)} - {formatTime(session.dateHeureFin)}
              </Text>
            </View>

            {session.lieu?.adresseFormatee ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MapPin size={14} color="#94A3B8" />
                <Text style={{ fontSize: 13, color: '#64748B' }} numberOfLines={1}>
                  {session.lieu.adresseFormatee}
                </Text>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Users size={14} color="#94A3B8" />
              <Text style={{ fontSize: 13, color: '#64748B' }}>
                {session.nbInscrits} inscrit{session.nbInscrits !== 1 ? 's' : ''}
                {session.capacite != null ? ` / ${session.capacite} places` : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
