import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { cn } from '@/lib/utils';

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-card border-t border-border"
      style={{ paddingBottom: Math.max(insets.bottom, 4) }}
    >
      <View className="flex-row">
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
              className="flex-1 items-center pt-3 pb-2 gap-1 active:opacity-70"
            >
              {/* Pill indicateur MD3 */}
              <View
                className={cn(
                  'px-5 py-1.5 rounded-full',
                  isFocused ? 'bg-primary/10' : 'bg-transparent',
                )}
              >
                {options.tabBarIcon?.({
                  color: isFocused ? '#16513F' : '#9ca3af',
                  size: 24,
                  focused: isFocused,
                })}
              </View>

              <Text
                className={cn(
                  'text-xs',
                  isFocused
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground font-medium',
                )}
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
