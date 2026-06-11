import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { cn } from '@/lib/utils';

const TAB_SHADOW = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 12,
} as const;

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-card border-t border-slate-200"
      style={{ paddingBottom: Math.max(insets.bottom, 8), ...TAB_SHADOW }}
    >
      <View className="flex-row px-2 pt-2">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options.title ?? route.name);

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={({ pressed }) =>
                pressed && !isFocused ? { opacity: 0.65 } : null
              }
              className="flex-1 items-center pb-1 gap-0.5"
            >
              {/* Pill indicateur Material You */}
              <View
                className={cn(
                  'px-5 py-1.5 rounded-full items-center justify-center min-w-[56px]',
                  isFocused ? 'bg-primary/10' : 'bg-transparent',
                )}
              >
                {options.tabBarIcon?.({
                  color: isFocused ? '#0D9488' : '#94A3B8',
                  size: 22,
                  focused: isFocused,
                })}
              </View>

              <Text
                className={cn(
                  'text-[11px] leading-4',
                  isFocused
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground font-medium',
                )}
                numberOfLines={1}
              >
                {label as string}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
