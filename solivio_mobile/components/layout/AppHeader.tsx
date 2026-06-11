import type { ReactNode } from 'react';
import { Image, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  right?: ReactNode;
}

const HEADER_SHADOW = {
  shadowColor: '#0D9488',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.22,
  shadowRadius: 10,
  elevation: 6,
} as const;

export function AppHeader({ title, subtitle, showLogo = false, right }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-primary flex-row items-center justify-between px-4"
      style={{ paddingTop: insets.top + 14, paddingBottom: 14, ...HEADER_SHADOW }}
    >
      <View className="flex-row items-center gap-3 flex-1 min-w-0">
        {showLogo ? (
          <View
            className="w-8 h-8 rounded-xl overflow-hidden"
            style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}
          >
            <Image
              source={require('@/assets/images/logo.png')}
              style={{ width: 32, height: 32 }}
              resizeMode="cover"
            />
          </View>
        ) : null}
        <View className="flex-1 min-w-0">
          <Text className="text-xl font-bold text-white" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              className="text-xs mt-0.5"
              style={{ color: 'rgba(255,255,255,0.65)' }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {right ? <View className="ml-3 shrink-0">{right}</View> : null}
    </View>
  );
}
