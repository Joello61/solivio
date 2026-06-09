import { View } from 'react-native';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <View
      className={cn(
        'bg-card rounded-xl border border-border p-5',
        className,
      )}
      style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <View className={cn('mb-3', className)}>{children}</View>;
}

export function CardContent({ children, className }: CardProps) {
  return <View className={cn('gap-3', className)}>{children}</View>;
}
