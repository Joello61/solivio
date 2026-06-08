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

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-primary">
      {/* Hero - hauteur fixe, fond vert remonte sous la status bar */}
      <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 24, paddingBottom: 32 }}>
        <View className="flex-row items-center gap-3 mb-6">
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: 38, height: 38, borderRadius: 10 }}
          />
          <Text className="text-2xl font-bold tracking-tight text-white">Solivio</Text>
        </View>
        <Text className="text-2xl font-bold text-white leading-tight mb-1">
          La solidarite,{'\n'}organisee simplement.
        </Text>
        <Text className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Inscriptions, distributions, repartition des denrees.
        </Text>
      </View>

      {/* Carte blanche - prend tout l'espace restant, titre fixe + champs defilants */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-background rounded-t-3xl">
          {/* Titre de l'ecran - toujours visible, ne defile pas */}
          <View className="px-6 pt-7 pb-5">
            <Text className="text-2xl font-bold text-foreground">{title}</Text>
            {description && (
              <Text className="text-sm text-muted-foreground mt-1">{description}</Text>
            )}
          </View>

          {/* Seuls les champs du formulaire defilent si necessaire */}
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
