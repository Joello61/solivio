import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Heart, Shield, Code } from 'lucide-react-native';

const version = Constants.expoConfig?.version ?? '1.0.0';

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3 py-3.5 border-b border-border">
      <View className="w-8 h-8 rounded-lg bg-teal-50 items-center justify-center">
        <Icon size={15} color="#0D9488" strokeWidth={2} />
      </View>
      <Text className="flex-1 text-base text-muted-foreground">{label}</Text>
      <Text className="text-base font-medium text-foreground">{value}</Text>
    </View>
  );
}

export default function AProposScreen() {
  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="A propos" />
      <SafeAreaView edges={['bottom']} className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 py-6 gap-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Identite */}
          <View className="items-center gap-3 py-4">
            <View className="w-20 h-20 rounded-3xl bg-primary items-center justify-center"
              style={{
                shadowColor: '#0D9488',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.28,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Heart size={36} color="#FFFFFF" strokeWidth={1.75} fill="#FFFFFF" />
            </View>
            <View className="items-center gap-1">
              <Text className="text-2xl font-bold text-foreground">Solivio</Text>
              <Text className="text-sm text-muted-foreground">Version {version}</Text>
            </View>
            <Text className="text-sm text-muted-foreground text-center leading-relaxed px-4">
              Plateforme de gestion operationnelle pour les associations de solidarite.
            </Text>
          </View>

          {/* Informations */}
          <View className="bg-card rounded-xl border border-border px-4">
            <InfoRow icon={Code} label="Version" value={version} />
            <InfoRow icon={Shield} label="Licence" value="AGPL v3" />
            <View className="flex-row items-center gap-3 py-3.5">
              <View className="w-8 h-8 rounded-lg bg-teal-50 items-center justify-center">
                <Heart size={15} color="#0D9488" strokeWidth={2} />
              </View>
              <Text className="flex-1 text-base text-muted-foreground">Projet</Text>
              <Text className="text-base font-medium text-foreground">Open source</Text>
            </View>
          </View>

          {/* Mention legale */}
          <Text className="text-xs text-muted-foreground text-center leading-relaxed px-2">
            Solivio est un logiciel libre distribue sous licence AGPL v3.{'\n'}
            Vous etes libre de l'utiliser, le modifier et le redistribuer{'\n'}
            selon les termes de cette licence.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
