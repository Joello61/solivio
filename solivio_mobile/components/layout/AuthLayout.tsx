import type { ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const SHEET_SHADOW = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.10,
  shadowRadius: 20,
  elevation: 14,
} as const;

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-primary" style={{ overflow: 'hidden' }}>

      {/* Cercles decoratifs du hero */}
      <View
        pointerEvents="none"
        className="absolute rounded-full"
        style={{
          width: 380,
          height: 380,
          top: -150,
          right: -100,
          backgroundColor: 'rgba(255,255,255,0.06)',
        }}
      />
      <View
        pointerEvents="none"
        className="absolute rounded-full"
        style={{
          width: 160,
          height: 160,
          top: '10%',
          left: -70,
          backgroundColor: 'rgba(255,255,255,0.04)',
        }}
      />

      {/* Section hero */}
      <View
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
          paddingBottom: 36,
        }}
      >
        <View className="flex-row items-center gap-3 mb-8">
          <View
            className="w-10 h-10 rounded-xl overflow-hidden"
            style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' }}
          >
            <Image
              source={require('@/assets/images/logo.png')}
              style={{ width: 40, height: 40 }}
              resizeMode="cover"
            />
          </View>
          <Text className="text-xl font-bold text-white">Solivio</Text>
        </View>

        <Text
          className="text-3xl font-extrabold text-white leading-tight"
          style={{ letterSpacing: -0.5 }}
        >
          La solidarite,{'\n'}organisee simplement.
        </Text>
        <Text
          className="text-sm mt-2.5 leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.60)' }}
        >
          Inscriptions, distributions, repartition des denrees.
        </Text>
      </View>

      {/* Feuille blanche remontante */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-background rounded-t-3xl" style={SHEET_SHADOW}>

          {/* Drag indicator */}
          <View className="items-center pt-3 pb-1">
            <View className="w-9 h-1 rounded-full bg-slate-200" />
          </View>

          {/* Titre de l'ecran - ne defile pas */}
          <View className="px-6 pt-5 pb-5">
            <Text className="text-2xl font-bold text-foreground">{title}</Text>
            {description ? (
              <Text className="text-sm text-muted-foreground mt-1">{description}</Text>
            ) : null}
          </View>

          {/* Formulaire defilant */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: Math.max(insets.bottom + 16, 32),
              gap: 16,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
