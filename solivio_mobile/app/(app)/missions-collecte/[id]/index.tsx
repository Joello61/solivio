import { ScrollView, Text, View, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Truck, User, Users } from 'lucide-react-native';
import { useAuthContext } from '@/context/AuthContext';
import {
  detailMission, prendreEnCharge, libererMission,
  validerCollecte, validerDepot, annulerMission,
} from '@/lib/api/collecte';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { StatutBadge } from '@/components/collecte/StatutBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

export default function DetailMissionCollecteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const estGestionnaire = user?.roles.some((r) =>
    ['admin', 'coordinateur', 'responsable', 'super_admin'].includes(r),
  );
  const estBenevole = user?.roles.includes('benevole') ?? false;
  const meId = user?.id ?? null;

  const { data: mission, isLoading } = useQuery({
    queryKey: ['mission-collecte', id],
    queryFn: () => detailMission(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['mission-collecte', id] });
    queryClient.invalidateQueries({ queryKey: ['missions-collecte'] });
  };

  const prendre = useMutation({ mutationFn: () => prendreEnCharge(id), onSuccess: invalidate });
  const liberer = useMutation({ mutationFn: () => libererMission(id), onSuccess: invalidate });
  const valCollecte = useMutation({ mutationFn: () => validerCollecte(id), onSuccess: invalidate });
  const valDepot = useMutation({ mutationFn: () => validerDepot(id), onSuccess: invalidate });

  function demanderAnnulation() {
    Alert.prompt(
      'Annuler la mission',
      'Veuillez indiquer la raison :',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: (raison: string | undefined) => {
            if (!raison?.trim()) return;
            annulerMission(id, raison)
              .then(invalidate)
              .catch((e: unknown) => {
                const err = e as { detail?: string; message?: string };
                Alert.alert('Erreur', err.detail ?? err.message ?? 'Erreur lors de l\'annulation');
              });
          },
        },
      ],
      'plain-text',
    );
  }

  if (isLoading || !mission) return <Spinner fullScreen />;

  const estAssigne = meId !== null && meId === mission.benevoleId;
  const peutPrendre = estBenevole && mission.statut === 'DISPONIBLE';
  const peutLiberer = estBenevole && estAssigne && mission.statut === 'PRISE_EN_CHARGE';
  const peutValiderCollecte = estGestionnaire && mission.statut === 'PRISE_EN_CHARGE';
  const peutValiderDepot = estBenevole && estAssigne && mission.statut === 'COLLECTE_EFFECTUEE';
  const peutAnnuler = estGestionnaire &&
    ['DISPONIBLE', 'PRISE_EN_CHARGE', 'COLLECTE_EFFECTUEE'].includes(mission.statut);

  const isPending = prendre.isPending || liberer.isPending ||
    valCollecte.isPending || valDepot.isPending;

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <ScreenHeader title="Mission collecte" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>

        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Text style={[styles.titre, { flex: 1 }]}>{mission.titre}</Text>
            <StatutBadge statut={mission.statut} />
          </View>
          {mission.description ? (
            <Text style={styles.description}>{mission.description}</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <InfoRow icon={<Calendar size={15} color="#94A3B8" />}>
            {new Date(mission.dateHeure).toLocaleString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long',
              year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </InfoRow>

          {mission.lieuCollecte?.adresseFormatee ? (
            <InfoRow icon={<MapPin size={15} color="#94A3B8" />}>
              Collecte : {mission.lieuCollecte.adresseFormatee}
            </InfoRow>
          ) : null}

          {mission.lieuDepot?.adresseFormatee ? (
            <InfoRow icon={<Truck size={15} color="#94A3B8" />}>
              Depot : {mission.lieuDepot.adresseFormatee}
            </InfoRow>
          ) : null}

          <InfoRow icon={<Users size={15} color="#94A3B8" />}>
            {mission.capacitePersonnes} benevole{mission.capacitePersonnes > 1 ? 's' : ''} max.
          </InfoRow>

          {mission.benevoleNomComplet ? (
            <InfoRow icon={<User size={15} color="#94A3B8" />}>
              Assigne a : {mission.benevoleNomComplet}
            </InfoRow>
          ) : null}

          {mission.raisonAnnulation ? (
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>Raison : {mission.raisonAnnulation}</Text>
            </View>
          ) : null}
        </View>

        {(mission.datePriseEnCharge || mission.dateCollecteEffectuee || mission.dateDepotValide) ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Historique</Text>
            {mission.datePriseEnCharge ? (
              <Text style={styles.historyItem}>
                Prise en charge : {new Date(mission.datePriseEnCharge).toLocaleString('fr-FR')}
              </Text>
            ) : null}
            {mission.dateCollecteEffectuee ? (
              <Text style={styles.historyItem}>
                Collecte effectuee : {new Date(mission.dateCollecteEffectuee).toLocaleString('fr-FR')}
              </Text>
            ) : null}
            {mission.dateDepotValide ? (
              <Text style={styles.historyItem}>
                Depot valide : {new Date(mission.dateDepotValide).toLocaleString('fr-FR')}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={{ gap: 10 }}>
          {peutPrendre && (
            <Button onPress={() => prendre.mutate()} loading={isPending} fullWidth>
              Prendre en charge
            </Button>
          )}
          {peutLiberer && (
            <Button variant="outline" onPress={() => liberer.mutate()} loading={isPending} fullWidth>
              Se desister
            </Button>
          )}
          {peutValiderCollecte && (
            <Button onPress={() => valCollecte.mutate()} loading={isPending} fullWidth>
              Valider la collecte
            </Button>
          )}
          {peutValiderDepot && (
            <Button onPress={() => valDepot.mutate()} loading={isPending} fullWidth>
              Valider le depot
            </Button>
          )}
          {peutAnnuler && (
            <Button variant="destructive" onPress={demanderAnnulation} loading={isPending} fullWidth>
              Annuler la mission
            </Button>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <View style={{ marginTop: 1 }}>{icon}</View>
      <Text style={{ fontSize: 13, color: '#374151', flex: 1, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1,
    borderColor: '#E2E8F0', padding: 16, gap: 10,
  },
  titre: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  description: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  alertBox: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10 },
  alertText: { fontSize: 13, color: '#DC2626' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#374151' },
  historyItem: { fontSize: 12, color: '#64748B' },
});
