import { useState } from 'react';
import {
  FlatList,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Check, X } from 'lucide-react-native';
import {
  listerCatalogueDenrees,
  creerCatalogueDenree,
  modifierCatalogueDenree,
  supprimerCatalogueDenree,
} from '@/lib/api/distributions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { CatalogueDenreeResponse } from '@/types/distribution';

function DenreeItem({ denree }: { denree: CatalogueDenreeResponse }) {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [editLibelle, setEditLibelle] = useState(denree.libelle);

  const mutModifier = useMutation({
    mutationFn: (libelle: string) => modifierCatalogueDenree(denree.id, libelle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogue-denrees'] });
      setEditMode(false);
    },
  });

  const mutSupprimer = useMutation({
    mutationFn: () => supprimerCatalogueDenree(denree.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalogue-denrees'] }),
  });

  function confirmerSuppression() {
    Alert.alert(
      'Supprimer',
      `Supprimer "${denree.libelle}" du catalogue ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => mutSupprimer.mutate(),
        },
      ],
    );
  }

  function ouvrirEdition() {
    setEditLibelle(denree.libelle);
    setEditMode(true);
  }

  function annulerEdition() {
    setEditLibelle(denree.libelle);
    setEditMode(false);
  }

  function validerEdition() {
    if (!editLibelle.trim()) return;
    mutModifier.mutate(editLibelle.trim());
  }

  return (
    <Card>
      <View className="flex-row items-center gap-2">
        {editMode ? (
          <>
            <TextInput
              value={editLibelle}
              onChangeText={setEditLibelle}
              className="flex-1 border border-input rounded-lg px-3 py-2 text-sm text-foreground"
              autoFocus
              onSubmitEditing={validerEdition}
            />
            <Pressable
              onPress={validerEdition}
              disabled={mutModifier.isPending || !editLibelle.trim()}
              className="w-9 h-9 items-center justify-center rounded-lg active:bg-muted"
            >
              <Check size={16} color="#16513F" />
            </Pressable>
            <Pressable
              onPress={annulerEdition}
              className="w-9 h-9 items-center justify-center rounded-lg active:bg-muted"
            >
              <X size={16} color="#6b7280" />
            </Pressable>
          </>
        ) : (
          <>
            <Text className="flex-1 text-sm text-foreground">{denree.libelle}</Text>
            <Pressable
              onPress={ouvrirEdition}
              disabled={mutSupprimer.isPending}
              className="w-9 h-9 items-center justify-center rounded-lg active:bg-muted"
            >
              <Pencil size={16} color="#6b7280" />
            </Pressable>
            <Pressable
              onPress={confirmerSuppression}
              disabled={mutSupprimer.isPending}
              className="w-9 h-9 items-center justify-center rounded-lg active:bg-red-50"
            >
              <Trash2 size={16} color="#ef4444" />
            </Pressable>
          </>
        )}
      </View>
    </Card>
  );
}

export default function CatalogueDenreesScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [nouveauLibelle, setNouveauLibelle] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['catalogue-denrees'],
    queryFn: listerCatalogueDenrees,
  });

  const mutCreer = useMutation({
    mutationFn: (libelle: string) => creerCatalogueDenree(libelle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogue-denrees'] });
      setNouveauLibelle('');
      setShowForm(false);
    },
  });

  function handleCreer() {
    if (!nouveauLibelle.trim()) return;
    mutCreer.mutate(nouveauLibelle.trim());
  }

  if (isLoading) return <Spinner fullScreen />;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Catalogue des denrees" />
      <SafeAreaView edges={['bottom']} className="flex-1">
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DenreeItem denree={item} />}
          contentContainerClassName="px-4 py-4 gap-3"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16513F" />
          }
          ListHeaderComponent={
            <View className="gap-3 mb-3">
              {showForm ? (
                <Card>
                  <Text className="font-semibold text-foreground mb-3">Nouvelle denree</Text>
                  <TextInput
                    value={nouveauLibelle}
                    onChangeText={setNouveauLibelle}
                    placeholder="Ex : Pommes de terre"
                    placeholderTextColor="#9ca3af"
                    className="border border-input rounded-lg px-3 py-3 text-base text-foreground mb-3"
                    autoFocus
                    onSubmitEditing={handleCreer}
                  />
                  <View className="flex-row gap-2">
                    <Button
                      onPress={() => { setShowForm(false); setNouveauLibelle(''); }}
                      variant="ghost"
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      onPress={handleCreer}
                      loading={mutCreer.isPending}
                      disabled={!nouveauLibelle.trim()}
                      className="flex-1"
                    >
                      Ajouter
                    </Button>
                  </View>
                </Card>
              ) : (
                <Pressable
                  onPress={() => setShowForm(true)}
                  className="flex-row items-center justify-center gap-2 border border-dashed border-border rounded-xl py-3 active:bg-muted/30"
                >
                  <Text className="text-sm text-primary font-medium">+ Ajouter une denree</Text>
                </Pressable>
              )}
            </View>
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-muted-foreground">Le catalogue est vide.</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}
