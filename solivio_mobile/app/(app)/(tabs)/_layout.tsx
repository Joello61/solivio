import { Tabs } from 'expo-router';
import { LayoutDashboard, CalendarDays, ClipboardList, CircleUser } from 'lucide-react-native';
import { AppTabBar } from '@/components/layout/AppTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AppTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="distributions"
        options={{
          title: 'Distributions',
          tabBarIcon: ({ color, size }) => <CalendarDays size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inscriptions"
        options={{
          title: 'Inscriptions',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Compte',
          tabBarIcon: ({ color, size }) => <CircleUser size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
