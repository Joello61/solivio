import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, MapPin, Truck, User } from 'lucide-react-native';
import { StatutBadge } from './StatutBadge';
import type { MissionCollecteResponse } from '@/types/collecte';

const CARD_SHADOW = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const;

const ACCENT: Record<string, string> = {
  DISPONIBLE:        '#0D9488',
  PRISE_EN_CHARGE:   '#F59E0B',
  COLLECTE_EFFECTUEE:'#3B82F6',
  DEPOT_VALIDE:      '#10B981',
  ANNULEE:           '#EF4444',
};

interface Props {
  mission: MissionCollecteResponse;
}

export function MissionCard({ mission }: Props) {
  const router = useRouter();
  const accentColor = ACCENT[mission.statut] ?? '#CBD5E1';

  return (
    <Pressable
      onPress={() => router.push(`/(app)/missions-collecte/${mission.id}` as never)}
      style={({ pressed }) => [
        CARD_SHADOW,
        pressed ? { opacity: 0.82, transform: [{ scale: 0.988 }] } : null,
      ]}
    >
      <View style={styles.card}>
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
        <View style={styles.body}>
          <View style={styles.header}>
            <Text style={styles.titre} numberOfLines={2}>{mission.titre}</Text>
            <StatutBadge statut={mission.statut} />
          </View>

          <View style={styles.meta}>
            <View style={styles.row}>
              <Calendar size={13} color="#94A3B8" />
              <Text style={styles.metaText}>
                {new Date(mission.dateHeure).toLocaleString('fr-FR', {
                  weekday: 'short', day: 'numeric', month: 'short',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
            {mission.lieuCollecte?.adresseFormatee ? (
              <View style={styles.row}>
                <MapPin size={13} color="#94A3B8" />
                <Text style={styles.metaText} numberOfLines={1}>
                  Collecte : {mission.lieuCollecte.adresseFormatee}
                </Text>
              </View>
            ) : null}
            {mission.lieuDepot?.adresseFormatee ? (
              <View style={styles.row}>
                <Truck size={13} color="#94A3B8" />
                <Text style={styles.metaText} numberOfLines={1}>
                  Depot : {mission.lieuDepot.adresseFormatee}
                </Text>
              </View>
            ) : null}
            {mission.benevoleNomComplet ? (
              <View style={styles.row}>
                <User size={13} color="#94A3B8" />
                <Text style={styles.metaText}>{mission.benevoleNomComplet}</Text>
              </View>
            ) : null}
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
  titre: { fontSize: 14, fontWeight: '600', color: '#0F172A', flex: 1, lineHeight: 20 },
  meta: { gap: 5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#64748B', flex: 1 },
});
