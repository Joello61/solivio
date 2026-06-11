import { ActivityIndicator, View } from 'react-native';
import { cn } from '@/lib/utils';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

export function Spinner({
  size = 'md',
  color = '#0D9488',
  fullScreen = false,
  overlay = false,
  className,
}: SpinnerProps) {
  const rnSize: 'small' | 'large' = size === 'lg' ? 'large' : 'small';

  if (overlay) {
    return (
      <View
        className="absolute inset-0 items-center justify-center z-50"
        style={{ backgroundColor: 'rgba(248,250,252,0.88)' }}
      >
        <ActivityIndicator size="large" color={color} />
      </View>
    );
  }

  if (fullScreen) {
    return (
      <View className={cn('flex-1 items-center justify-center bg-background', className)}>
        <ActivityIndicator size="large" color={color} />
      </View>
    );
  }

  return <ActivityIndicator size={rnSize} color={color} className={className} />;
}
