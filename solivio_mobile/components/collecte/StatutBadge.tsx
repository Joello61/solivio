import { View, Text, StyleSheet } from 'react-native';
import type { StatutMission } from '@/types/collecte';

interface Config {
  label: string;
  bg: string;
  text: string;
}

const CONFIG: Record<StatutMission, Config> = {
  DISPONIBLE:        { label: 'Disponible',        bg: '#F0FDFA', text: '#0F766E' },
  PRISE_EN_CHARGE:   { label: 'Prise en charge',   bg: '#FFFBEB', text: '#B45309' },
  COLLECTE_EFFECTUEE:{ label: 'Collecte faite',    bg: '#EFF6FF', text: '#1D4ED8' },
  DEPOT_VALIDE:      { label: 'Depot valide',      bg: '#F0FDF4', text: '#15803D' },
  ANNULEE:           { label: 'Annulee',            bg: '#FEF2F2', text: '#DC2626' },
};

interface Props {
  statut: StatutMission;
}

export function StatutBadge({ statut }: Props) {
  const cfg = CONFIG[statut];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontSize: 11, fontWeight: '600' },
});
