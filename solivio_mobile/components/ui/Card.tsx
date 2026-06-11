import type { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'elevated' | 'filled' | 'outline';

interface BaseProps {
  children: ReactNode;
  className?: string;
}

interface CardProps extends BaseProps {
  variant?: CardVariant;
}

const CARD_SHADOW = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 3,
} as const;

const ELEVATED_SHADOW = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.09,
  shadowRadius: 24,
  elevation: 8,
} as const;

const VARIANT_CLASS: Record<CardVariant, string> = {
  default:  'bg-card rounded-2xl border border-slate-200',
  elevated: 'bg-card rounded-2xl',
  filled:   'bg-muted rounded-2xl',
  outline:  'bg-transparent rounded-2xl border border-border',
};

const VARIANT_SHADOW: Record<CardVariant, typeof CARD_SHADOW | typeof ELEVATED_SHADOW | null> = {
  default:  CARD_SHADOW,
  elevated: ELEVATED_SHADOW,
  filled:   null,
  outline:  null,
};

export function Card({ children, variant = 'default', className }: CardProps) {
  const shadow = VARIANT_SHADOW[variant];
  return (
    <View
      className={cn(VARIANT_CLASS[variant], 'p-4', className)}
      style={shadow ?? undefined}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, className }: BaseProps) {
  return <View className={cn('mb-4', className)}>{children}</View>;
}

export function CardTitle({ children, className }: BaseProps) {
  return (
    <Text className={cn('text-base font-semibold text-foreground leading-tight', className)}>
      {children}
    </Text>
  );
}

export function CardDescription({ children, className }: BaseProps) {
  return (
    <Text className={cn('text-sm text-muted-foreground mt-1 leading-relaxed', className)}>
      {children}
    </Text>
  );
}

export function CardContent({ children, className }: BaseProps) {
  return <View className={cn('gap-3', className)}>{children}</View>;
}

export function CardFooter({ children, className }: BaseProps) {
  return (
    <View
      className={cn(
        'mt-4 pt-4 border-t border-slate-200 flex-row items-center gap-2',
        className,
      )}
    >
      {children}
    </View>
  );
}
