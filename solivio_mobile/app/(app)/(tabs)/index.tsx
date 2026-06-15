import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Users,
  Heart,
  Calendar,
  Settings,
  UserCog,
  ChevronRight,
  Mail,
  Recycle,
  Truck,
  PartyPopper,
  Package,
} from 'lucide-react-native';
import { useAuthContext } from '@/context/AuthContext';
import { statsPeriode } from '@/lib/api/association';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

function debutFinMoisCourant(): { debut: string; fin: string } {
  const now = new Date();
  const debut = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const dernierJour = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const fin = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(dernierJour).padStart(2, '0')}`;
  return { debut, fin };
}

function StatCard({
  titre,
  valeur,
  description,
  color,
  icon: Icon,
}: {
  titre: string;
  valeur: number;
  description: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="flex-1">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          {titre}
        </Text>
        <View
          className="w-8 h-8 rounded-lg items-center justify-center"
          style={{ backgroundColor: color + '1a' }}
        >
          <Icon size={16} color={color} />
        </View>
      </View>
      <Text className="text-3xl font-bold text-foreground tabular-nums">{valeur}</Text>
      <Text className="text-xs text-muted-foreground mt-0.5">{description}</Text>
    </Card>
  );
}

function AccesRapide({
  label,
  icon: Icon,
  href,
  color = '#0D9488',
}: {
  label: string;
  icon: React.ElementType;
  href: string;
  color?: string;
}) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(href as never)}
      style={({ pressed }) =>
        pressed ? { opacity: 0.78, transform: [{ scale: 0.985 }] } : null
      }
      className="flex-row items-center gap-3 border border-border rounded-xl px-4 py-3.5 bg-card"
    >
      <View
        className="w-9 h-9 rounded-lg items-center justify-center"
        style={{ backgroundColor: color + '1a' }}
      >
        <Icon size={18} color={color} />
      </View>
      <Text className="flex-1 text-base font-medium text-foreground">{label}</Text>
      <ChevronRight size={16} color="#CBD5E1" />
    </Pressable>
  );
}

export default function DashboardScreen() {
  const { user } = useAuthContext();
  const { debut, fin } = debutFinMoisCourant();

  const estGestionnaire = user?.roles.some((r) =>
    ['coordinateur', 'responsable', 'super_admin'].includes(r),
  );
  const estResponsable = user?.roles.some((r) => ['responsable', 'super_admin'].includes(r));
  const estBenevole = user?.roles.includes('benevole');
  const estBeneficiaire = user?.roles.includes('beneficiaire');

  const moisLabel = new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats-periode', debut, fin],
    queryFn: () => statsPeriode(debut, fin),
    enabled: !!estGestionnaire,
  });

  return (
    <View className="flex-1 bg-background">
      <AppHeader title="Accueil" subtitle={user?.tenantActif ?? undefined} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6 gap-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Salutation */}
        <View>
          <Text className="text-2xl font-bold text-foreground">
            Bonjour, {user?.prenom ?? 'utilisateur'}
          </Text>
          <Text className="text-sm text-muted-foreground mt-1">
            Bienvenue sur votre espace association.
          </Text>
        </View>

        {/* Statistiques du mois */}
        {estGestionnaire ? (
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">
              Statistiques{' '}
              <Text className="text-muted-foreground font-normal capitalize">{moisLabel}</Text>
            </Text>
            {statsLoading ? (
              <View className="items-center py-4">
                <Spinner size="sm" />
              </View>
            ) : stats ? (
              <View className="gap-3">
                <View className="flex-row gap-3">
                  <StatCard
                    titre="Distributions"
                    valeur={stats.nbDistributions}
                    description="ce mois-ci"
                    color="#0D9488"
                    icon={BarChart3}
                  />
                  <StatCard
                    titre="Beneficiaires"
                    valeur={stats.nbBeneficiairesDistinctsServis}
                    description="distincts"
                    color="#D97706"
                    icon={Heart}
                  />
                </View>
                <View className="flex-row gap-3">
                  <StatCard
                    titre="Benevoles"
                    valeur={stats.nbBenevolesDistincts}
                    description="distincts"
                    color="#6366F1"
                    icon={Users}
                  />
                  <View className="flex-1" />
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Acces rapide */}
        <View className="gap-3">
          <Text className="text-sm font-semibold text-foreground">Acces rapide</Text>
          <View className="gap-2">
            <AccesRapide
              label="Distributions"
              icon={Calendar}
              href="/(app)/(tabs)/distributions"
              color="#0D9488"
            />
            <AccesRapide
              label="Reconditionnement"
              icon={Recycle}
              href="/(app)/reconditionnement"
              color="#16A34A"
            />
            <AccesRapide
              label="Missions collecte"
              icon={Truck}
              href="/(app)/missions-collecte"
              color="#D97706"
            />
            <AccesRapide
              label="Evenements"
              icon={PartyPopper}
              href="/(app)/evenements"
              color="#EC4899"
            />
            <AccesRapide
              label="Mes inscriptions"
              icon={Users}
              href="/(app)/(tabs)/inscriptions"
              color="#6366F1"
            />
            {estBenevole ? (
              <AccesRapide
                label="Mes missions"
                icon={Truck}
                href="/(app)/mes-missions-collecte"
                color="#D97706"
              />
            ) : null}
            {estBenevole || estBeneficiaire ? (
              <AccesRapide
                label="Mes evenements"
                icon={PartyPopper}
                href="/(app)/mes-evenements"
                color="#EC4899"
              />
            ) : null}
            {estResponsable ? (
              <>
                <AccesRapide
                  label="Configuration"
                  icon={Settings}
                  href="/(app)/association/configuration"
                  color="#64748B"
                />
                <AccesRapide
                  label="Membres"
                  icon={UserCog}
                  href="/(app)/association/membres"
                  color="#64748B"
                />
                <AccesRapide
                  label="Catalogue denrees"
                  icon={Package}
                  href="/(app)/association/catalogue-denrees"
                  color="#F59E0B"
                />
                <AccesRapide
                  label="Email aux membres"
                  icon={Mail}
                  href="/(app)/notifications/email-libre"
                  color="#64748B"
                />
              </>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
