import { useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Plus, Trash2, AlertTriangle } from 'lucide-react-native';
import {
  listerDenrees,
  calculerDotation,
  saisirDenree,
  supprimerDenree,
} from '@/lib/api/distributions';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import type { SaisirDenreePayload, UniteConditionnement } from '@/types/distribution';

const UNITES: UniteConditionnement[] = ['UNITE', 'KILOGRAMME', 'LITRE', 'PIECE'];

function formulaireDenreeVide(): SaisirDenreePayload {
  return { libelle: '', unite: 'UNITE', nombreContenants: 0, quantiteParContenant: 0 };
}

export default function RepartitionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SaisirDenreePayload>(formulaireDenreeVide());

  const {
    data: denrees,
    isLoading: loadingDenrees,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['denrees', id],
    queryFn: () => listerDenrees(id),
    enabled: !!id,
  });

  const { data: dotation, isLoading: loadingDotation } = useQuery({
    queryKey: ['dotation', id],
    queryFn: () => calculerDotation(id),
    enabled: !!id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['denrees', id] });
    queryClient.invalidateQueries({ queryKey: ['dotation', id] });
  };

  const mutSaisir = useMutation({
    mutationFn: () => saisirDenree(id, form),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setForm(formulaireDenreeVide());
    },
  });

  const mutSupprimer = useMutation({
    mutationFn: (denreeId: string) => supprimerDenree(id, denreeId),
    onSuccess: invalidate,
  });

  function confirmerSuppression(denreeId: string, libelle: string) {
    Alert.alert('Supprimer', `Supprimer "${libelle}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => mutSupprimer.mutate(denreeId),
      },
    ]);
  }

  if (loadingDenrees) return <Spinner fullScreen />;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Repartition" showClose />
      <SafeAreaView edges={['bottom']} className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 gap-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16513F" />
        }
      >
        {/* Dotation calculee */}
        {dotation && (
          <Card>
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-foreground">Dotation calculee</Text>
                <Badge variant={dotation.base === 'PRESENTS' ? 'success' : 'default'}>
                  {dotation.base === 'PRESENTS' ? 'Sur presents' : 'Sur inscrits'}
                </Badge>
              </View>
            </CardHeader>
            <CardContent>
              <Text className="text-sm text-muted-foreground">
                Base : {dotation.nbBeneficiaires} beneficiaires
              </Text>
              {dotation.denrees.map((d) => (
                <View key={d.id} className="flex-row items-center justify-between py-2 border-t border-border">
                  <View className="flex-1">
                    <Text className="font-medium text-foreground">{d.libelle}</Text>
                    <Text className="text-xs text-muted-foreground">{d.unite.toLowerCase()}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-semibold text-foreground">
                      {d.dotation.toFixed(2)} / personne
                    </Text>
                    {d.penurie && (
                      <View className="flex-row items-center gap-1">
                        <AlertTriangle size={12} color="#f59e0b" />
                        <Text className="text-xs text-amber-600">
                          Penurie ({d.nbPeutRecevoir} personnes)
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Liste des denrees */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-foreground">Denrees</Text>
            <Pressable
              onPress={() => setShowForm(!showForm)}
              className="flex-row items-center gap-1.5 bg-primary-600 rounded-lg px-3 py-2 active:bg-primary-700"
            >
              <Plus size={14} color="#fff" />
              <Text className="text-sm font-semibold text-white">Ajouter</Text>
            </Pressable>
          </View>

          {/* Formulaire d'ajout */}
          {showForm && (
            <Card>
              <Text className="font-semibold text-foreground mb-3">Nouvelle denree</Text>
              <View className="gap-3">
                <View>
                  <Text className="text-sm font-medium text-foreground mb-1.5">Libelle</Text>
                  <TextInput
                    className="border border-input rounded-lg px-3 py-3 text-base text-foreground"
                    value={form.libelle}
                    onChangeText={(v) => setForm({ ...form, libelle: v })}
                    placeholder="Riz, farine, huile..."
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-foreground mb-1.5">Unite</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {UNITES.map((u) => (
                      <Pressable
                        key={u}
                        onPress={() => setForm({ ...form, unite: u })}
                        className={`px-3 py-1.5 rounded-full border ${
                          form.unite === u
                            ? 'bg-primary-600 border-primary-600'
                            : 'border-border bg-background'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            form.unite === u ? 'text-white' : 'text-foreground'
                          }`}
                        >
                          {u.toLowerCase()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground mb-1.5">Nb contenants</Text>
                    <TextInput
                      className="border border-input rounded-lg px-3 py-3 text-base text-foreground"
                      value={form.nombreContenants ? String(form.nombreContenants) : ''}
                      onChangeText={(v) => setForm({ ...form, nombreContenants: Number(v) || 0 })}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground mb-1.5">Qte / contenant</Text>
                    <TextInput
                      className="border border-input rounded-lg px-3 py-3 text-base text-foreground"
                      value={form.quantiteParContenant ? String(form.quantiteParContenant) : ''}
                      onChangeText={(v) => setForm({ ...form, quantiteParContenant: Number(v) || 0 })}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <Button
                    onPress={() => { setShowForm(false); setForm(formulaireDenreeVide()); }}
                    variant="ghost"
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onPress={() => mutSaisir.mutate()}
                    loading={mutSaisir.isPending}
                    disabled={!form.libelle}
                    className="flex-1"
                  >
                    Ajouter
                  </Button>
                </View>
              </View>
            </Card>
          )}

          {(denrees ?? []).length === 0 ? (
            <Text className="text-sm text-muted-foreground text-center py-4">
              Aucune denree ajoutee.
            </Text>
          ) : (
            (denrees ?? []).map((d) => (
              <Card key={d.id}>
                <View className="flex-row items-center gap-2">
                  <View className="flex-1">
                    <Text className="font-medium text-foreground">{d.libelle}</Text>
                    <Text className="text-sm text-muted-foreground">
                      {d.nombreContenants} x {d.quantiteParContenant} {d.unite.toLowerCase()} = {d.quantiteTotale} total
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => confirmerSuppression(d.id, d.libelle)}
                    className="w-9 h-9 items-center justify-center rounded-lg active:bg-red-50"
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}
