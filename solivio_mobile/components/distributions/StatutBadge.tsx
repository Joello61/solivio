import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';
import type { StatutDistribution } from '@/types/distribution';

const STATUT_CONFIG: Record<
  StatutDistribution,
  { label: string; container: string; text: string }
> = {
  BROUILLON: {
    label: 'Brouillon',
    container: 'bg-muted border border-border',
    text: 'text-muted-foreground',
  },
  PUBLIEE: {
    label: 'Publiee',
    container: 'bg-primary-50 border border-primary-100',
    text: 'text-primary-700',
  },
  EN_COURS: {
    label: 'En cours',
    container: 'bg-emerald-50 border border-emerald-200',
    text: 'text-emerald-700',
  },
  TERMINEE: {
    label: 'Terminee',
    container: 'bg-muted border border-border',
    text: 'text-muted-foreground',
  },
  ANNULEE: {
    label: 'Annulee',
    container: 'bg-red-50 border border-red-200',
    text: 'text-destructive',
  },
};

interface StatutBadgeProps {
  statut: StatutDistribution;
}

export function StatutBadge({ statut }: StatutBadgeProps) {
  const config = STATUT_CONFIG[statut];
  return (
    <View className={cn('self-start rounded-md px-2 py-0.5', config.container)}>
      <Text className={cn('text-xs font-medium', config.text)}>{config.label}</Text>
    </View>
  );
}
