import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';

interface ScreenHeaderProps {
  title: string;
  showClose?: boolean;
}

export function ScreenHeader({ title, showClose = false }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      className="bg-primary flex-row items-center px-2"
      style={{ paddingTop: showClose ? 14 : insets.top + 12, paddingBottom: 14 }}
    >
      <Pressable
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        className="w-10 h-10 items-center justify-center"
      >
        {showClose
          ? <X size={22} color="#FFFFFF" strokeWidth={2.5} />
          : <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
        }
      </Pressable>
      <Text className="flex-1 text-lg font-bold text-white text-center" numberOfLines={1}>
        {title}
      </Text>
      <View className="w-10" />
    </View>
  );
}
