import { ScrollView, Text, View, Pressable, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { AppHeader } from '@/components/layout/AppHeader';
import {
  User,
  ChevronRight,
  LogOut,
  Settings,
  Users,
  UserCog,
  Building2,
  Info,
} from 'lucide-react-native';
import { useAuthContext } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { buildImageUrl } from '@/lib/api';

const version = Constants.expoConfig?.version ?? '1.0.0';

function MenuRow({
  label,
  icon: Icon,
  onPress,
  destructive = false,
}: {
  label: string;
  icon: React.ElementType;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 py-4 active:bg-muted px-1"
    >
      <Icon size={20} color={destructive ? '#ef4444' : '#6b7280'} />
      <Text
        className={`flex-1 text-base font-medium ${destructive ? 'text-destructive' : 'text-foreground'}`}
      >
        {label}
      </Text>
      {!destructive && <ChevronRight size={18} color="#9ca3af" />}
    </Pressable>
  );
}

export default function ProfilScreen() {
  const router = useRouter();
  const { user, logout } = useAuthContext();

  const estGestionnaire = user?.roles.some((r) =>
    ['coordinateur', 'responsable', 'super_admin'].includes(r),
  );
  const estSuperAdmin = user?.roles.includes('super_admin');

  const initiales =
    user ? `${user.prenom[0] ?? ''}${user.nom[0] ?? ''}`.toUpperCase() : '??';
  const avatarUri = buildImageUrl(user?.photoUrl);

  function confirmerDeconnexion() {
    Alert.alert('Deconnexion', 'Voulez-vous vraiment vous deconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Deconnecter',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-background">
      <AppHeader title="Compte" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6 gap-6"
        showsVerticalScrollIndicator={false}
      >
        {/* En-tete */}
        <View className="items-center gap-3">
          <View className="w-20 h-20 rounded-full bg-primary-100 items-center justify-center overflow-hidden">
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
                resizeMode="cover"
              />
            ) : (
              <Text className="text-2xl font-bold text-primary-600">{initiales}</Text>
            )}
          </View>
          <View className="items-center">
            <Text className="text-xl font-semibold text-foreground">
              {user?.prenom} {user?.nom}
            </Text>
            <Text className="text-sm text-muted-foreground">{user?.email}</Text>
          </View>
          {user?.roles.map((role) => (
            <View key={role} className="bg-primary-50 rounded-full px-3 py-1">
              <Text className="text-xs font-medium text-primary-700">{role}</Text>
            </View>
          ))}
        </View>

        {/* Mon compte */}
        <Card className="py-0">
          <MenuRow
            label="Mon compte"
            icon={User}
            onPress={() => router.push('/(app)/mon-compte')}
          />
        </Card>

        {/* Association */}
        {estGestionnaire && (
          <View className="gap-2">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
              Association
            </Text>
            <Card className="py-0">
              <MenuRow
                label="Configuration"
                icon={Settings}
                onPress={() => router.push('/(app)/association/configuration')}
              />
              <View className="border-t border-border" />
              <MenuRow
                label="Membres"
                icon={Users}
                onPress={() => router.push('/(app)/association/membres')}
              />
            </Card>
          </View>
        )}

        {/* Administration */}
        {estSuperAdmin && (
          <View className="gap-2">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
              Administration
            </Text>
            <Card className="py-0">
              <MenuRow
                label="Utilisateurs"
                icon={UserCog}
                onPress={() => router.push('/(app)/admin/utilisateurs' as never)}
              />
              <View className="border-t border-border" />
              <MenuRow
                label="Associations"
                icon={Building2}
                onPress={() => router.push('/(app)/admin/associations' as never)}
              />
            </Card>
          </View>
        )}

        {/* A propos */}
        <Card className="py-0">
          <MenuRow
            label="A propos"
            icon={Info}
            onPress={() => router.push('/(app)/a-propos')}
          />
        </Card>

        {/* Deconnexion */}
        <Card className="py-0">
          <MenuRow
            label="Se deconnecter"
            icon={LogOut}
            onPress={confirmerDeconnexion}
            destructive
          />
        </Card>

        {/* Version */}
        <Text className="text-xs text-muted-foreground text-center pb-2">
          Solivio v{version}
        </Text>
      </ScrollView>
    </View>
  );
}
