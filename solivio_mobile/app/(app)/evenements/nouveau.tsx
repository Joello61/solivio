import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { creerEvenement } from '@/lib/api/evenement';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AdresseAutocompleteInput } from '@/components/distributions/AdresseAutocompleteInput';
import type { TypeEvenement, ModeInscription, PublicCible } from '@/types/evenement';
import type { LieuRequest } from '@/types/distribution';

const TYPES: { value: TypeEvenement; label: string }[] = [
  { value: 'STAND', label: 'Stand' },
  { value: 'FETE', label: 'Fete' },
  { value: 'AUTRE', label: 'Autre' },
];

const MODES: { value: ModeInscription; label: string }[] = [
  { value: 'OBLIGATOIRE', label: 'Obligatoire' },
  { value: 'LIBRE', label: 'Libre' },
  { value: 'SANS_INSCRIPTION', label: 'Sans inscription' },
];

export default function NouvelEvenementScreen() {
  const router = useRouter();
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TypeEvenement>('AUTRE');
  const [lieu, setLieu] = useState<LieuRequest | undefined>(undefined);
  const [mapsApiKey, setMapsApiKey] = useState<string>('');
  const fetchedRef = useRef(false);
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');
  const [aBesoiNStaff, setABesoiNStaff] = useState(true);
  const [capaciteStaff, setCapaciteStaff] = useState('');
  const [ouvertParticipants, setOuvertParticipants] = useState(false);
  const [publicCible, setPublicCible] = useState<PublicCible | ''>('');
  const [capaciteParticipants, setCapaciteParticipants] = useState('');
  const [modeInscription, setModeInscription] = useState<ModeInscription>('OBLIGATOIRE');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch(`${process.env.EXPO_PUBLIC_API_URL ?? ''}/api/public/config`)
      .then((r) => r.json())
      .then((d: { googleMapsApiKey?: string }) => setMapsApiKey(d.googleMapsApiKey ?? ''))
      .catch(() => {});
  }, []);

  async function soumettre() {
    if (!titre.trim() || !debut || !fin) {
      Alert.alert('Champs requis', 'Titre, debut et fin sont obligatoires.');
      return;
    }
    setPending(true);
    try {
      const ev = await creerEvenement({
        titre: titre.trim(),
        description: description.trim() || undefined,
        type,
        // On envoie à la fois l'adresse formatée et le placeId comme le backend l'attend
        lieuAdresseFormatee: lieu?.adresseFormatee ?? undefined,
        lieuPlaceId: lieu?.placeId ?? undefined,
        dateHeureDebut: new Date(debut).toISOString(),
        dateHeureFin: new Date(fin).toISOString(),
        aBesoiNStaff,
        capaciteStaff: capaciteStaff ? Number(capaciteStaff) : undefined,
        ouvertParticipants,
        publicParticipants: publicCible || undefined,
        capaciteParticipants: capaciteParticipants ? Number(capaciteParticipants) : undefined,
        modeInscription,
      });
      router.replace(`/(app)/evenements/${ev.id}` as never);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur inattendue');
    } finally {
      setPending(false);
    }
  }

  const inputStyle = {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 52,
  };

  const label = (text: string) => (
    <Text style={{ fontSize: 14, fontWeight: '500', color: '#0F172A', marginBottom: 6 }}>
      {text}
    </Text>
  );

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Nouvel evenement" showClose modal />
      <SafeAreaView edges={['bottom']} className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: 6 }}>
              {label('Titre *')}
              <TextInput
                value={titre}
                onChangeText={setTitre}
                placeholder="Titre de l'evenement"
                style={inputStyle}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={{ gap: 6 }}>
              {label('Description')}
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Description (optionnel)"
                multiline
                numberOfLines={3}
                style={[inputStyle, { height: 80, textAlignVertical: 'top' }]}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={{ gap: 8 }}>
              {label('Type')}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {TYPES.map((t) => (
                  <Pressable
                    key={t.value}
                    onPress={() => setType(t.value)}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                      backgroundColor: type === t.value ? '#0D9488' : '#F1F5F9',
                    }}
                  >
                    <Text style={{
                      fontSize: 13, fontWeight: '600',
                      color: type === t.value ? '#FFFFFF' : '#64748B',
                    }}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Lieu via AdresseAutocompleteInput — fournit placeId + adresseFormatee au backend */}
            <AdresseAutocompleteInput
              apiKey={mapsApiKey}
              label="Lieu"
              value={lieu?.adresseFormatee}
              onSelect={setLieu}
              onClear={() => setLieu(undefined)}
            />

            <View style={{ gap: 6 }}>
              {label('Debut * (YYYY-MM-DDTHH:MM)')}
              <TextInput
                value={debut}
                onChangeText={setDebut}
                placeholder="2026-09-01T14:00"
                style={inputStyle}
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
              />
            </View>

            <View style={{ gap: 6 }}>
              {label('Fin * (YYYY-MM-DDTHH:MM)')}
              <TextInput
                value={fin}
                onChangeText={setFin}
                placeholder="2026-09-01T20:00"
                style={inputStyle}
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
              />
            </View>

            {/* Besoin staff */}
            <Pressable
              onPress={() => setABesoiNStaff((v) => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <View style={{
                width: 20, height: 20, borderRadius: 6, borderWidth: 2,
                borderColor: aBesoiNStaff ? '#0D9488' : '#CBD5E1',
                backgroundColor: aBesoiNStaff ? '#0D9488' : '#FFFFFF',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {aBesoiNStaff ? (
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>v</Text>
                ) : null}
              </View>
              <Text style={{ fontSize: 14, color: '#374151' }}>Besoin de staff benevole</Text>
            </Pressable>

            {aBesoiNStaff && (
              <View style={{ gap: 6 }}>
                {label('Capacite staff (optionnel)')}
                <TextInput
                  value={capaciteStaff}
                  onChangeText={setCapaciteStaff}
                  keyboardType="number-pad"
                  placeholder="Ex: 10"
                  style={inputStyle}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            )}

            {/* Ouverture participants */}
            <Pressable
              onPress={() => setOuvertParticipants((v) => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <View style={{
                width: 20, height: 20, borderRadius: 6, borderWidth: 2,
                borderColor: ouvertParticipants ? '#0D9488' : '#CBD5E1',
                backgroundColor: ouvertParticipants ? '#0D9488' : '#FFFFFF',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {ouvertParticipants ? (
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>v</Text>
                ) : null}
              </View>
              <Text style={{ fontSize: 14, color: '#374151' }}>Ouvert aux participants</Text>
            </Pressable>

            {ouvertParticipants && (
              <>
                <View style={{ gap: 8 }}>
                  {label('Public cible')}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['BENEVOLES', 'BENEFICIAIRES', 'TOUS'] as PublicCible[]).map((pc) => (
                      <Pressable
                        key={pc}
                        onPress={() => setPublicCible(pc)}
                        style={{
                          flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                          backgroundColor: publicCible === pc ? '#0D9488' : '#F1F5F9',
                        }}
                      >
                        <Text style={{
                          fontSize: 11, fontWeight: '600',
                          color: publicCible === pc ? '#FFFFFF' : '#64748B',
                        }}>
                          {pc === 'BENEVOLES' ? 'Benev.' : pc === 'BENEFICIAIRES' ? 'Benef.' : 'Tous'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={{ gap: 6 }}>
                  {label('Capacite participants (optionnel)')}
                  <TextInput
                    value={capaciteParticipants}
                    onChangeText={setCapaciteParticipants}
                    keyboardType="number-pad"
                    placeholder="Ex: 50"
                    style={inputStyle}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </>
            )}

            {/* Mode inscription */}
            <View style={{ gap: 8 }}>
              {label("Mode d'inscription")}
              {MODES.map((m) => (
                <Pressable
                  key={m.value}
                  onPress={() => setModeInscription(m.value)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}
                >
                  <View style={{
                    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
                    borderColor: modeInscription === m.value ? '#0D9488' : '#CBD5E1',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {modeInscription === m.value ? (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#0D9488' }} />
                    ) : null}
                  </View>
                  <Text style={{ fontSize: 14, color: '#374151' }}>{m.label}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={soumettre}
              disabled={pending}
              style={{
                backgroundColor: '#0D9488', borderRadius: 14, paddingVertical: 14,
                alignItems: 'center', marginTop: 4, opacity: pending ? 0.6 : 1,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                {pending ? 'Creation...' : "Creer l'evenement"}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
