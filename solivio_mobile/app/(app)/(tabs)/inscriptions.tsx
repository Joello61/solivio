import { ScrollView, Text, View, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import { MapPin, Calendar, CalendarX, ClipboardList, Recycle, Truck, PartyPopper } from 'lucide-react-native';
import type { ParticipationEvenementResponse } from '@/types/evenement';
import type { MissionCollecteResponse } from '@/types/collecte';
import type { InscriptionReconditionnementResponse } from '@/types/reconditionnement';

type UnifiedType = 'DISTRIBUTION' | 'EVENEMENT' | 'COLLECTE' | 'RECONDITIONNEMENT';

interface UnifiedInscription {
  id: string;
  type: UnifiedType;
  titre: string;
  date: string;
  lieu: string | null;
  statut: string;
  role: string;
  originalId: string;
}

const STATUT_VARIANTS: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  CONFIRMEE: 'success',
  LISTE_ATTENTE: 'warning',
  ANNULEE: 'destructive',
  PUBLIE: 'success',
  EN_COURS: 'success',
  PRISE_EN_CHARGE: 'warning',
  COLLECTE_EFFECTUEE: 'warning',
  DEPOT_VALIDE: 'success',
  PRESENT: 'success',
  ABSENT: 'destructive',
  NON_POINTE: 'secondary',
};

function InscriptionCard({ item }: { item: UnifiedInscription }) {
  const router = useRouter();
  const variant = STATUT_VARIANTS[item.statut] ?? 'secondary';
  
  const handlePress = () => {
    switch (item.type) {
      case 'DISTRIBUTION':
        router.push(`/(app)/distributions/${item.originalId}` as never);
        break;
      case 'EVENEMENT':
        router.push(`/(app)/evenements/${item.originalId}` as never);
        break;
      case 'COLLECTE':
        router.push(`/(app)/missions-collecte/${item.originalId}` as never);
        break;
      case 'RECONDITIONNEMENT':
        router.push(`/(app)/reconditionnement/${item.originalId}` as never);
        break;
    }
  };

  const Icon = item.type === 'RECONDITIONNEMENT' ? Recycle :
               item.type === 'COLLECTE' ? Truck :
               item.type === 'EVENEMENT' ? PartyPopper : ClipboardList;

  return (
    <Pressable onPress={handlePress}>
      <Card>
        <View className="flex-row items-center gap-2 mb-2">
          <Icon size={16} color="#0D9488" />
          <Text className="text-base font-semibold text-foreground flex-1" numberOfLines={2}>
            {item.titre}
          </Text>
        </View>
        <View className="gap-1.5 mb-3">
          <View className="flex-row items-center gap-2">
            <Calendar size={14} color="#94A3B8" />
            <Text className="text-sm text-muted-foreground">
              {formatDate(item.date)}
            </Text>
          </View>
          {item.lieu ? (
            <View className="flex-row items-center gap-2">
              <MapPin size={14} color="#94A3B8" />
              <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                {item.lieu}
              </Text>
            </View>
          ) : null}
        </View>
        <View className="flex-row items-center gap-2 flex-wrap">
          <Badge variant="outline">{item.role}</Badge>
          <Badge variant={variant}>{item.statut.replace('_', ' ')}</Badge>
        </View>
      </Card>
    </Pressable>
  );
}

function EmptyGlobal() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center px-8 py-16 gap-6">
      <View className="items-center gap-5">
        <View className="w-24 h-24 rounded-3xl bg-primary/10 items-center justify-center">
          <ClipboardList size={40} color="#0D9488" strokeWidth={1.5} />
        </View>
        <View className="items-center gap-2">
          <Text className="text-xl font-bold text-foreground text-center">
            {"Pas encore d'inscription"}
          </Text>
          <Text className="text-base text-muted-foreground text-center leading-relaxed">
            Inscrivez-vous aux prochaines activites pour les retrouver ici.
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => router.push('/(app)/(tabs)/distributions')}
        style={({ pressed }) =>
          pressed ? { opacity: 0.86, transform: [{ scale: 0.97 }] } : null
        }
        className="flex-row items-center gap-2 bg-primary px-6 py-3.5 rounded-xl"
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
        <Icon size={16} color="#94A3B8" strokeWidth={1.75} />
      </View>
      <Text className="text-sm text-muted-foreground flex-1">{message}</Text>
    </View>
  );
}

