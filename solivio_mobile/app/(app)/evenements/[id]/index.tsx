import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, UserCheck, Users, ClipboardList } from 'lucide-react-native';
import { useAuthContext } from '@/context/AuthContext';
import {
  detailEvenement,
  publierEvenement,
  annulerEvenement,
  sInscrire,
  seDesinscrire,
  mesEvenements,
} from '@/lib/api/evenement';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { StatutBadge } from '@/components/evenement/StatutBadge';
import { Spinner } from '@/components/ui/Spinner';

const LABEL_TYPE: Record<string, string> = {
  STAND: 'Stand',
  FETE: 'Fete',
  AUTRE: 'Evenement',
};

export default function DetailEvenementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: evenement, isLoading } = useQuery({
    queryKey: ['evenement', id],
    queryFn: () => detailEvenement(id),
  });
  const { data: mesParticipations = [] } = useQuery({
    queryKey: ['mes-evenements'],
    queryFn: mesEvenements,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['evenement', id] });
    queryClient.invalidateQueries({ queryKey: ['evenements'] });
    queryClient.invalidateQueries({ queryKey: ['mes-evenements'] });
  };

  const publierMutation = useMutation({
    mutationFn: () => publierEvenement(id),
    onSuccess: refresh,
    onError: (e: Error) => Alert.alert('Erreur', e.message),
  });

  const inscrireMutation = useMutation({
    mutationFn: (role: 'STAFF' | 'PARTICIPANT') => sInscrire(id, role),
    onSuccess: refresh,
    onError: (e: Error) => Alert.alert('Erreur', e.message),
  });

  const desinscrireMutation = useMutation({
    mutationFn: () => seDesinscrire(id),
    onSuccess: refresh,
    onError: (e: Error) => Alert.alert('Erreur', e.message),
  });

  if (isLoading || !evenement) return <Spinner fullScreen />;

  const estGestionnaire = user?.roles.some((r) =>
    ['admin', 'coordinateur', 'responsable', 'super_admin'].includes(r),
  );
  const estBenevole = user?.roles.includes('benevole');
  const estBeneficiaire = user?.roles.includes('beneficiaire');
  const dejaInscrit = mesParticipations.some((p) => p.evenementId === id);

  function demanderAnnulation() {
    Alert.prompt(
      'Annuler l\'evenement',
      'Indiquez la raison de l\'annulation',
      (raison: string | undefined) => {
        if (raison?.trim()) {
          annulerEvenement(id, raison)
            .then(refresh)
            .catch((e: Error) => Alert.alert('Erreur', e.message));
        }
      },
      'plain-text',
    );
  }

  const peutPublier = estGestionnaire && evenement.statut === 'BROUILLON';
  const peutAnnuler =
    estGestionnaire &&
    ['BROUILLON', 'PUBLIE', 'EN_COURS'].includes(evenement.statut);
  const peutInscrireStaff =
    !dejaInscrit &&
    estBenevole &&
    evenement.aBesoiNStaff &&
    ['PUBLIE', 'EN_COURS'].includes(evenement.statut);
  const peutInscrireParticipant =
    !dejaInscrit &&
    (estBenevole || estBeneficiaire) &&
    evenement.ouvertParticipants &&
    ['PUBLIE', 'EN_COURS'].includes(evenement.statut);
  const peutSeDesinscrire =
    dejaInscrit && ['PUBLIE', 'EN_COURS'].includes(evenement.statut);
  const peutPointer =
    estGestionnaire &&
    evenement.modeInscription === 'OBLIGATOIRE' &&
    evenement.statut !== 'BROUILLON';

  return (
    <ScrollView className="flex-1 bg-background">
      <ScreenHeader title={LABEL_TYPE[evenement.type] ?? 'Evenement'} />

      <View className="p-4 gap-4">
        <View className="gap-2">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="text-2xl font-bold text-foreground flex-1">{evenement.titre}</Text>
            <StatutBadge statut={evenement.statut} />
          </View>
          {evenement.description ? (
            <Text className="text-sm text-muted-foreground">{evenement.description}</Text>
          ) : null}
        </View>

        <View className="rounded-2xl border border-border/60 bg-white p-4 gap-3">
          <View className="flex-row items-center gap-3">
            <Calendar size={16} color="#94A3B8" />
            <Text className="text-sm text-foreground">
              {new Date(evenement.dateHeureDebut).toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Clock size={16} color="#94A3B8" />
            <Text className="text-sm text-foreground">
              {new Date(evenement.dateHeureDebut).toLocaleTimeString('fr-FR', {
                hour: '2-digit', minute: '2-digit',
              })}
              {' - '}
              {new Date(evenement.dateHeureFin).toLocaleTimeString('fr-FR', {
                hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
          {evenement.lieuAdresseFormatee ? (
            <View className="flex-row items-center gap-3">
              <MapPin size={16} color="#94A3B8" />
              <Text className="text-sm text-foreground flex-1">{evenement.lieuAdresseFormatee}</Text>
            </View>
          ) : null}
          {evenement.aBesoiNStaff ? (
            <View className="flex-row items-center gap-3">
              <UserCheck size={16} color="#94A3B8" />
              <Text className="text-sm text-foreground">
                Staff : {evenement.nbStaff}
                {evenement.capaciteStaff ? ` / ${evenement.capaciteStaff}` : ''} benevoles
              </Text>
            </View>
          ) : null}
          {evenement.ouvertParticipants ? (
            <View className="flex-row items-center gap-3">
              <Users size={16} color="#94A3B8" />
              <Text className="text-sm text-foreground">
                Participants : {evenement.nbParticipants}
                {evenement.capaciteParticipants ? ` / ${evenement.capaciteParticipants}` : ''}
              </Text>
            </View>
          ) : null}
          <View className="flex-row items-center gap-3">
            <ClipboardList size={16} color="#94A3B8" />
            <Text className="text-sm text-foreground">
              {evenement.modeInscription === 'OBLIGATOIRE'
                ? 'Inscription obligatoire'
                : evenement.modeInscription === 'LIBRE'
                  ? 'Inscription libre'
                  : 'Sans inscription'}
            </Text>
          </View>
          {evenement.raisonAnnulation ? (
            <View className="rounded-xl bg-red-50 border border-red-200 px-3 py-2">
              <Text className="text-sm text-red-700">Raison : {evenement.raisonAnnulation}</Text>
            </View>
          ) : null}
        </View>

        {/* Actions */}
        <View className="gap-3">
          {peutPublier && (
            <Pressable
              onPress={() => publierMutation.mutate()}
              disabled={publierMutation.isPending}
              className="rounded-2xl bg-primary px-4 py-3 items-center disabled:opacity-60"
            >
              <Text className="text-sm font-semibold text-white">
                {publierMutation.isPending ? 'Publication...' : 'Publier'}
              </Text>
            </Pressable>
          )}

          {peutPointer && (
            <Pressable
              onPress={() => router.push(`/(app)/evenements/${id}/pointage` as never)}
              className="rounded-2xl bg-blue-600 px-4 py-3 items-center"
            >
              <Text className="text-sm font-semibold text-white">Pointage</Text>
            </Pressable>
          )}

          {peutInscrireStaff && (
            <Pressable
              onPress={() => inscrireMutation.mutate('STAFF')}
              disabled={inscrireMutation.isPending}
              className="rounded-2xl bg-amber-500 px-4 py-3 items-center disabled:opacity-60"
            >
              <Text className="text-sm font-semibold text-white">
                {inscrireMutation.isPending ? 'Inscription...' : "S'inscrire comme staff"}
              </Text>
            </Pressable>
          )}

          {peutInscrireParticipant && (
            <Pressable
              onPress={() => inscrireMutation.mutate('PARTICIPANT')}
              disabled={inscrireMutation.isPending}
              className="rounded-2xl bg-teal-600 px-4 py-3 items-center disabled:opacity-60"
            >
              <Text className="text-sm font-semibold text-white">
                {inscrireMutation.isPending ? 'Inscription...' : "S'inscrire comme participant"}
              </Text>
            </Pressable>
          )}

          {peutSeDesinscrire && (
            <Pressable
              onPress={() => desinscrireMutation.mutate()}
              disabled={desinscrireMutation.isPending}
              className="rounded-2xl border border-border px-4 py-3 items-center disabled:opacity-60"
            >
              <Text className="text-sm font-semibold text-foreground">
                {desinscrireMutation.isPending ? 'Desinscription...' : 'Se desinscrire'}
              </Text>
            </Pressable>
          )}

          {peutAnnuler && (
            <Pressable
              onPress={demanderAnnulation}
              className="rounded-2xl border border-red-200 px-4 py-3 items-center"
            >
              <Text className="text-sm font-semibold text-red-600">Annuler l'evenement</Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
