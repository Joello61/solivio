import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  default: { container: 'bg-primary-100', text: 'text-primary-700' },
  secondary: { container: 'bg-gray-100', text: 'text-gray-700' },
  success: { container: 'bg-green-100', text: 'text-green-700' },
  warning: { container: 'bg-amber-100', text: 'text-amber-700' },
  destructive: { container: 'bg-red-100', text: 'text-red-700' },
  outline: { container: 'border border-border bg-transparent', text: 'text-foreground' },
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <View className={cn('self-start rounded-full px-2.5 py-0.5', styles.container, className)}>
      <Text className={cn('text-xs font-medium', styles.text)}>{children}</Text>
    </View>
  );
}
