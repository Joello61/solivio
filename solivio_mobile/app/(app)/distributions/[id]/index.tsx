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
  BarChart2,
  UserPlus,
} from 'lucide-react-native';
import { useAuthContext } from '@/context/AuthContext';
import {
  detailDistribution,
  publierDistribution,
  demarrerDistribution,
  terminerDistribution,
  annulerDistribution,
  inscrire,
  desinscrire,
  listerInscrits,
  mesInscriptions,
} from '@/lib/api/distributions';
import { statsDistribution } from '@/lib/api/association';
import { StatutBadge } from '@/components/distributions/StatutBadge';
import { CarteEmplacement } from '@/components/shared/CarteEmplacement';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
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

  const { data: mesInscr } = useQuery({
    queryKey: ['mes-inscriptions-distribution', id],
    queryFn: () => mesInscriptions(id),
    enabled: !!id,
  });

  const { data: stats } = useQuery({
    queryKey: ['stats-distribution', id],
    queryFn: () => statsDistribution(id),
    enabled: !!id && distribution?.statut === 'TERMINEE' && !!estCoordinateur,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['distribution', id] });
    queryClient.invalidateQueries({ queryKey: ['distributions'] });
    queryClient.invalidateQueries({ queryKey: ['mes-inscriptions-distribution', id] });
    queryClient.invalidateQueries({ queryKey: ['mes-inscriptions'] });
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
    onSuccess: invalidate,
  });
  const mutDesinscrire = useMutation({
    mutationFn: (inscriptionId: string) => desinscrire(id, inscriptionId),
    onSuccess: invalidate,
  });

  function confirmerAction(titre: string, message: string, onConfirm: () => void) {
    Alert.alert(titre, message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: 'destructive', onPress: onConfirm },
    ]);
  }

  function demanderMotifAnnulation() {
    Alert.prompt(
      'Annuler la distribution',
      "Indiquez le motif d'annulation",
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

  const monInscription = mesInscr?.find(
    (i) => i.statut === 'CONFIRMEE' || i.statut === 'LISTE_ATTENTE',
  );
  const dejaInscrit = !!monInscription;
  const peutSInscrire = statut === 'PUBLIEE' && !estCoordinateur && !dejaInscrit;
  const peutSeDesinscrire = statut === 'PUBLIEE' && !estCoordinateur && dejaInscrit;

  const nbBeneficiaires = inscrits?.filter((i) => i.type === 'BENEFICIAIRE').length ?? 0;
  const nbBenevoles = inscrits?.filter((i) => i.type === 'BENEVOLE').length ?? 0;
  const nbInscrits = nbBeneficiaires + nbBenevoles;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Distribution" />
      <SafeAreaView edges={['bottom']} className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 py-4 gap-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0D9488" />
          }
        >
          {/* En-tete */}
          <View className="gap-2">
            <View className="flex-row items-start gap-2">
              <Text className="text-xl font-bold text-foreground flex-1">{distribution.titre}</Text>
              <StatutBadge statut={statut} />
            </View>
            {distribution.motifAnnulation ? (
              <View className="flex-row items-center gap-2 bg-destructive/8 border border-destructive/20 rounded-xl px-3 py-2.5">
                <AlertCircle size={14} color="#DC2626" />
                <Text className="text-sm text-destructive flex-1">{distribution.motifAnnulation}</Text>
              </View>
            ) : null}
          </View>

          {/* Infos */}
          <Card>
            <CardContent>
              <View className="flex-row items-center gap-2">
                <Calendar size={15} color="#94A3B8" />
                <Text className="text-base text-foreground">{formatDate(distribution.date)}</Text>
              </View>
              {distribution.lieu?.adresseFormatee ? (
                <View className="flex-row items-center gap-2">
                  <MapPin size={15} color="#94A3B8" />
                  <Text className="text-base text-foreground">{distribution.lieu.adresseFormatee}</Text>
                </View>
              ) : null}
              {distribution.lieu?.latitude != null && distribution.lieu?.longitude != null ? (
                <CarteEmplacement
                  lieu={{
                    latitude: distribution.lieu.latitude,
                    longitude: distribution.lieu.longitude,
                    adresseFormatee: distribution.lieu.adresseFormatee,
                  }}
                />
              ) : null}
              <View className="flex-row items-center gap-2">
                <Users size={15} color="#94A3B8" />
                <Text className="text-base text-foreground">
                  {distribution.capaciteBeneficiaires} places beneficiaires
                  {distribution.capaciteBenevoles != null
                    ? ` - ${distribution.capaciteBenevoles} places benevoles`
                    : ''}
                </Text>
              </View>
              {distribution.description ? (
                <Text className="text-sm text-muted-foreground mt-1">{distribution.description}</Text>
              ) : null}
            </CardContent>
          </Card>

          {/* Inscrits (coordinateur) */}
          {estCoordinateur && nbInscrits > 0 ? (
            <Card>
              <CardHeader>
                <Text className="font-semibold text-foreground">Inscrits</Text>
              </CardHeader>
              <CardContent>
                <View className="flex-row gap-3">
                  <View className="flex-1 items-center bg-teal-50 rounded-xl py-3 border border-teal-100">
                    <Text className="text-2xl font-bold text-teal-700">{nbBeneficiaires}</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">Beneficiaires</Text>
                  </View>
                  <View className="flex-1 items-center bg-amber-50 rounded-xl py-3 border border-amber-100">
                    <Text className="text-2xl font-bold text-amber-700">{nbBenevoles}</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">Benevoles</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          ) : null}

          {/* Statistiques post-cloture */}
          {statut === 'TERMINEE' && estCoordinateur && stats ? (
            <Card>
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <BarChart2 size={16} color="#0D9488" />
                  <Text className="font-semibold text-foreground">Statistiques</Text>
                </View>
              </CardHeader>
              <CardContent>
                <View className="flex-row gap-3 mb-3">
                  <View className="flex-1 items-center bg-teal-50 rounded-xl py-3 border border-teal-100">
                    <Text className="text-2xl font-bold text-teal-700">
                      {stats.nbPresentsBeneficiaires}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">Presents</Text>
                  </View>
                  <View className="flex-1 items-center bg-red-50 rounded-xl py-3 border border-red-100">
                    <Text className="text-2xl font-bold text-red-500">
                      {stats.nbAbsentsBeneficiaires}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">Absents</Text>
                  </View>
                  <View className="flex-1 items-center bg-amber-50 rounded-xl py-3 border border-amber-100">
                    <Text className="text-2xl font-bold text-amber-600">
                      {stats.nbNonPointes}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">Non pointes</Text>
                  </View>
                </View>
                <View className="bg-primary/8 rounded-xl px-4 py-3 items-center">
                  <Text className="text-3xl font-bold text-primary">
                    {Math.round(stats.tauxPresence)}%
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">Taux de presence</Text>
                </View>
              </CardContent>
            </Card>
          ) : null}

          {/* Outils (coordinateur) */}
          {estCoordinateur ? (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Outils</Text>

              {statut === 'EN_COURS' ? (
                <Pressable
                  onPress={() => router.push(`/(app)/distributions/${id}/pointage` as never)}
                  style={({ pressed }) =>
                    pressed ? { opacity: 0.78, transform: [{ scale: 0.985 }] } : null
                  }
                  className="flex-row items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5"
                >
                  <View className="w-9 h-9 rounded-lg bg-teal-50 items-center justify-center">
                    <ScanLine size={18} color="#0D9488" />
                  </View>
                  <Text className="flex-1 text-base font-medium text-foreground">Pointage</Text>
                  <ChevronRight size={16} color="#CBD5E1" />
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => router.push(`/(app)/distributions/${id}/repartition` as never)}
                style={({ pressed }) =>
                  pressed ? { opacity: 0.78, transform: [{ scale: 0.985 }] } : null
                }
                className="flex-row items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5"
              >
                <View className="w-9 h-9 rounded-lg bg-amber-50 items-center justify-center">
                  <Package size={18} color="#D97706" />
                </View>
                <Text className="flex-1 text-base font-medium text-foreground">Repartition</Text>
                <ChevronRight size={16} color="#CBD5E1" />
              </Pressable>

              <Pressable
                onPress={() => router.push(`/(app)/distributions/${id}/ajout-benevole` as never)}
                style={({ pressed }) =>
                  pressed ? { opacity: 0.78, transform: [{ scale: 0.985 }] } : null
                }
                className="flex-row items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5"
              >
                <View className="w-9 h-9 rounded-lg bg-violet-50 items-center justify-center">
                  <UserPlus size={18} color="#7C3AED" />
                </View>
                <Text className="flex-1 text-base font-medium text-foreground">Ajouter un benevole</Text>
                <ChevronRight size={16} color="#CBD5E1" />
              </Pressable>
            </View>
          ) : null}

          {/* Actions gestionnaire */}
          {estResponsable ? (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Actions</Text>
              {peutPublier ? (
                <Button
                  onPress={() => confirmerAction('Publier', 'Publier cette distribution ?', () => mutPublier.mutate())}
                  loading={mutPublier.isPending}
                  fullWidth
                >
                  Publier
                </Button>
              ) : null}
              {peutDemarrer ? (
                <Button
                  onPress={() => confirmerAction('Demarrer', 'Demarrer cette distribution ?', () => mutDemarrer.mutate())}
                  loading={mutDemarrer.isPending}
                  variant="secondary"
                  fullWidth
                >
                  Demarrer
                </Button>
              ) : null}
              {peutTerminer ? (
                <Button
                  onPress={() => confirmerAction('Terminer', 'Terminer cette distribution ?', () => mutTerminer.mutate())}
                  loading={mutTerminer.isPending}
                  variant="secondary"
                  fullWidth
                >
                  Terminer
                </Button>
              ) : null}
              {peutAnnuler ? (
                <Button
                  onPress={demanderMotifAnnulation}
                  loading={mutAnnuler.isPending}
                  variant="destructive"
                  fullWidth
                >
                  Annuler
                </Button>
              ) : null}
            </View>
          ) : null}

          {/* Inscription beneficiaire */}
          {peutSInscrire ? (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Inscription</Text>
              <Button
                onPress={() =>
                  confirmerAction(
                    "S'inscrire",
                    'Vous inscrire comme beneficiaire ?',
                    () => mutInscrire.mutate('BENEFICIAIRE'),
                  )
                }
                loading={mutInscrire.isPending}
                fullWidth
              >
                {"S'inscrire comme beneficiaire"}
              </Button>
              <Button
                onPress={() =>
                  confirmerAction(
                    "S'inscrire",
                    'Vous inscrire comme benevole ?',
                    () => mutInscrire.mutate('BENEVOLE'),
                  )
                }
                loading={mutInscrire.isPending}
                variant="outline"
                fullWidth
              >
                {"S'inscrire comme benevole"}
              </Button>
            </View>
          ) : null}

          {peutSeDesinscrire && monInscription ? (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Votre inscription</Text>
              <View className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                <Text className="text-teal-800 font-medium">
                  Vous etes inscrit(e) en tant que{' '}
                  {monInscription.type === 'BENEFICIAIRE' ? 'beneficiaire' : 'benevole'}.
                  {monInscription.statut === 'LISTE_ATTENTE' ? " (Liste d'attente)" : ''}
                </Text>
              </View>
              <Button
                onPress={() =>
                  confirmerAction(
                    'Se desinscrire',
                    'Voulez-vous vraiment annuler votre inscription ?',
                    () => mutDesinscrire.mutate(monInscription.id),
                  )
                }
                loading={mutDesinscrire.isPending}
                variant="outline"
                fullWidth
              >
                Se desinscrire
              </Button>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
