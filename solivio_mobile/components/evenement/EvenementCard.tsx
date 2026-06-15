import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, MapPin, UserCheck, Users } from 'lucide-react-native';
import { StatutBadge } from './StatutBadge';
import type { EvenementResponse } from '@/types/evenement';

const CARD_SHADOW = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const;

const ACCENT: Record<string, string> = {
  BROUILLON:  '#94A3B8',
  PUBLIE:     '#0D9488',
  EN_COURS:   '#3B82F6',
  TERMINE:    '#10B981',
  ANNULE:     '#EF4444',
};

const LABEL_TYPE: Record<string, string> = {
  STAND: 'Stand',
  FETE: 'Fete',
  AUTRE: 'Evenement',
};

interface Props {
  evenement: EvenementResponse;
}

export function EvenementCard({ evenement }: Props) {
  const router = useRouter();
  const accentColor = ACCENT[evenement.statut] ?? '#CBD5E1';

  return (
    <Pressable
      onPress={() => router.push(`/(app)/evenements/${evenement.id}` as never)}
      style={({ pressed }) => [
        CARD_SHADOW,
        pressed ? { opacity: 0.82, transform: [{ scale: 0.988 }] } : null,
      ]}
    >
      <View style={styles.card}>
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
        <View style={styles.body}>
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={styles.type}>{LABEL_TYPE[evenement.type] ?? evenement.type}</Text>
              <Text style={styles.titre} numberOfLines={2}>{evenement.titre}</Text>
            </View>
            <StatutBadge statut={evenement.statut} />
          </View>
          <View style={styles.meta}>
            <View style={styles.row}>
              <Calendar size={13} color="#94A3B8" />
              <Text style={styles.metaText}>
                {new Date(evenement.dateHeureDebut).toLocaleString('fr-FR', {
                  weekday: 'short', day: 'numeric', month: 'short',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
            {evenement.lieuAdresseFormatee ? (
              <View style={styles.row}>
                <MapPin size={13} color="#94A3B8" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {evenement.lieuAdresseFormatee}
                </Text>
              </View>
            ) : null}
            <View style={styles.row}>
              {evenement.aBesoiNStaff ? (
                <View style={styles.row}>
                  <UserCheck size={13} color="#94A3B8" />
                  <Text style={styles.metaText}>
                    {evenement.nbStaff}{evenement.capaciteStaff ? `/${evenement.capaciteStaff}` : ''} staff
                  </Text>
                </View>
              ) : null}
              {evenement.ouvertParticipants ? (
                <View style={[styles.row, { marginLeft: 10 }]}>
                  <Users size={13} color="#94A3B8" />
                  <Text style={styles.metaText}>
                    {evenement.nbParticipants}{evenement.capaciteParticipants ? `/${evenement.capaciteParticipants}` : ''} part.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', overflow: 'hidden',
    borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF',
  },
  accent: { width: 4 },
  body: { flex: 1, padding: 14, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  titleBlock: { flex: 1, gap: 2 },
  type: { fontSize: 10, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  titre: { fontSize: 14, fontWeight: '600', color: '#0F172A', lineHeight: 20 },
  meta: { gap: 5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#64748B', flex: 1 },
});
