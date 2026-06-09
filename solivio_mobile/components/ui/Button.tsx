import { ActivityIndicator, Pressable, Text } from 'react-native';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress?: () => void;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-primary active:bg-primary-700 border border-transparent',
    text: 'text-white font-medium',
  },
  secondary: {
    container: 'bg-secondary active:bg-primary-100 border border-transparent',
    text: 'text-primary font-medium',
  },
  destructive: {
    container: 'bg-destructive/10 active:bg-destructive/20 border border-transparent',
    text: 'text-destructive font-medium',
  },
  ghost: {
    container: 'bg-transparent active:bg-muted border border-transparent',
    text: 'text-foreground font-medium',
  },
  outline: {
    container: 'bg-background active:bg-muted border border-border',
    text: 'text-foreground font-medium',
  },
};

const sizeStyles: Record<Size, { container: string; text: string }> = {
  sm: { container: 'px-4 py-2.5 rounded-lg gap-1', text: 'text-sm' },
  md: { container: 'px-4 py-3.5 rounded-xl gap-2', text: 'text-base' },
  lg: { container: 'px-5 py-4 rounded-xl gap-2', text: 'text-base font-semibold' },
};

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  textClassName,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center',
        v.container,
        s.container,
        isDisabled && 'opacity-50',
        className,
      )}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : '#16513F'}
          className="mr-2"
        />
      )}
      {typeof children === 'string' ? (
        <Text className={cn(v.text, s.text, textClassName)}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
