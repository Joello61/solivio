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
  Package,
  Recycle,
  Truck,
  PartyPopper,
  Calendar,
  ClipboardList,
  Mail,
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
  iconColor,
  iconBg,
}: {
  label: string;
  icon: React.ElementType;
  onPress: () => void;
  destructive?: boolean;
  iconColor?: string;
  iconBg?: string;
}) {
  const resolvedIconColor = destructive ? '#EF4444' : (iconColor ?? '#64748B');
  const resolvedIconBg = destructive ? '#FEF2F2' : (iconBg ?? '#F1F5F9');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) =>
        pressed ? { backgroundColor: '#F8FAFC', opacity: 0.85 } : null
      }
      className="flex-row items-center gap-3 py-3.5 px-1"
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: resolvedIconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} color={resolvedIconColor} />
      </View>
      <Text
        className={`flex-1 text-base font-medium ${destructive ? 'text-destructive' : 'text-foreground'}`}
      >
        {label}
      </Text>
      {!destructive ? <ChevronRight size={16} color="#CBD5E1" /> : null}
    </Pressable>
  );
}

export default function ProfilScreen() {
  const router = useRouter();
  const { user, logout } = useAuthContext();

  const estGestionnaire = user?.roles.some((r) =>
    ['coordinateur', 'responsable', 'super_admin'].includes(r),
  );
  const estResponsable = user?.roles.some((r) => ['responsable', 'super_admin'].includes(r));
  const estSuperAdmin = user?.roles.includes('super_admin');
  const estBenevole = user?.roles.includes('benevole');
  const estBeneficiaire = user?.roles.includes('beneficiaire');

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
      <AppHeader title="Profil" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6 gap-6"
        showsVerticalScrollIndicator={false}
      >
        {/* En-tete utilisateur */}
        <View className="items-center gap-3">
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#CCFBF1',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              shadowColor: '#0D9488',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ fontSize: 26, fontWeight: '700', color: '#0D9488' }}>
                {initiales}
              </Text>
            )}
          </View>
          <View className="items-center">
            <Text className="text-xl font-bold text-foreground">
              {user?.prenom} {user?.nom}
            </Text>
            <Text className="text-sm text-muted-foreground mt-0.5">{user?.email}</Text>
          </View>
          <View className="flex-row gap-2 flex-wrap justify-center">
            {user?.roles.map((role) => (
              <View key={role} className="bg-teal-50 rounded-full px-3 py-1 border border-teal-100">
                <Text className="text-xs font-semibold text-teal-700 capitalize">{role}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Mon compte */}
        <Card className="py-0 px-3">
          <MenuRow
            label="Mon compte"
            icon={User}
            onPress={() => router.push('/(app)/mon-compte')}
            iconColor="#0D9488"
            iconBg="#CCFBF1"
          />
        </Card>

        {/* Navigation */}
        <View className="gap-2">
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
            Navigation
          </Text>
          <Card className="py-0 px-3">
            <MenuRow
              label="Distributions"
              icon={Calendar}
              onPress={() => router.push('/(app)/(tabs)/distributions' as never)}
              iconColor="#0D9488"
              iconBg="#CCFBF1"
            />
            <View className="border-t border-border" />
            <MenuRow
              label="Reconditionnement"
              icon={Recycle}
              onPress={() => router.push('/(app)/reconditionnement' as never)}
              iconColor="#16A34A"
              iconBg="#DCFCE7"
            />
            <View className="border-t border-border" />
            <MenuRow
              label="Missions collecte"
              icon={Truck}
              onPress={() => router.push('/(app)/missions-collecte' as never)}
              iconColor="#D97706"
              iconBg="#FEF3C7"
            />
            <View className="border-t border-border" />
            <MenuRow
              label="Evenements"
              icon={PartyPopper}
              onPress={() => router.push('/(app)/evenements' as never)}
              iconColor="#EC4899"
              iconBg="#FCE7F3"
            />
            <View className="border-t border-border" />
            <MenuRow
              label="Mes inscriptions"
              icon={ClipboardList}
              onPress={() => router.push('/(app)/(tabs)/inscriptions' as never)}
              iconColor="#6366F1"
              iconBg="#EEF2FF"
            />
            {estBenevole ? (
              <>
                <View className="border-t border-border" />
                <MenuRow
                  label="Mes missions"
                  icon={Truck}
                  onPress={() => router.push('/(app)/mes-missions-collecte' as never)}
                  iconColor="#D97706"
                  iconBg="#FEF3C7"
                />
              </>
            ) : null}
            {estBenevole || estBeneficiaire ? (
              <>
                <View className="border-t border-border" />
                <MenuRow
                  label="Mes evenements"
                  icon={PartyPopper}
                  onPress={() => router.push('/(app)/mes-evenements' as never)}
                  iconColor="#EC4899"
                  iconBg="#FCE7F3"
                />
              </>
            ) : null}
            {estResponsable ? (
              <>
                <View className="border-t border-border" />
                <MenuRow
                  label="Email aux membres"
                  icon={Mail}
                  onPress={() => router.push('/(app)/notifications/email-libre' as never)}
                  iconColor="#64748B"
                  iconBg="#F1F5F9"
                />
              </>
            ) : null}
          </Card>
        </View>

        {/* Association */}
        {estGestionnaire ? (
          <View className="gap-2">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
              Association
            </Text>
            <Card className="py-0 px-3">
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
              {estResponsable ? (
                <>
                  <View className="border-t border-border" />
                  <MenuRow
                    label="Catalogue denrees"
                    icon={Package}
                    onPress={() => router.push('/(app)/association/catalogue-denrees')}
                  />
                </>
              ) : null}
            </Card>
          </View>
        ) : null}

        {/* Administration */}
        {estSuperAdmin ? (
          <View className="gap-2">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
              Administration
            </Text>
            <Card className="py-0 px-3">
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
        ) : null}

        {/* A propos */}
        <Card className="py-0 px-3">
          <MenuRow
            label="A propos"
            icon={Info}
            onPress={() => router.push('/(app)/a-propos')}
          />
        </Card>

        {/* Deconnexion */}
        <Card className="py-0 px-3">
          <MenuRow
            label="Se deconnecter"
            icon={LogOut}
            onPress={confirmerDeconnexion}
            destructive
          />
        </Card>

        <Text className="text-xs text-muted-foreground text-center pb-2">
          Solivio v{version}
        </Text>
      </ScrollView>
    </View>
  );
}
