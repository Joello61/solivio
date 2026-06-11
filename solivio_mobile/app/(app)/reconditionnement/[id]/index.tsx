import { ScrollView, Text, View, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, MapPin, Users, AlertCircle, ScanLine } from 'lucide-react-native';
import { useAuthContext } from '@/context/AuthContext';
import {
  detailSession,
  publierSession,
  demarrerSession,
  terminerSession,
  annulerSession,
  inscrireSession,
  desinscrireSession,
  listerInscrits,
  pointerParticipant,
} from '@/lib/api/reconditionnement';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { StatutBadge } from '@/components/reconditionnement/StatutBadge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  const estResponsable = user?.roles.some((r) => ['responsable', 'super_admin'].includes(r));
  const estCoordinateur = user?.roles.some((r) =>
    ['coordinateur', 'responsable', 'super_admin'].includes(r),
  );

  const {
    data: session,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['session-reco', id],
    queryFn: () => detailSession(id),
    enabled: !!id,
  });

  const { data: inscrits } = useQuery({
    queryKey: ['inscrits-reco', id],
    queryFn: () => listerInscrits(id),
    enabled: !!id && !!estCoordinateur,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['session-reco', id] });
    queryClient.invalidateQueries({ queryKey: ['sessions-reco'] });
    queryClient.invalidateQueries({ queryKey: ['inscrits-reco', id] });
  };

  const mutPublier = useMutation({ mutationFn: () => publierSession(id), onSuccess: invalidate });
  const mutDemarrer = useMutation({ mutationFn: () => demarrerSession(id), onSuccess: invalidate });
  const mutTerminer = useMutation({ mutationFn: () => terminerSession(id), onSuccess: invalidate });
  const mutAnnuler = useMutation({
    mutationFn: (motif: string) => annulerSession(id, motif),
    onSuccess: invalidate,
  });
  const mutInscrire = useMutation({ mutationFn: () => inscrireSession(id), onSuccess: invalidate });
  const mutDesinscrire = useMutation({
    mutationFn: () => desinscrireSession(id),
    onSuccess: invalidate,
  });
  const mutPointer = useMutation({
    mutationFn: ({ personneId, presence }: { personneId: string; presence: string }) =>
      pointerParticipant(id, personneId, presence),
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
      'Annuler la session',
      "Indiquez le motif d'annulation",
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Annuler la session',
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
  if (!session) return null;

  const statut = session.statut;
  const peutPublier = estResponsable && statut === 'BROUILLON';
  const peutDemarrer = estResponsable && statut === 'PUBLIEE';
  const peutTerminer = estResponsable && statut === 'EN_COURS';
  const peutAnnuler = estResponsable && ['BROUILLON', 'PUBLIEE', 'EN_COURS'].includes(statut);
  const peutSInscrire = statut === 'PUBLIEE' && !estCoordinateur;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Reconditionnement" />
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
          <View className="flex-row items-start gap-2">
            <Text className="text-xl font-bold text-foreground flex-1">{session.titre}</Text>
            <StatutBadge statut={statut} />
          </View>

          {session.motifAnnulation ? (
            <View className="flex-row items-center gap-2 bg-destructive/8 border border-destructive/20 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} color="#DC2626" />
              <Text className="text-sm text-destructive flex-1">{session.motifAnnulation}</Text>
            </View>
          ) : null}

          {/* Infos */}
          <Card>
            <CardContent>
              <View className="flex-row items-center gap-2">
                <Calendar size={15} color="#94A3B8" />
                <Text className="text-base text-foreground">
                  Debut : {formatDateTime(session.dateHeureDebut)}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Clock size={15} color="#94A3B8" />
                <Text className="text-base text-foreground">
                  Fin : {formatDateTime(session.dateHeureFin)}
                </Text>
              </View>
              {session.lieu?.adresseFormatee ? (
                <View className="flex-row items-center gap-2">
                  <MapPin size={15} color="#94A3B8" />
                  <Text className="text-base text-foreground">{session.lieu.adresseFormatee}</Text>
                </View>
              ) : null}
              <View className="flex-row items-center gap-2">
                <Users size={15} color="#94A3B8" />
                <Text className="text-base text-foreground">
                  {session.nbInscrits} inscrit{session.nbInscrits !== 1 ? 's' : ''}
                  {session.capacite != null ? ` / ${session.capacite} places` : ''}
                </Text>
              </View>
              {session.description ? (
                <Text className="text-sm text-muted-foreground mt-1">{session.description}</Text>
              ) : null}
            </CardContent>
          </Card>

          {/* Inscrits + Pointage */}
          {estCoordinateur && inscrits && inscrits.length > 0 ? (
            <Card>
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <ScanLine size={16} color="#0D9488" />
                  <Text className="font-semibold text-foreground">
                    Inscrits ({inscrits.length})
                  </Text>
                </View>
              </CardHeader>
              <CardContent>
                {inscrits.map((inscrit) => (
                  <View
                    key={inscrit.id}
                    className="flex-row items-center justify-between py-2 border-b border-border/30 last:border-0"
                  >
                    <View>
                      <Text className="text-sm font-medium text-foreground">{inscrit.nomComplet}</Text>
                      <Text className="text-xs text-muted-foreground">{inscrit.presence}</Text>
                    </View>
                    {(statut === 'EN_COURS' || statut === 'TERMINEE') ? (
                      <View className="flex-row gap-2">
                        <Button
                          size="sm"
                          variant={inscrit.presence === 'PRESENT' ? 'primary' : 'outline'}
                          onPress={() =>
                            mutPointer.mutate({
                              personneId: inscrit.personneId,
                              presence: 'PRESENT',
                            })
                          }
                          loading={mutPointer.isPending}
                        >
                          P
                        </Button>
                        <Button
                          size="sm"
                          variant={inscrit.presence === 'ABSENT' ? 'destructive' : 'outline'}
                          onPress={() =>
                            mutPointer.mutate({
                              personneId: inscrit.personneId,
                              presence: 'ABSENT',
                            })
                          }
                          loading={mutPointer.isPending}
                        >
                          A
                        </Button>
                      </View>
                    ) : null}
                  </View>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {/* Actions responsable */}
          {estResponsable ? (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Actions</Text>
              {peutPublier ? (
                <Button
                  onPress={() =>
                    confirmerAction('Publier', 'Publier cette session ?', () => mutPublier.mutate())
                  }
                  loading={mutPublier.isPending}
                  fullWidth
                >
                  Publier
                </Button>
              ) : null}
              {peutDemarrer ? (
                <Button
                  onPress={() =>
                    confirmerAction('Demarrer', 'Demarrer cette session ?', () =>
                      mutDemarrer.mutate(),
                    )
                  }
                  loading={mutDemarrer.isPending}
                  variant="secondary"
                  fullWidth
                >
                  Demarrer
                </Button>
              ) : null}
              {peutTerminer ? (
                <Button
                  onPress={() =>
                    confirmerAction('Terminer', 'Terminer cette session ?', () =>
                      mutTerminer.mutate(),
                    )
                  }
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

          {/* Inscription benevole */}
          {peutSInscrire ? (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Inscription</Text>
              <Button
                onPress={() =>
                  confirmerAction("S'inscrire", 'Vous inscrire a cette session ?', () =>
                    mutInscrire.mutate(),
                  )
                }
                loading={mutInscrire.isPending}
                fullWidth
              >
                S'inscrire
              </Button>
              <Button
                onPress={() =>
                  confirmerAction('Se desinscrire', 'Annuler votre inscription ?', () =>
                    mutDesinscrire.mutate(),
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
