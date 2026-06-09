import { ScrollView, Text, View, Pressable, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import {
  MapPin,
  Calendar,
  Users,
  ScanLine,
  Package,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';
import { useAuthContext } from '@/context/AuthContext';
import {
  detailDistribution,
  publierDistribution,
  demarrerDistribution,
  terminerDistribution,
  annulerDistribution,
  inscrire,
  listerInscrits,
} from '@/lib/api/distributions';
import { StatutBadge } from '@/components/distributions/StatutBadge';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { StatutDistribution } from '@/types/distribution';

export default function DistributionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  const estResponsable = user?.roles.some((r) => ['responsable', 'super_admin'].includes(r));
  const estCoordinateur = user?.roles.some((r) =>
    ['coordinateur', 'responsable', 'super_admin'].includes(r),
  );

  const {
    data: distribution,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['distribution', id],
    queryFn: () => detailDistribution(id),
    enabled: !!id,
  });

  const { data: inscrits } = useQuery({
    queryKey: ['inscrits', id],
    queryFn: () => listerInscrits(id),
    enabled: !!id && !!estCoordinateur,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['distribution', id] });
    queryClient.invalidateQueries({ queryKey: ['distributions'] });
  };

  const mutPublier = useMutation({ mutationFn: () => publierDistribution(id), onSuccess: invalidate });
  const mutDemarrer = useMutation({ mutationFn: () => demarrerDistribution(id), onSuccess: invalidate });
  const mutTerminer = useMutation({ mutationFn: () => terminerDistribution(id), onSuccess: invalidate });
  const mutAnnuler = useMutation({
    mutationFn: (motif: string) => annulerDistribution(id, motif),
    onSuccess: invalidate,
  });
  const mutInscrire = useMutation({
    mutationFn: (type: string) => inscrire(id, type),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['mes-inscriptions'] });
    },
  });

  function confirmerAction(
    titre: string,
    message: string,
    onConfirm: () => void,
  ) {
    Alert.alert(titre, message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: 'destructive', onPress: onConfirm },
    ]);
  }

  function demanderMotifAnnulation() {
    Alert.prompt(
      'Annuler la distribution',
      'Indiquez le motif d\'annulation',
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Annuler la distribution',
          style: 'destructive',
          onPress: (motif: string | undefined) => {
            if (motif) mutAnnuler.mutate(motif);
          },
        },
      ],
      'plain-text',
    );
  }

  if (isLoading) return <Spinner fullScreen />;
  if (!distribution) return null;

  const statut: StatutDistribution = distribution.statut;
  const peutPublier = estResponsable && statut === 'BROUILLON';
  const peutDemarrer = estResponsable && statut === 'PUBLIEE';
  const peutTerminer = estResponsable && statut === 'EN_COURS';
  const peutAnnuler = estResponsable && ['BROUILLON', 'PUBLIEE', 'EN_COURS'].includes(statut);
  const peutSInscrire = statut === 'PUBLIEE' && !estCoordinateur;

  const nbInscrits = inscrits?.length ?? 0;
  const nbBeneficiaires = inscrits?.filter((i) => i.type === 'BENEFICIAIRE').length ?? 0;
  const nbBenevoles = inscrits?.filter((i) => i.type === 'BENEVOLE').length ?? 0;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Distribution" />
      <SafeAreaView edges={['bottom']} className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 gap-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16513F" />
        }
      >
        {/* En-tete */}
        <View className="gap-2">
          <View className="flex-row items-start gap-2">
            <Text className="text-xl font-bold text-foreground flex-1">{distribution.titre}</Text>
            <StatutBadge statut={statut} />
          </View>
          {distribution.motifAnnulation && (
            <View className="flex-row items-center gap-2 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle size={14} color="#ef4444" />
              <Text className="text-sm text-destructive flex-1">{distribution.motifAnnulation}</Text>
            </View>
          )}
        </View>

        {/* Infos */}
        <Card>
          <CardContent>
            <View className="flex-row items-center gap-2">
              <Calendar size={17} color="#6b7280" />
              <Text className="text-base text-foreground">{formatDate(distribution.date)}</Text>
            </View>
            {distribution.lieu && (
              <View className="flex-row items-center gap-2">
                <MapPin size={17} color="#6b7280" />
                <Text className="text-base text-foreground">{distribution.lieu}</Text>
              </View>
            )}
            <View className="flex-row items-center gap-2">
              <Users size={17} color="#6b7280" />
              <Text className="text-base text-foreground">
                {distribution.capaciteBeneficiaires} places beneficiaires
                {distribution.capaciteBenevoles != null &&
                  ` · ${distribution.capaciteBenevoles} places benevoles`}
              </Text>
            </View>
            {distribution.description && (
              <Text className="text-sm text-muted-foreground mt-1">{distribution.description}</Text>
            )}
          </CardContent>
        </Card>

        {/* Inscrits (gestionnaire) */}
        {estCoordinateur && nbInscrits > 0 && (
          <Card>
            <CardHeader>
              <Text className="font-semibold text-foreground">Inscrits</Text>
            </CardHeader>
            <CardContent>
              <View className="flex-row gap-3">
                <View className="flex-1 items-center bg-primary-50 rounded-xl py-3">
                  <Text className="text-2xl font-bold text-primary-600">{nbBeneficiaires}</Text>
                  <Text className="text-xs text-muted-foreground">Beneficiaires</Text>
                </View>
                <View className="flex-1 items-center bg-purple-50 rounded-xl py-3">
                  <Text className="text-2xl font-bold text-purple-600">{nbBenevoles}</Text>
                  <Text className="text-xs text-muted-foreground">Benevoles</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Outils (coordinateur) */}
        {estCoordinateur && (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Outils</Text>

            {statut === 'EN_COURS' && (
              <Pressable
                onPress={() => router.push(`/(app)/distributions/${id}/pointage` as never)}
                className="flex-row items-center gap-3 bg-background border border-border rounded-xl px-4 py-3.5 active:bg-muted"
              >
                <ScanLine size={18} color="#16513F" />
                <Text className="flex-1 text-base font-medium text-foreground">Pointage</Text>
                <ChevronRight size={16} color="#9ca3af" />
              </Pressable>
            )}

            <Pressable
              onPress={() => router.push(`/(app)/distributions/${id}/repartition` as never)}
              className="flex-row items-center gap-3 bg-background border border-border rounded-xl px-4 py-3.5 active:bg-muted"
            >
              <Package size={18} color="#7c3aed" />
              <Text className="flex-1 text-base font-medium text-foreground">Repartition</Text>
              <ChevronRight size={16} color="#9ca3af" />
            </Pressable>
          </View>
        )}

        {/* Actions gestionnaire */}
        {estResponsable && (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Actions</Text>
            {peutPublier && (
              <Button
                onPress={() => confirmerAction('Publier', 'Publier cette distribution ?', () => mutPublier.mutate())}
                loading={mutPublier.isPending}
              >
                Publier
              </Button>
            )}
            {peutDemarrer && (
              <Button
                onPress={() => confirmerAction('Demarrer', 'Demarrer cette distribution ?', () => mutDemarrer.mutate())}
                loading={mutDemarrer.isPending}
                variant="secondary"
              >
                Demarrer
              </Button>
            )}
            {peutTerminer && (
              <Button
                onPress={() => confirmerAction('Terminer', 'Terminer cette distribution ?', () => mutTerminer.mutate())}
                loading={mutTerminer.isPending}
                variant="secondary"
              >
                Terminer
              </Button>
            )}
            {peutAnnuler && (
              <Button
                onPress={demanderMotifAnnulation}
                loading={mutAnnuler.isPending}
                variant="destructive"
              >
                Annuler
              </Button>
            )}
          </View>
        )}

        {/* Inscription beneficiaire */}
        {peutSInscrire && (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Inscription</Text>
            <Button
              onPress={() =>
                confirmerAction(
                  'S\'inscrire',
                  'Vous inscrire comme beneficiaire ?',
                  () => mutInscrire.mutate('BENEFICIAIRE'),
                )
              }
              loading={mutInscrire.isPending}
            >
              S'inscrire comme beneficiaire
            </Button>
            <Button
              onPress={() =>
                confirmerAction(
                  'S\'inscrire',
                  'Vous inscrire comme benevole ?',
                  () => mutInscrire.mutate('BENEVOLE'),
                )
              }
              loading={mutInscrire.isPending}
              variant="outline"
            >
              S'inscrire comme benevole
            </Button>
          </View>
        )}
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}
