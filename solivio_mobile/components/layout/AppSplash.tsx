import { View, Text, Image, ActivityIndicator } from 'react-native';

const LOGO_SHADOW = {
  shadowColor: '#0D9488',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.35,
  shadowRadius: 20,
  elevation: 10,
} as const;

export function AppSplash() {
  return (
    <View className="flex-1 bg-primary items-center justify-center" style={{ overflow: 'hidden' }}>

      {/* Cercles decoratifs */}
      <View
        pointerEvents="none"
        className="absolute rounded-full"
        style={{
          width: 440,
          height: 440,
          top: -170,
          right: -120,
          backgroundColor: 'rgba(255,255,255,0.06)',
        }}
      />
      <View
        pointerEvents="none"
        className="absolute rounded-full"
        style={{
          width: 280,
          height: 280,
          bottom: -90,
          left: -80,
          backgroundColor: 'rgba(255,255,255,0.05)',
        }}
      />
      <View
        pointerEvents="none"
        className="absolute rounded-full"
        style={{
          width: 140,
          height: 140,
          top: '40%',
          right: -50,
          backgroundColor: 'rgba(255,255,255,0.03)',
        }}
      />

      {/* Contenu centré */}
      <View className="items-center gap-8">
        {/* Logo */}
        <View
          className="w-24 h-24 rounded-3xl overflow-hidden"
          style={{
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.20)',
            ...LOGO_SHADOW,
          }}
        >
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: 96, height: 96 }}
            resizeMode="cover"
          />
        </View>

        {/* Identite */}
        <View className="items-center gap-3">
          <Text
            className="text-white text-4xl font-bold"
            style={{ letterSpacing: -0.5 }}
          >
            Solivio
          </Text>
          <View
            className="rounded-full px-4 py-1.5"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            <Text className="text-[11px] font-semibold tracking-widest uppercase"
              style={{ color: 'rgba(255,255,255,0.75)' }}
            >
              Solidarite organisee
            </Text>
          </View>
        </View>
      </View>

      {/* Indicateur de chargement */}
      <View className="absolute bottom-20">
        <ActivityIndicator size="small" color="rgba(255,255,255,0.45)" />
      </View>

    </View>
  );
}
