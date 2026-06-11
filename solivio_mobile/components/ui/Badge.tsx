import type { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
type Size = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}

const VARIANT: Record<Variant, { bg: string; text: string }> = {
  default:     { bg: 'bg-primary/10',        text: 'text-primary-700' },
  secondary:   { bg: 'bg-slate-100',          text: 'text-slate-600' },
  success:     { bg: 'bg-teal-50',            text: 'text-teal-700' },
  warning:     { bg: 'bg-amber-50',           text: 'text-amber-700' },
  destructive: { bg: 'bg-red-50',             text: 'text-red-600' },
  outline:     { bg: 'border border-border bg-transparent', text: 'text-foreground' },
};

const SIZE: Record<Size, { wrap: string; text: string }> = {
  sm: { wrap: 'px-2 py-0.5',   text: 'text-[11px] leading-4' },
  md: { wrap: 'px-2.5 py-1',   text: 'text-xs leading-4' },
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
}: BadgeProps) {
  const v = VARIANT[variant];
  const s = SIZE[size];
  return (
    <View className={cn('self-start rounded-full', v.bg, s.wrap, className)}>
      <Text className={cn('font-semibold', v.text, s.text)} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}
