import type { ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showClose?: boolean;
  modal?: boolean;
  right?: ReactNode;
}

const HEADER_SHADOW = {
  shadowColor: '#0D9488',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.22,
  shadowRadius: 10,
  elevation: 6,
} as const;

export function ScreenHeader({ title, subtitle, showClose = false, modal = false, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      className="bg-primary flex-row items-center px-2"
      style={{ paddingTop: modal ? 12 : insets.top + 12, paddingBottom: 12, ...HEADER_SHADOW }}
    >
      <Pressable
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        className="w-10 h-10 items-center justify-center rounded-xl"
        style={({ pressed }) =>
          pressed
            ? { backgroundColor: 'rgba(255,255,255,0.15)', opacity: 0.9, transform: [{ scale: 0.92 }] }
            : null
        }
      >
        {showClose
          ? <X size={20} color="rgba(255,255,255,0.9)" strokeWidth={2} />
          : <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
        }
      </Pressable>

      <View className="flex-1 items-center">
        <Text className="text-base font-bold text-white" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? (
        <View className="w-10 items-end justify-center pr-1">{right}</View>
      ) : (
        <View className="w-10" />
      )}
    </View>
  );
}
