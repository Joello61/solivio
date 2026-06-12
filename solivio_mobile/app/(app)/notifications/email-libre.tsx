import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { envoyerEmailLibre, type CibleEmail } from '@/lib/api/notification';

const CIBLES: { value: CibleEmail; label: string }[] = [
  { value: 'BENEVOLES', label: 'Benevoles' },
  { value: 'BENEFICIAIRES', label: 'Beneficiaires' },
  { value: 'COORDINATEURS', label: 'Coordinateurs' },
  { value: 'RESPONSABLES', label: 'Responsables' },
  { value: 'TOUS', label: 'Tous les membres' },
];

const inputStyle = {
  borderWidth: 1,
  borderColor: '#E2E8F0',
  borderRadius: 12,
  backgroundColor: '#FFFFFF',
  paddingHorizontal: 14,
  paddingVertical: 10,
  fontSize: 14,
  color: '#0F172A',
};

export default function EmailLibreScreen() {
  const router = useRouter();
  const [cible, setCible] = useState<CibleEmail>('BENEVOLES');
  const [sujet, setSujet] = useState('');
  const [corps, setCorps] = useState('');
  const [pending, setPending] = useState(false);

  function valider() {
    if (!sujet.trim()) {
      Alert.alert('Champ requis', 'Le sujet est obligatoire.');
      return;
    }
    if (!corps.trim()) {
      Alert.alert('Champ requis', 'Le message est obligatoire.');
      return;
    }
    const cibleLabel = CIBLES.find((c) => c.value === cible)?.label ?? cible;
    Alert.alert(
      'Confirmer l\'envoi',
      `Envoyer ce message a : ${cibleLabel}\n\nSujet : ${sujet}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Envoyer', style: 'default', onPress: envoyer },
      ],
    );
  }

  async function envoyer() {
    setPending(true);
    try {
      await envoyerEmailLibre({ cible, sujet: sujet.trim(), corps: corps.trim() });
      Alert.alert('Succes', 'Message envoye avec succes.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur inattendue');
    } finally {
      setPending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Email aux membres" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>
            Destinataires
          </Text>
          <View style={{ gap: 8 }}>
            {CIBLES.map((c) => (
              <Pressable
                key={c.value}
                onPress={() => setCible(c.value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: cible === c.value ? '#16513F' : '#E2E8F0',
                  backgroundColor: cible === c.value ? '#F0FDF4' : '#FFFFFF',
                }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 2,
                    borderColor: cible === c.value ? '#16513F' : '#CBD5E1',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cible === c.value ? (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#16513F',
                      }}
                    />
                  ) : null}
                </View>
                <Text style={{ fontSize: 14, color: cible === c.value ? '#16513F' : '#374151' }}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151' }}>Sujet *</Text>
          <TextInput
            value={sujet}
            onChangeText={setSujet}
            placeholder="Objet du message"
            style={inputStyle}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151' }}>Message *</Text>
          <TextInput
            value={corps}
            onChangeText={setCorps}
            placeholder="Contenu du message..."
            multiline
            numberOfLines={8}
            style={[inputStyle, { minHeight: 160, textAlignVertical: 'top' }]}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <Button onPress={valider} loading={pending}>
          Verifier avant envoi
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
