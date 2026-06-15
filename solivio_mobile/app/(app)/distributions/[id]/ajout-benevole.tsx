import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { UserPlus, Search } from 'lucide-react-native';
import {
  rechercherMembresAdHoc,
  ajouterBenevoleExistant,
  ajouterVisiteur,
} from '@/lib/api/distributions';
import type { MembreSuggestion, PointageInfoResponse, PointageAdHocResponse } from '@/types/distribution';

type Onglet = 'existant' | 'visiteur';

export default function AjoutBenevoleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [onglet, setOnglet] = useState<Onglet>('existant');

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Ajouter un benevole" showClose modal />
      <SafeAreaView edges={['bottom']} className="flex-1">
        {/* Selecteur d'onglet */}
        <View className="flex-row border-b border-border bg-card">
          {(['existant', 'visiteur'] as Onglet[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setOnglet(tab)}
              className="flex-1 py-3 items-center"
              style={{ borderBottomWidth: 2, borderBottomColor: onglet === tab ? '#0D9488' : 'transparent' }}
            >
              <Text
                className="text-sm font-medium"
                style={{ color: onglet === tab ? '#0D9488' : '#64748B' }}
              >
                {tab === 'existant' ? 'Membre existant' : 'Nouveau visiteur'}
              </Text>
            </Pressable>
          ))}
        </View>

        {onglet === 'existant'
          ? <OngletMembreExistant distributionId={id} />
          : <OngletVisiteur distributionId={id} />
        }
      </SafeAreaView>
    </View>
  );
}

function OngletMembreExistant({ distributionId }: { distributionId: string }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MembreSuggestion[]>([]);
  const [chargement, setChargement] = useState(false);

  const mutAjouter = useMutation<PointageInfoResponse, Error, string>({
    mutationFn: (personneId) => ajouterBenevoleExistant(distributionId, personneId),
    onSuccess: () => router.back(),
  });

  const rechercher = useCallback(async (terme: string) => {
    if (terme.length < 2) { setSuggestions([]); return; }
    setChargement(true);
    try {
      setSuggestions(await rechercherMembresAdHoc(distributionId, terme));
    } catch {
      setSuggestions([]);
    } finally {
      setChargement(false);
    }
  }, [distributionId]);

  return (
    <View className="flex-1 px-4 pt-4 gap-3">
      <View className="flex-row items-center gap-2 bg-card border border-border rounded-xl px-3">
        <Search size={16} color="#94A3B8" />
        <TextInput
          className="flex-1 py-3 text-base text-foreground"
          placeholder="Rechercher par nom ou prenom..."
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={(t) => { setQuery(t); rechercher(t); }}
          autoFocus
        />
        {chargement && <ActivityIndicator size="small" color="#0D9488" />}
      </View>

      {mutAjouter.isError && (
        <Text className="text-sm text-destructive">
          {(mutAjouter.error as { detail?: string })?.detail ?? "Erreur lors de l'ajout."}
        </Text>
      )}

      <FlatList
        data={suggestions}
        keyExtractor={(m) => m.id}
        renderItem={({ item: m }) => (
          <View className="flex-row items-center justify-between py-3 border-b border-border">
            <View className="flex-1 mr-3">
              <Text className="font-medium text-foreground">{m.nom} {m.prenom}</Text>
              <Text className="text-xs text-muted-foreground">{m.email}</Text>
            </View>
            <Pressable
              onPress={() => mutAjouter.mutate(m.id)}
              disabled={mutAjouter.isPending}
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10"
            >
              <UserPlus size={14} color="#0D9488" />
              <Text className="text-sm font-medium text-primary">Ajouter</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          query.length >= 2 && !chargement ? (
            <Text className="text-sm text-muted-foreground text-center mt-8">
              Aucun membre trouve.
            </Text>
          ) : null
        }
      />
    </View>
  );
}

function OngletVisiteur({ distributionId }: { distributionId: string }) {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  const mutAjouter = useMutation<PointageAdHocResponse, Error, void>({
    mutationFn: () => ajouterVisiteur(distributionId, {
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim() || undefined,
      role: role.trim() || undefined,
    }),
    onSuccess: () => router.back(),
  });

  const peutSoumettre = nom.trim().length > 0 && prenom.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
        <View className="gap-4">
          <View className="flex-row gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-xs font-medium text-muted-foreground">Nom *</Text>
              <TextInput
                className="bg-card border border-border rounded-xl px-3 py-3 text-base text-foreground"
                placeholder="Nom"
                placeholderTextColor="#94A3B8"
                value={nom}
                onChangeText={setNom}
                autoFocus
              />
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-xs font-medium text-muted-foreground">Prenom *</Text>
              <TextInput
                className="bg-card border border-border rounded-xl px-3 py-3 text-base text-foreground"
                placeholder="Prenom"
                placeholderTextColor="#94A3B8"
                value={prenom}
                onChangeText={setPrenom}
              />
            </View>
          </View>

          <View className="gap-1">
            <Text className="text-xs font-medium text-muted-foreground">Email (optionnel)</Text>
            <TextInput
              className="bg-card border border-border rounded-xl px-3 py-3 text-base text-foreground"
              placeholder="Pour envoyer une invitation plus tard"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="gap-1">
            <Text className="text-xs font-medium text-muted-foreground">Role (optionnel)</Text>
            <TextInput
              className="bg-card border border-border rounded-xl px-3 py-3 text-base text-foreground"
              placeholder="Ex : Accueil, Distribution..."
              placeholderTextColor="#94A3B8"
              value={role}
              onChangeText={setRole}
            />
          </View>

          {mutAjouter.isError && (
            <Text className="text-sm text-destructive">
              {(mutAjouter.error as { detail?: string })?.detail ?? "Erreur lors de l'ajout."}
            </Text>
          )}

          <Pressable
            onPress={() => mutAjouter.mutate()}
            disabled={!peutSoumettre || mutAjouter.isPending}
            className="rounded-xl py-3.5 items-center mt-2"
            style={{ backgroundColor: peutSoumettre ? '#0D9488' : '#94A3B8' }}
          >
            {mutAjouter.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-semibold text-base">Ajouter au pointage</Text>
            }
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