export default function InscriptionsScreen() {
  const { data: distributions = [], refetch: refetchD, isRefetching: isRefetchingD, isLoading: isLoadingD } = useQuery({
    queryKey: ['mes-inscriptions-dist'],
    queryFn: () => apiGet<any[]>('/api/inscriptions/mes'),
  });

  const { data: evenements = [], refetch: refetchE, isRefetching: isRefetchingE, isLoading: isLoadingE } = useQuery({
    queryKey: ['mes-evenements'],
    queryFn: () => apiGet<ParticipationEvenementResponse[]>('/api/evenements/mes-evenements'),
  });

  const { data: collectes = [], refetch: refetchC, isRefetching: isRefetchingC, isLoading: isLoadingC } = useQuery({
    queryKey: ['mes-missions-collecte'],
    queryFn: () => apiGet<MissionCollecteResponse[]>('/api/missions-collecte/mes-missions'),
  });

  const { data: reco = [], refetch: refetchR, isRefetching: isRefetchingR, isLoading: isLoadingR } = useQuery({
    queryKey: ['mes-inscriptions-reco'],
    queryFn: () => apiGet<InscriptionReconditionnementResponse[]>('/api/sessions-reconditionnement/mes-inscriptions'),
  });

  const onRefresh = () => {
    refetchD();
    refetchE();
    refetchC();
    refetchR();
  };

  const isRefetching = isRefetchingD || isRefetchingE || isRefetchingC || isRefetchingR;
  const isInitialLoading = isLoadingD || isLoadingE || isLoadingC || isLoadingR;

  const unified: UnifiedInscription[] = [
    ...distributions.map(d => ({
      id: `dist-${d.id}`,
      type: 'DISTRIBUTION' as UnifiedType,
      titre: d.distributionTitre || 'Distribution',
      date: d.distributionDate,
      lieu: d.distributionLieu,
      statut: d.statut,
      role: d.type === 'BENEFICIAIRE' ? 'Beneficiaire' : 'Benevole',
      originalId: d.distributionId
    })),
    ...evenements.map(e => ({
      id: `ev-${e.id}`,
      type: 'EVENEMENT' as UnifiedType,
      titre: e.evenementTitre || 'Evenement',
      date: e.evenementDate || e.dateInscription,
      lieu: e.evenementLieu || null,
      statut: e.presence || 'CONFIRMEE',
      role: e.role === 'STAFF' ? 'Staff' : 'Participant',
      originalId: e.evenementId
    })),
    ...collectes.map(c => ({
      id: `coll-${c.id}`,
      type: 'COLLECTE' as UnifiedType,
      titre: c.titre,
      date: c.dateHeure,
      lieu: c.lieuCollecte?.adresseFormatee || null,
      statut: c.statut,
      role: 'Benevole',
      originalId: c.id
    })),
    ...reco.map(r => ({
      id: `reco-${r.id}`,
      type: 'RECONDITIONNEMENT' as UnifiedType,
      titre: r.sessionTitre || 'Reconditionnement',
      date: r.sessionDate || r.dateInscription,
      lieu: r.sessionLieu || null,
      statut: r.presence || r.statut,
      role: 'Benevole',
      originalId: r.sessionId
    }))
  ];

  unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const todayStr = new Date().toISOString().split('T')[0];
  const aVenir = unified.filter(
    (i) => i.statut !== 'ANNULEE' && i.date.split('T')[0] >= todayStr,
  );
  const historique = unified.filter(
    (i) => i.statut === 'ANNULEE' || i.date.split('T')[0] < todayStr,
  );

  const toutVide = unified.length === 0;

  if (isInitialLoading && toutVide) return <Spinner fullScreen />;

  return (
    <View className="flex-1 bg-background">
      <AppHeader title="Mes inscriptions" />

      <ScrollView
        className="flex-1"
        contentContainerClassName={toutVide ? 'flex-1' : 'px-4 py-4 gap-6'}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#0D9488" />
        }
      >
        {toutVide ? (
          <EmptyGlobal />
        ) : (
          <>
            <View className="gap-3">
              <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
              <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Historique
              </Text>
              {historique.length === 0 ? (
                <EmptySection icon={ClipboardList} message="Aucune inscription passee." />
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
