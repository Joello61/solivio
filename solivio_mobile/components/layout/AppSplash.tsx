import { View, Text, Image, ActivityIndicator } from 'react-native';

export function AppSplash() {
  return (
    <View className="flex-1 bg-primary items-center justify-center" style={{ overflow: 'hidden' }}>
      {/* Cercles decoratifs */}
      <View
        pointerEvents="none"
        className="absolute bg-white/5 rounded-full"
        style={{ width: 340, height: 340, top: -110, right: -90 }}
      />
      <View
        pointerEvents="none"
        className="absolute bg-white/5 rounded-full"
        style={{ width: 220, height: 220, bottom: -70, left: -70 }}
      />
      <View
        pointerEvents="none"
        className="absolute bg-white/[0.03] rounded-full"
        style={{ width: 180, height: 180, top: '38%', left: -90 }}
      />

      {/* Logo + nom */}
      <View className="items-center gap-7">
        <View
          className="w-24 h-24 rounded-3xl overflow-hidden"
          style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)' }}
        >
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: 96, height: 96 }}
            resizeMode="cover"
          />
        </View>

        <View className="items-center gap-2.5">
          <Text className="text-white text-4xl font-bold tracking-tight">Solivio</Text>
          <Text className="text-white/55 text-base text-center px-10 leading-relaxed">
            La solidarite, organisee simplement.
          </Text>
        </View>
      </View>

      {/* Indicateur bas */}
      <View className="absolute bottom-16">
        <ActivityIndicator size="small" color="rgba(255,255,255,0.45)" />
      </View>
    </View>
  );
}
