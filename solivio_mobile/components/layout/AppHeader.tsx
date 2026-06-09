import type { ReactNode } from 'react';
import { Image, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppHeaderProps {
  title: string;
  showLogo?: boolean;
  right?: ReactNode;
}

export function AppHeader({ title, showLogo = false, right }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-primary flex-row items-center justify-between px-4"
      style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
    >
      <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
        {showLogo && (
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: 28, height: 28, borderRadius: 7 }}
          />
        )}
        <Text className="text-lg font-bold text-white" numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right && <View className="ml-3">{right}</View>}
    </View>
  );
}
