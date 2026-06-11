import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress?: () => void;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  textClassName?: string;
}

const CONTAINER: Record<Variant, string> = {
  primary:     'bg-primary active:bg-primary-700',
  secondary:   'bg-primary/10 active:bg-primary/20',
  destructive: 'bg-destructive/10 active:bg-destructive/15',
  ghost:       'bg-transparent active:bg-slate-100',
  outline:     'bg-transparent border border-border active:bg-slate-100',
};

const LABEL: Record<Variant, string> = {
  primary:     'text-white font-semibold',
  secondary:   'text-primary font-semibold',
  destructive: 'text-destructive font-semibold',
  ghost:       'text-foreground font-medium',
  outline:     'text-foreground font-medium',
};

const SIZE_WRAP: Record<Size, string> = {
  sm: 'h-10 px-4 rounded-xl gap-1.5',
  md: 'h-12 px-5 rounded-xl gap-2',
  lg: 'h-14 px-6 rounded-2xl gap-2',
};

const SIZE_TEXT: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-[17px]',
};

const SPINNER_COLOR: Record<Variant, string> = {
  primary:     '#FFFFFF',
  secondary:   '#0D9488',
  destructive: '#EF4444',
  ghost:       '#0F172A',
  outline:     '#0F172A',
};

const PRIMARY_SHADOW = {
  shadowColor: '#0D9488',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.28,
  shadowRadius: 12,
  elevation: 6,
} as const;

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
  textClassName,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center',
        CONTAINER[variant],
        SIZE_WRAP[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50',
        className,
      )}
      style={({ pressed }) => [
        variant === 'primary' && !isDisabled ? PRIMARY_SHADOW : null,
        pressed && !isDisabled ? { opacity: 0.86, transform: [{ scale: 0.975 }] } : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={SPINNER_COLOR[variant]} />
      ) : null}
      {typeof children === 'string' ? (
        <Text className={cn(LABEL[variant], SIZE_TEXT[size], textClassName)}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
