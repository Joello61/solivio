import { Text, View, StyleSheet } from 'react-native';
import type { StatutEvenement } from '@/types/evenement';

const CONFIG: Record<StatutEvenement, { label: string; bg: string; text: string }> = {
  BROUILLON:  { label: 'Brouillon',  bg: '#F1F5F9', text: '#475569' },
  PUBLIE:     { label: 'Publie',     bg: '#F0FDFA', text: '#0F766E' },
  EN_COURS:   { label: 'En cours',   bg: '#EFF6FF', text: '#1D4ED8' },
  TERMINE:    { label: 'Termine',    bg: '#ECFDF5', text: '#059669' },
  ANNULE:     { label: 'Annule',     bg: '#FEF2F2', text: '#DC2626' },
};

interface Props {
  statut: StatutEvenement;
}

export function StatutBadge({ statut }: Props) {
  const { label, bg, text } = CONFIG[statut] ?? CONFIG.BROUILLON;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  label: { fontSize: 11, fontWeight: '600' },
});
