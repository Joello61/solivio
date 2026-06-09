import { ScrollView, Text, View, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import { MapPin, Calendar, CalendarX, ClipboardList, ChevronRight } from 'lucide-react-native';
import type { StatutInscription, TypeInscription } from '@/types/distribution';

interface MesInscriptionItem {
  id: string;
  distributionTitre: string;
  distributionDate: string;
  distributionLieu: string | null;
  type: TypeInscription;
  statut: StatutInscription;
  rangListeAttente: number | null;
  presence: string;
}

const STATUT_INSCRIPTION: Record<
  StatutInscription,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }
> = {
  CONFIRMEE: { label: 'Confirmee', variant: 'success' },
  LISTE_ATTENTE: { label: 'Liste d\'attente', variant: 'warning' },
  ANNULEE: { label: 'Annulee', variant: 'destructive' },
};

function InscriptionCard({ item }: { item: MesInscriptionItem }) {
  const statut = STATUT_INSCRIPTION[item.statut];
  return (
    <Card>
      <Text className="text-base font-semibold text-foreground mb-2" numberOfLines={2}>
        {item.distributionTitre}
      </Text>
      <View className="gap-1.5 mb-3">
        <View className="flex-row items-center gap-2">
          <Calendar size={15} color="#6b7280" />
          <Text className="text-base text-muted-foreground">
            {formatDate(item.distributionDate)}
          </Text>
        </View>
        {item.distributionLieu && (
          <View className="flex-row items-center gap-2">
            <MapPin size={15} color="#6b7280" />
            <Text className="text-base text-muted-foreground" numberOfLines={1}>
              {item.distributionLieu}
            </Text>
          </View>
        )}
      </View>
      <View className="flex-row items-center gap-2">
        <Badge variant="outline">
          {item.type === 'BENEFICIAIRE' ? 'Beneficiaire' : 'Benevole'}
        </Badge>
        <Badge variant={statut.variant}>{statut.label}</Badge>
        {item.statut === 'LISTE_ATTENTE' && item.rangListeAttente != null && (
          <Text className="text-xs text-muted-foreground">#{item.rangListeAttente}</Text>
        )}
      </View>
    </Card>
  );
}

function EmptyGlobal() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center px-8 py-16 gap-6">
      <View className="items-center gap-5">
        <View className="w-24 h-24 rounded-3xl bg-primary-50 items-center justify-center">
          <ClipboardList size={40} color="#16513F" strokeWidth={1.5} />
        </View>
        <View className="items-center gap-2">
          <Text className="text-xl font-bold text-foreground text-center">
            Pas encore d'inscription
          </Text>
          <Text className="text-base text-muted-foreground text-center leading-relaxed">
            Inscrivez-vous aux prochaines distributions pour les retrouver ici.
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => router.push('/(app)/(tabs)/distributions')}
        className="flex-row items-center gap-2 bg-primary px-6 py-3.5 rounded-xl active:bg-primary-700"
      >
        <Calendar size={18} color="#fff" />
        <Text className="text-base font-semibold text-white">Voir les distributions</Text>
      </Pressable>
    </View>
  );
}

function EmptySection({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <View className="flex-row items-center gap-3 bg-muted/60 rounded-xl px-4 py-3.5">
      <View className="w-8 h-8 rounded-lg bg-background items-center justify-center">
        <Icon size={16} color="#9ca3af" strokeWidth={1.75} />
      </View>
      <Text className="text-sm text-muted-foreground flex-1">{message}</Text>
    </View>
  );
}

export default function InscriptionsScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['mes-inscriptions'],
    queryFn: () => apiGet<MesInscriptionItem[]>('/api/me/inscriptions'),
  });

  const now = new Date();
  const aVenir = (data ?? []).filter(
    (i) => i.statut !== 'ANNULEE' && new Date(i.distributionDate) >= now,
  );
  const historique = (data ?? []).filter(
    (i) => i.statut === 'ANNULEE' || new Date(i.distributionDate) < now,
  );

  const toutVide = (data ?? []).length === 0;

  if (isLoading) return <Spinner fullScreen />;

  return (
    <View className="flex-1 bg-background">
      <AppHeader title="Mes inscriptions" />

      <ScrollView
        className="flex-1"
        contentContainerClassName={toutVide ? 'flex-1' : 'px-4 py-4 gap-6'}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16513F" />
        }
      >
        {toutVide ? (
          <EmptyGlobal />
        ) : (
          <>
            <View className="gap-3">
              <Text className="text-sm font-semibold text-foreground uppercase tracking-widest text-muted-foreground">
                A venir
              </Text>
              {aVenir.length === 0 ? (
                <EmptySection
                  icon={CalendarX}
                  message="Aucune inscription a venir pour le moment."
                />
              ) : (
                aVenir.map((item) => <InscriptionCard key={item.id} item={item} />)
              )}
            </View>

            <View className="gap-3">
              <Text className="text-sm font-semibold text-foreground uppercase tracking-widest text-muted-foreground">
                Historique
              </Text>
              {historique.length === 0 ? (
                <EmptySection
                  icon={ClipboardList}
                  message="Aucune inscription passee."
                />
              ) : (
                historique.map((item) => <InscriptionCard key={item.id} item={item} />)
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
